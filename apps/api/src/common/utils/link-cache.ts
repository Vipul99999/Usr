import { env } from '../../config/env.js'
import { MinimalRedisClient, parseRedisUrl } from './minimal-redis.js'

type RedirectCacheValue = {
  id: string
  domain: string
  slug: string
  destinationUrl: string
  redirectType: 'TEMPORARY' | 'PERMANENT'
  status: string
  expiresAt: string | null
  deletedAt: string | null
}

type L1CacheStats = {
  entryCount: number
  totalBytes: number
  maxEntries: number
  maxBytes: number
}

function buildCacheKey(domain: string, slug: string) {
  return `redirect:${domain}:${slug}`
}

class InMemoryRedirectCache {
  private readonly store = new Map<string, { value: string; expiresAt: number; sizeBytes: number }>()
  private totalBytes = 0

  constructor(
    private readonly maxEntries: number,
    private readonly maxBytes: number
  ) {}

  async get(key: string) {
    const entry = this.store.get(key)
    if (!entry) return null

    if (entry.expiresAt <= Date.now()) {
      this.removeEntry(key, entry)
      return null
    }

    this.store.delete(key)
    this.store.set(key, entry)
    return entry.value
  }

  async setEx(key: string, ttlSeconds: number, value: string) {
    const next = {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
      sizeBytes: Buffer.byteLength(value, 'utf8')
    }

    const existing = this.store.get(key)
    if (existing) {
      this.removeEntry(key, existing)
    }

    this.store.set(key, next)
    this.totalBytes += next.sizeBytes
    this.evictIfNeeded()
  }

  async del(key: string) {
    const existing = this.store.get(key)
    if (!existing) return
    this.removeEntry(key, existing)
  }

  getStats(): L1CacheStats {
    return {
      entryCount: this.store.size,
      totalBytes: this.totalBytes,
      maxEntries: this.maxEntries,
      maxBytes: this.maxBytes
    }
  }

  listEntries() {
    const now = Date.now()
    const entries: Array<{ key: string; value: string; ttlSeconds: number }> = []

    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt <= now) {
        this.removeEntry(key, entry)
        continue
      }

      entries.push({
        key,
        value: entry.value,
        ttlSeconds: Math.max(1, Math.ceil((entry.expiresAt - now) / 1000))
      })
    }

    return entries
  }

  private evictIfNeeded() {
    while (this.store.size > this.maxEntries || this.totalBytes > this.maxBytes) {
      const oldestKey = this.store.keys().next().value
      if (!oldestKey) {
        break
      }

      const oldest = this.store.get(oldestKey)
      if (!oldest) {
        this.store.delete(oldestKey)
        continue
      }

      this.removeEntry(oldestKey, oldest)
    }
  }

  private removeEntry(key: string, entry: { sizeBytes: number }) {
    this.store.delete(key)
    this.totalBytes = Math.max(0, this.totalBytes - entry.sizeBytes)
  }
}

class RedirectCache {
  private readonly l1 = new InMemoryRedirectCache(
    env.REDIS_L1_CACHE_MAX_ENTRIES,
    env.REDIS_L1_CACHE_MAX_BYTES
  )
  private readonly redisClient = env.REDIS_URL ? new MinimalRedisClient(parseRedisUrl(env.REDIS_URL)) : null
  private redisUnavailable = false
  private warnedUnavailable = false
  private recoveryLogged = false
  private shouldBackfillRedisFromL1 = false
  private lastRedisHealthCheckAt = 0
  private lastReconnectAttemptAt = 0
  private reconnectPromise: Promise<boolean> | null = null

  async verifyConnection() {
    if (!this.redisClient) return

    try {
      await this.redisClient.ping()
      this.markRedisAvailable()
    } catch (error) {
      this.redisUnavailable = true
      this.warnOnce(error)
    }
  }

  async get(domain: string, slug: string): Promise<RedirectCacheValue | null> {
    const key = buildCacheKey(domain, slug)
    const raw = await this.getRaw(key)
    if (!raw) return null

    try {
      return JSON.parse(raw) as RedirectCacheValue
    } catch {
      await this.delete(domain, slug)
      return null
    }
  }

  async set(value: RedirectCacheValue) {
    const key = buildCacheKey(value.domain, value.slug)
    const payload = JSON.stringify(value)
    await this.setRaw(key, payload)
  }

  async delete(domain: string, slug: string) {
    const key = buildCacheKey(domain, slug)

    if (await this.canUseRedis()) {
      try {
        await this.redisClient?.del(key)
      } catch (error) {
        this.redisUnavailable = true
        this.warnOnce(error)
      }
    }

    await this.l1.del(key)
  }

  getStats() {
    return {
      mode: this.redisClient ? (this.redisUnavailable ? 'l1-only' : 'l1+l2') : 'l1-only',
      redisConfigured: Boolean(this.redisClient),
      l1: this.l1.getStats()
    }
  }

  private async getRaw(key: string) {
    const l1Value = await this.l1.get(key)
    if (l1Value) {
      await this.maybeProbeRedisHealth()

      if (this.redisClient && !this.redisUnavailable && this.shouldBackfillRedisFromL1) {
        try {
          await this.redisClient.setEx(key, env.REDIS_CACHE_TTL_SECONDS, l1Value)
        } catch (error) {
          this.redisUnavailable = true
          this.warnOnce(error)
        }
      }
      return l1Value
    }

    if (await this.canUseRedis()) {
      try {
        const value = await this.redisClient?.get(key)
        if (value) {
          await this.l1.setEx(key, env.REDIS_CACHE_TTL_SECONDS, value)
        }
        return value
      } catch (error) {
        this.redisUnavailable = true
        this.warnOnce(error)
      }
    }

    return null
  }

  private async setRaw(key: string, value: string) {
    if (await this.canUseRedis()) {
      try {
        await this.redisClient?.setEx(key, env.REDIS_CACHE_TTL_SECONDS, value)
      } catch (error) {
        this.redisUnavailable = true
        this.warnOnce(error)
      }
    }

    await this.l1.setEx(key, env.REDIS_CACHE_TTL_SECONDS, value)
  }

  private async canUseRedis() {
    if (!this.redisClient) return false
    if (!this.redisUnavailable) return true

    return this.tryReconnect()
  }

  private async maybeProbeRedisHealth() {
    if (!this.redisClient) {
      return
    }

    const now = Date.now()
    if (now - this.lastRedisHealthCheckAt < env.REDIS_RECONNECT_INTERVAL_MS) {
      return
    }

    this.lastRedisHealthCheckAt = now

    try {
      await this.redisClient.ping()
      if (this.redisUnavailable) {
        this.markRedisAvailable()
      }
    } catch (error) {
      this.redisUnavailable = true
      this.warnOnce(error)
    }
  }

  private async tryReconnect() {
    const now = Date.now()
    if (this.reconnectPromise) {
      return this.reconnectPromise
    }

    if (now - this.lastReconnectAttemptAt < env.REDIS_RECONNECT_INTERVAL_MS) {
      return false
    }

    this.lastReconnectAttemptAt = now
    this.reconnectPromise = (async () => {
      try {
        await this.redisClient?.ping()
        this.markRedisAvailable()
        return true
      } catch (error) {
        this.redisUnavailable = true
        this.warnOnce(error)
        return false
      } finally {
        this.reconnectPromise = null
      }
    })()

    return this.reconnectPromise
  }

  private markRedisAvailable() {
    const wasUnavailable = this.redisUnavailable
    this.redisUnavailable = false
    this.warnedUnavailable = false

    if (wasUnavailable && !this.recoveryLogged) {
      this.recoveryLogged = true
      this.shouldBackfillRedisFromL1 = true
      console.info('Redis cache connection restored; resuming Redis-backed cache operations.')
      void this.syncL1ToRedis()
    }

    if (!wasUnavailable) {
      this.recoveryLogged = false
    }
  }

  private warnOnce(error: unknown) {
    if (this.warnedUnavailable) return

    this.warnedUnavailable = true
    this.recoveryLogged = false
    console.warn('Redis cache unavailable; continuing with bounded in-memory L1 cache.', error)
  }

  private async syncL1ToRedis() {
    if (!this.redisClient || this.redisUnavailable) {
      return
    }

    try {
      for (const entry of this.l1.listEntries()) {
        await this.redisClient.setEx(entry.key, entry.ttlSeconds, entry.value)
      }
      this.shouldBackfillRedisFromL1 = false
    } catch (error) {
      this.redisUnavailable = true
      this.warnOnce(error)
    }
  }
}

export const redirectCache = new RedirectCache()
export type { RedirectCacheValue }
