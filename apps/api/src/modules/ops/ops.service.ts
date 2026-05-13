import type { FastifyInstance } from 'fastify'
import { describeObjectStorage } from '@repo/db'
import {
  expectedDomainTargetHost,
  pointsToExpectedTarget,
  resolveDnsDiagnostics,
  resolveTargetDiagnostics
} from '../../common/utils/custom-domains.js'

export class OpsService {
  constructor(private app: FastifyInstance) {}

  async getWorkspaceOverview(workspaceId: string, userId: string) {
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

    const [pendingExports, failedExports, recentEmailEvents, recentAbuseSignals, domainSummary, activeApiKeys, recentApiKeyEvents, workspaceDomains] =
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
        })
      ])

    const targetHost = expectedDomainTargetHost()
    const targetDnsInfo = await resolveTargetDiagnostics(targetHost)
    const domainDrift = await Promise.all(
      workspaceDomains.map(async (domain) => {
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

    return {
      storage: describeObjectStorage(),
      exportHealth: {
        pendingExports,
        failedExports
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
}
