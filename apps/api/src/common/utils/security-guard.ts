import { env } from '../../config/env.js'
import { MinimalRedisClient, parseRedisUrl } from './minimal-redis.js'

type BucketEntry = {
  count: number
  resetAt: number
  lockedUntil: number | null
}

type FailureResult = {
  count: number
  lockedUntil: number | null
}

function countKey(key: string) {
  return `security:count:${key}`
}

function lockKey(key: string) {
  return `security:lock:${key}`
}

class InMemorySecurityStore {
  private buckets = new Map<string, BucketEntry>()

  private getOrCreateBucket(key: string, windowMs: number, now: number) {
    const current = this.buckets.get(key)
    if (!current || current.resetAt <= now) {
      const next = {
        count: 0,
        resetAt: now + windowMs,
        lockedUntil: null
      }
      this.buckets.set(key, next)
      return next
    }

    return current
  }

  async getLock(key: string) {
    const current = this.buckets.get(key)
    if (!current) {
      return null
    }

    if (current.lockedUntil && current.lockedUntil > Date.now()) {
      return current.lockedUntil
    }

    if (current.lockedUntil && current.lockedUntil <= Date.now()) {
      current.lockedUntil = null
      current.count = 0
    }

    return null
  }

  async recordFailure(params: {
    key: string
    windowMs: number
    maxAttempts: number
    lockDurationMs: number
  }): Promise<FailureResult> {
    const now = Date.now()
    const bucket = this.getOrCreateBucket(params.key, params.windowMs, now)

    if (bucket.lockedUntil && bucket.lockedUntil > now) {
      return {
        count: bucket.count,
        lockedUntil: bucket.lockedUntil
      }
    }

    bucket.count += 1
    if (bucket.count >= params.maxAttempts) {
      bucket.lockedUntil = now + params.lockDurationMs
    }

    return {
      count: bucket.count,
      lockedUntil: bucket.lockedUntil
    }
  }

  async clear(key: string) {
    this.buckets.delete(key)
  }
}

class RedisBackedSecurityGuard {
  private readonly fallback = new InMemorySecurityStore()
  private readonly redisClient = env.REDIS_URL ? new MinimalRedisClient(parseRedisUrl(env.REDIS_URL)) : null
  private redisUnavailable = false
  private warnedUnavailable = false
  private lastReconnectAttemptAt = 0
  private reconnectPromise: Promise<boolean> | null = null

  async getLock(key: string) {
    const redis = await this.getRedis()
    if (!redis) {
      return this.fallback.getLock(key)
    }

    try {
      const value = await redis.get(lockKey(key))
      if (!value) {
        return null
      }

      const lockedUntil = Number(value)
      if (!Number.isFinite(lockedUntil) || lockedUntil <= Date.now()) {
        await redis.del(lockKey(key))
        return null
      }

      return lockedUntil
    } catch (error) {
      this.markUnavailable(error)
      return this.fallback.getLock(key)
    }
  }

  async recordFailure(params: {
    key: string
    windowMs: number
    maxAttempts: number
    lockDurationMs: number
  }): Promise<FailureResult> {
    const redis = await this.getRedis()
    if (!redis) {
      return this.fallback.recordFailure(params)
    }

    try {
      const currentLock = await redis.get(lockKey(params.key))
      if (currentLock) {
        const lockedUntil = Number(currentLock)
        if (Number.isFinite(lockedUntil) && lockedUntil > Date.now()) {
          const count = Number((await redis.get(countKey(params.key))) || params.maxAttempts)
          return {
            count,
            lockedUntil
          }
        }
      }

      const count = await redis.incr(countKey(params.key))
      if (count === 1) {
        await redis.expire(countKey(params.key), Math.max(1, Math.ceil(params.windowMs / 1000)))
      }

      let lockedUntil: number | null = null
      if (count >= params.maxAttempts) {
        lockedUntil = Date.now() + params.lockDurationMs
        await redis.set(
          lockKey(params.key),
          String(lockedUntil),
          ['EX', Math.max(1, Math.ceil(params.lockDurationMs / 1000))]
        )
      }

      return {
        count,
        lockedUntil
      }
    } catch (error) {
      this.markUnavailable(error)
      return this.fallback.recordFailure(params)
    }
  }

  async clear(key: string) {
    const redis = await this.getRedis()
    if (redis) {
      try {
        await Promise.all([redis.del(countKey(key)), redis.del(lockKey(key))])
      } catch (error) {
        this.markUnavailable(error)
      }
    }

    await this.fallback.clear(key)
  }

  private async getRedis() {
    if (!this.redisClient) {
      return null
    }

    if (!this.redisUnavailable) {
      return this.redisClient
    }

    const restored = await this.tryReconnect()
    return restored ? this.redisClient : null
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
        this.redisUnavailable = false
        this.warnedUnavailable = false
        return true
      } catch (error) {
        this.markUnavailable(error)
        return false
      } finally {
        this.reconnectPromise = null
      }
    })()

    return this.reconnectPromise
  }

  private markUnavailable(error: unknown) {
    this.redisUnavailable = true

    if (this.warnedUnavailable) {
      return
    }

    this.warnedUnavailable = true
    console.warn('Security guard Redis unavailable; falling back to in-memory protection.', error)
  }
}

export const securityGuard = new RedisBackedSecurityGuard()
