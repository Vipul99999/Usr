import { describeObjectStorage } from '@repo/db'
import { FastifyPluginAsync } from 'fastify'
import { env } from '../../config/env.js'
import { redirectCache } from '../../common/utils/link-cache.js'

export const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async () => {
    let storage: ReturnType<typeof describeObjectStorage> | { provider: 'error'; message: string }
    try {
      storage = describeObjectStorage()
    } catch (error) {
      storage = {
        provider: 'error',
        message: error instanceof Error ? error.message : 'Object storage is not configured correctly'
      }
    }

    return {
      ok: true,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      objectStorage: storage,
      cache: redirectCache.getStats()
    }
  })

  app.get('/ready', async () => {
    await app.prisma.$queryRaw`SELECT 1`

    const cache = redirectCache.getStats()
    const degradedReasons: string[] = []
    let storage: ReturnType<typeof describeObjectStorage> | { provider: 'error'; message: string }

    try {
      storage = describeObjectStorage()
    } catch (error) {
      storage = {
        provider: 'error',
        message: error instanceof Error ? error.message : 'Object storage is not configured correctly'
      }
      degradedReasons.push('Object storage is not configured correctly')
    }

    if (env.NODE_ENV === 'production' && !cache.redisConfigured) {
      degradedReasons.push('Redis is not configured in production')
    }

    if (env.NODE_ENV === 'production' && cache.mode !== 'l1+l2') {
      degradedReasons.push('Shared redirect cache is not fully healthy')
    }

    return {
      ok: degradedReasons.length === 0,
      status: degradedReasons.length === 0 ? 'ready' : 'degraded',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      objectStorage: storage,
      cache,
      degradedReasons
    }
  })
}
