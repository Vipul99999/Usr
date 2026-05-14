import type { FastifyPluginAsync } from 'fastify'
import { OpsService } from './ops.service.js'
import { OpsController } from './ops.controller.js'

export const opsRoutes: FastifyPluginAsync = async (app) => {
  const service = new OpsService(app)
  const controller = new OpsController(service)

  app.get('/workspaces/:workspaceId/ops/overview', {
    preHandler: [app.authenticateUser]
  }, controller.workspaceOverview)

  app.post('/workspaces/:workspaceId/ops/jobs/:jobId/retry', {
    preHandler: [app.authenticateUser],
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '10 minutes'
      }
    }
  }, controller.retryFailedJob)
}
