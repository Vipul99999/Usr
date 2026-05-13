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

function buildCacheKey(domain: string, slug: string) {
  return `redirect:${domain}:${slug}`
}


class InMemoryRedirectCache {
  private readonly store = new Map<string, { value: string; expiresAt: number }>()

  async get(key: string) {
    const entry = this.store.get(key)
    if (!entry) return null

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key)
      return null
    }

    return entry.value
  }

  async setEx(key: string, ttlSeconds: number, value: string) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000
    })
  }

  async del(key: string) {
    this.store.delete(key)
  }
}

class RedirectCache {
  private readonly fallback = new InMemoryRedirectCache()
  private readonly redisClient = env.REDIS_URL ? new MinimalRedisClient(parseRedisUrl(env.REDIS_URL)) : null
  private redisUnavailable = false
  private warnedUnavailable = false
  private recoveryLogged = false
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
      const redisClient = this.redisClient
      try {
        await redisClient?.del(key)
      } catch (error) {
        this.redisUnavailable = true
        this.warnOnce(error)
      }
    }

    await this.fallback.del(key)
  }

  private async getRaw(key: string) {
    if (await this.canUseRedis()) {
      const redisClient = this.redisClient
      try {
        return await redisClient?.get(key)
      } catch (error) {
        this.redisUnavailable = true
        this.warnOnce(error)
      }
    }

    return this.fallback.get(key)
  }

  private async setRaw(key: string, value: string) {
    if (await this.canUseRedis()) {
      const redisClient = this.redisClient
      try {
        await redisClient?.setEx(key, env.REDIS_CACHE_TTL_SECONDS, value)
        return
      } catch (error) {
        this.redisUnavailable = true
        this.warnOnce(error)
      }
    }

    await this.fallback.setEx(key, env.REDIS_CACHE_TTL_SECONDS, value)
  }

  private async canUseRedis() {
    if (!this.redisClient) return false
    if (!this.redisUnavailable) return true

    return this.tryReconnect()
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
    const redisClient = this.redisClient
    this.reconnectPromise = (async () => {
      try {
        await redisClient?.ping()
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
      console.info('Redis cache connection restored; resuming Redis-backed cache operations.')
    }

    if (!wasUnavailable) {
      this.recoveryLogged = false
    }
  }

  private warnOnce(error: unknown) {
    if (this.warnedUnavailable) return

    this.warnedUnavailable = true
    this.recoveryLogged = false
    console.warn('Redis cache unavailable; using in-memory fallback.', error)
  }
}

export const redirectCache = new RedirectCache()
export type { RedirectCacheValue }
