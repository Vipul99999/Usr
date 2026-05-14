import type { FastifyReply, FastifyRequest } from 'fastify'
import type { OpsService } from './ops.service.js'

export class OpsController {
  constructor(private service: OpsService) {}

  workspaceOverview = async (request: FastifyRequest, reply: FastifyReply) => {
    const { workspaceId } = request.params as { workspaceId: string }
    const result = await this.service.getWorkspaceOverview(workspaceId, request.authUser.userId)
    return reply.send(result)
  }

  retryFailedJob = async (request: FastifyRequest, reply: FastifyReply) => {
    const { workspaceId, jobId } = request.params as { workspaceId: string; jobId: string }
    const result = await this.service.retryFailedJob(workspaceId, request.authUser.userId, jobId)
    return reply.send(result)
  }
}
