import type { FastifyInstance } from 'fastify'
import { describeObjectStorage, Prisma } from '@repo/db'
import {
  expectedDomainTargetHost,
  pointsToExpectedTarget,
  resolveDnsDiagnostics,
  resolveTargetDiagnostics
} from '../../common/utils/custom-domains.js'
import { domainDriftCache, type DomainDriftItem } from '../../common/utils/domain-drift-cache.js'
import { redirectCache } from '../../common/utils/link-cache.js'
import { AuditService } from '../audit/audit.service.js'

export class OpsService {
  private audit: AuditService

  constructor(private app: FastifyInstance) {
    this.audit = new AuditService(app)
  }

  async getWorkspaceOverview(workspaceId: string, userId: string) {
    await this.ensureAdmin(workspaceId, userId)

    const recentWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const activeWorkerThreshold = new Date(Date.now() - 5 * 60 * 1000)

    const [
      pendingExports,
      failedExports,
      recentEmailEvents,
      recentAbuseSignals,
      domainSummary,
      activeApiKeys,
      recentApiKeyEvents,
      workspaceDomains,
      queueCounts,
      recentFailedJobs,
      oldestPendingJob,
      activeWorkerJobs,
      recentlyRecoveredJobs,
      recentLatencyEvents
    ] =
      await Promise.all([
        this.app.prisma.exportJob.count({
          where: {
            workspaceId,
            status: {
              in: ['PENDING', 'PROCESSING']
            }
          }
        }),
        this.app.prisma.exportJob.count({
          where: {
            workspaceId,
            status: 'FAILED'
          }
        }),
        this.app.prisma.emailDeliveryEvent.findMany({
          where: { workspaceId },
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true,
            provider: true,
            emailType: true,
            recipient: true,
            eventType: true,
            status: true,
            createdAt: true
          }
        }),
        this.app.prisma.abuseSignal.findMany({
          where: { workspaceId },
          orderBy: { createdAt: 'desc' },
          take: 8,
          select: {
            id: true,
            source: true,
            kind: true,
            hostname: true,
            path: true,
            actionTaken: true,
            createdAt: true
          }
        }),
        this.app.prisma.workspaceDomain.groupBy({
          by: ['status'],
          where: { workspaceId },
          _count: {
            status: true
          }
        }),
        this.app.prisma.apiKey.count({
          where: {
            workspaceId,
            status: 'ACTIVE'
          }
        }),
        this.app.prisma.apiKeyRequestEvent.findMany({
          where: {
            apiKey: {
              workspaceId
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 8,
          select: {
            id: true,
            method: true,
            route: true,
            statusCode: true,
            latencyMs: true,
            createdAt: true,
            apiKey: {
              select: {
                name: true,
                keyPrefix: true
              }
            }
          }
        }),
        this.app.prisma.workspaceDomain.findMany({
          where: { workspaceId },
          select: {
            id: true,
            hostname: true,
            status: true,
            verifiedAt: true
          }
        }),
        this.app.prisma.job.groupBy({
          by: ['status'],
          _count: {
            status: true
          }
        }),
        this.app.prisma.job.findMany({
          where: {
            status: 'FAILED'
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 8,
          select: {
            id: true,
            kind: true,
            attempts: true,
            maxAttempts: true,
            errorMessage: true,
            updatedAt: true,
            lockedBy: true
          }
        }),
        this.app.prisma.job.findFirst({
          where: {
            status: {
              in: ['PENDING', 'PROCESSING']
            }
          },
          orderBy: {
            availableAt: 'asc'
          },
          select: {
            availableAt: true,
            status: true
          }
        }),
        this.app.prisma.job.findMany({
          where: {
            status: 'PROCESSING',
            lockedAt: {
              gte: activeWorkerThreshold
            },
            lockedBy: {
              not: null
            }
          },
          select: {
            lockedBy: true,
            lockedAt: true,
            kind: true
          },
          take: 20
        }),
        this.app.prisma.job.findMany({
          where: {
            status: 'COMPLETED',
            attempts: {
              gt: 0
            },
            updatedAt: {
              gte: recentWindowStart
            }
          },
          orderBy: {
            updatedAt: 'desc'
          },
          take: 8,
          select: {
            id: true,
            kind: true,
            attempts: true,
            updatedAt: true
          }
        }),
        this.app.prisma.apiKeyRequestEvent.findMany({
          where: {
            apiKey: {
              workspaceId
            },
            latencyMs: {
              not: null
            },
            createdAt: {
              gte: recentWindowStart
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 200,
          select: {
            latencyMs: true,
            statusCode: true
          }
        })
      ])

    let domainDrift = domainDriftCache.get(workspaceId)

    if (!domainDrift) {
      const targetHost = expectedDomainTargetHost()
      const targetDnsInfo = await resolveTargetDiagnostics(targetHost)
      domainDrift = await Promise.all(
        workspaceDomains.map(async (domain): Promise<DomainDriftItem> => {
          const dns = await resolveDnsDiagnostics(domain.hostname)
          const pointsCorrectly = pointsToExpectedTarget(dns, targetDnsInfo, targetHost)
          const usesRecommendedCname = !targetHost || dns.cnameRecords.includes(targetHost)

          const issues: string[] = []
          if (!pointsCorrectly) {
            issues.push('DNS no longer points to the expected target')
          }

          if (pointsCorrectly && !usesRecommendedCname && (dns.aRecords.length > 0 || dns.aaaaRecords.length > 0)) {
            issues.push('Direct A/AAAA records detected instead of the recommended CNAME setup')
          }

          if (domain.status === 'VERIFIED' && !pointsCorrectly) {
            issues.push('Verified domain may fail live traffic until DNS is corrected')
          }

          return {
            id: domain.id,
            hostname: domain.hostname,
            status: domain.status,
            verifiedAt: domain.verifiedAt,
            pointsCorrectly,
            usesRecommendedCname,
            issueCount: issues.length,
            issues
          }
        })
      )
      domainDriftCache.set(workspaceId, domainDrift)
    }

    const queueStatusCounts = Object.fromEntries(
      queueCounts.map((item: { status: string; _count: { status: number } }) => [item.status, item._count.status])
    ) as Record<string, number>
    const retryingJobs = (queueStatusCounts.PENDING || 0) + (queueStatusCounts.PROCESSING || 0)
    const activeWorkers = Array.from(
      new Set(activeWorkerJobs.map((job) => job.lockedBy).filter((value): value is string => Boolean(value)))
    )
    const oldestPendingSeconds = oldestPendingJob
      ? Math.max(0, Math.floor((Date.now() - oldestPendingJob.availableAt.getTime()) / 1000))
      : 0
    const recentLatencyValues = recentLatencyEvents
      .map((event) => event.latencyMs)
      .filter((value): value is number => typeof value === 'number')
      .sort((a, b) => a - b)
    const averageLatencyMs =
      recentLatencyValues.length > 0
        ? Math.round(recentLatencyValues.reduce((sum, value) => sum + value, 0) / recentLatencyValues.length)
        : null
    const p95LatencyMs =
      recentLatencyValues.length > 0
        ? recentLatencyValues[Math.min(recentLatencyValues.length - 1, Math.floor(recentLatencyValues.length * 0.95))]
        : null
    const errorRateLast24h =
      recentLatencyEvents.length > 0
        ? Math.round(
            (recentLatencyEvents.filter((event) => event.statusCode >= 400).length / recentLatencyEvents.length) * 100
          )
        : 0

    return {
      storage: describeObjectStorage(),
      cache: redirectCache.getStats(),
      exportHealth: {
        pendingExports,
        failedExports
      },
      queueHealth: {
        pendingJobs: queueStatusCounts.PENDING || 0,
        processingJobs: queueStatusCounts.PROCESSING || 0,
        completedJobs: queueStatusCounts.COMPLETED || 0,
        deadLetterJobs: queueStatusCounts.FAILED || 0,
        retryingJobs,
        oldestPendingSeconds,
        activeWorkers,
        recentFailedJobs,
        recentlyRecoveredJobs
      },
      requestHealth: {
        sampleSize: recentLatencyEvents.length,
        averageLatencyMs,
        p95LatencyMs,
        errorRateLast24h
      },
      activeApiKeys,
      domainHealth: domainSummary.map((item: { status: string; _count: { status: number } }) => ({
        status: item.status,
        count: item._count.status
      })),
      recentEmailEvents,
      recentAbuseSignals,
      recentApiKeyEvents,
      domainDrift
    }
  }

  async retryFailedJob(workspaceId: string, userId: string, jobId: string) {
    await this.ensureAdmin(workspaceId, userId)

    const job = await this.app.prisma.job.findUnique({
      where: { id: jobId }
    })

    if (!job || job.status !== 'FAILED') {
      throw this.app.httpErrors.notFound('Failed job not found')
    }

    const jobWorkspaceId = await this.resolveJobWorkspaceId(job.payloadJson)
    if (jobWorkspaceId !== workspaceId) {
      throw this.app.httpErrors.forbidden('This failed job does not belong to the current workspace')
    }

    const retried = await this.app.prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'PENDING',
        attempts: 0,
        maxAttempts: Math.max(job.maxAttempts, 5),
        availableAt: new Date(),
        lockedAt: null,
        lockedBy: null,
        completedAt: null,
        errorMessage: null,
        resultJson: Prisma.JsonNull
      },
      select: {
        id: true,
        kind: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        availableAt: true
      }
    })

    await this.audit.log({
      workspaceId,
      actorUserId: userId,
      action: 'job.retry',
      entityType: 'job',
      entityId: jobId,
      metadataJson: {
        kind: job.kind,
        previousAttempts: job.attempts
      }
    })

    return retried
  }

  private async ensureAdmin(workspaceId: string, userId: string) {
    const membership = await this.app.prisma.workspaceMember.findFirst({
      where: {
        workspaceId,
        userId,
        role: {
          in: ['OWNER', 'ADMIN']
        }
      },
      select: { id: true }
    })

    if (!membership) {
      throw this.app.httpErrors.forbidden('Access denied')
    }

    return membership
  }

  private async resolveJobWorkspaceId(payloadJson: unknown) {
    if (!payloadJson || typeof payloadJson !== 'object') {
      return null
    }

    const payload = payloadJson as {
      workspaceId?: string
      exportJobId?: string
      linkId?: string
    }

    if (payload.workspaceId) {
      return payload.workspaceId
    }

    if (payload.exportJobId) {
      const exportJob = await this.app.prisma.exportJob.findUnique({
        where: { id: payload.exportJobId },
        select: { workspaceId: true }
      })
      return exportJob?.workspaceId ?? null
    }

    if (payload.linkId) {
      const link = await this.app.prisma.link.findUnique({
        where: { id: payload.linkId },
        select: { workspaceId: true }
      })
      return link?.workspaceId ?? null
    }

    return null
  }
}
