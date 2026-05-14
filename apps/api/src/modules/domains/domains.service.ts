import { DEFAULT_DOMAIN } from '@repo/shared'
import type { FastifyInstance } from 'fastify'
import { redirectCache } from '../../common/utils/link-cache.js'
import { domainDriftCache } from '../../common/utils/domain-drift-cache.js'
import { AuditService } from '../audit/audit.service.js'
import {
  expectedDomainTargetHost,
  normalizeHostname,
  pointsToExpectedTarget,
  resolveDnsDiagnostics,
  resolveTargetDiagnostics,
  stripPortFromHost
} from '../../common/utils/custom-domains.js'
import { createDomainSchema, updateDomainStatusSchema } from './domains.schemas.js'
import { DomainsRepository } from './domains.repository.js'
import { assertLimit, getWorkspacePlanLimits } from '../../common/utils/workspace-plan-limits.js'

function toPublicDomain(domain: {
  id: string
  hostname: string
  status: string
  verificationToken: string
  verifiedAt: Date | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: domain.id,
    hostname: domain.hostname,
    status: domain.status,
    verifiedAt: domain.verifiedAt,
    createdAt: domain.createdAt,
    updatedAt: domain.updatedAt,
    verificationPath: `/.well-known/url-shortener-domain-verification?token=${domain.verificationToken}`,
    shortBaseUrl: `https://${domain.hostname}`
  }
}

function configuredProtectedHosts() {
  return [process.env.API_URL, process.env.APP_URL, process.env.CUSTOM_DOMAIN_TARGET_HOST]
    .map((value) => stripPortFromHost(value))
    .filter((value): value is string => Boolean(value))
}

export class DomainsService {
  private repo: DomainsRepository
  private audit: AuditService

  constructor(private app: FastifyInstance) {
    this.repo = new DomainsRepository(app)
    this.audit = new AuditService(app)
  }

  async list(workspaceId: string, userId: string) {
    await this.ensureAdmin(workspaceId, userId)
    const domains = await this.repo.listWorkspaceDomains(workspaceId)

    return [
      {
        id: DEFAULT_DOMAIN,
        hostname: DEFAULT_DOMAIN,
        status: 'VERIFIED',
        verifiedAt: null,
        createdAt: new Date(0),
        updatedAt: new Date(0),
        verificationPath: null,
        shortBaseUrl: process.env.API_URL,
        linkCount: 0
      },
      ...(await Promise.all(
        domains.map(async (domain) => ({
          ...toPublicDomain(domain),
          linkCount: await this.repo.countLinksUsingDomain(workspaceId, domain.hostname)
        }))
      ))
    ]
  }

  async create(workspaceId: string, userId: string, input: unknown) {
    const membership = await this.ensureAdmin(workspaceId, userId)
    const data = createDomainSchema.parse(input)
    const limits = getWorkspacePlanLimits(membership.workspace.plan)
    const existingDomains = await this.repo.countWorkspaceDomains(workspaceId)
    try {
      assertLimit({
        current: existingDomains,
        limit: limits.customDomains,
        resourceLabel: 'custom domains',
        upgradeMessage: 'Free workspaces can connect 1 custom domain. Upgrade to Pro for more branded hosts.'
      })
    } catch (error) {
      throw this.app.httpErrors.paymentRequired(
        error instanceof Error ? error.message : 'Plan limit reached'
      )
    }

    let hostname: string
    try {
      hostname = normalizeHostname(data.hostname)
    } catch (error) {
      throw this.app.httpErrors.badRequest(error instanceof Error ? error.message : 'Invalid hostname')
    }

    if (configuredProtectedHosts().includes(hostname)) {
      throw this.app.httpErrors.badRequest('This hostname is reserved for the platform and cannot be claimed as a workspace custom domain')
    }

    const existing = await this.repo.findDomainByHostname(hostname)
    if (existing) {
      throw this.app.httpErrors.conflict('This custom domain is already connected')
    }

    const domain = await this.repo.createDomain(workspaceId, hostname)
    domainDriftCache.invalidate(workspaceId)

    await this.audit.log({
      workspaceId,
      actorUserId: userId,
      action: 'domain.create',
      entityType: 'workspace_domain',
      entityId: domain.id,
      metadataJson: {
        hostname: domain.hostname
      }
    })

    return toPublicDomain(domain)
  }

  async diagnostics(workspaceId: string, domainId: string, userId: string) {
    await this.ensureAdmin(workspaceId, userId)

    const domain = await this.repo.findDomainById(workspaceId, domainId)
    if (!domain) {
      throw this.app.httpErrors.notFound('Custom domain not found')
    }

    const targetHost = expectedDomainTargetHost()
    const [linkCount, dnsInfo, targetDnsInfo] = await Promise.all([
      this.repo.countLinksUsingDomain(workspaceId, domain.hostname),
      resolveDnsDiagnostics(domain.hostname),
      resolveTargetDiagnostics(targetHost)
    ])
    const matchesExpectedTarget = pointsToExpectedTarget(dnsInfo, targetDnsInfo, targetHost)
    const usesRecommendedCname = !targetHost || dnsInfo.cnameRecords.includes(targetHost)

    const issues: string[] = []
    const recommendations: string[] = []

    if (dnsInfo.cnameRecords.length === 0 && dnsInfo.aRecords.length === 0 && dnsInfo.aaaaRecords.length === 0) {
      issues.push('No DNS records were resolved for this hostname yet.')
      recommendations.push('Create a DNS record for this hostname and wait for propagation.')
    }

    if (targetHost && !matchesExpectedTarget) {
      issues.push(`The hostname is not pointing at the expected target ${targetHost}.`)
      recommendations.push(`Point the hostname to ${targetHost} with a CNAME record.`)
    }

    if (targetHost && dnsInfo.cnameRecords.length === 0 && (dnsInfo.aRecords.length > 0 || dnsInfo.aaaaRecords.length > 0)) {
      issues.push('This hostname uses direct A/AAAA records. For a startup deployment, a CNAME is safer and easier to maintain.')
      recommendations.push(`Replace direct A/AAAA records with a CNAME to ${targetHost} unless your edge provider explicitly requires flattening.`)
    }

    if (domain.status === 'PENDING') {
      recommendations.push('Open the verification URL on the custom domain after DNS propagation.')
    }

    if (domain.status === 'DISABLED') {
      recommendations.push('Re-enable the domain after fixing DNS or SSL configuration.')
    }

    if (domain.status === 'VERIFIED' && !matchesExpectedTarget) {
      issues.push('This domain was verified earlier, but current DNS no longer matches the expected target.')
      recommendations.push('Disable the domain until DNS is corrected so campaign traffic does not break unexpectedly.')
    }

    return {
      ...toPublicDomain(domain),
      linkCount,
      expectedTargetHost: targetHost,
      verificationReady: matchesExpectedTarget,
      assignmentAllowed: domain.status === 'VERIFIED' && matchesExpectedTarget,
      canSafelyServeTraffic: domain.status === 'VERIFIED' && matchesExpectedTarget,
      dns: {
        cnameRecords: dnsInfo.cnameRecords,
        aRecords: dnsInfo.aRecords,
        aaaaRecords: dnsInfo.aaaaRecords,
        targetARecords: targetDnsInfo.aRecords,
        targetAaaaRecords: targetDnsInfo.aaaaRecords,
        pointsToExpectedTarget: matchesExpectedTarget,
        usesRecommendedCname
      },
      issues,
      recommendations
    }
  }

  async rotateVerification(workspaceId: string, domainId: string, userId: string) {
    await this.ensureAdmin(workspaceId, userId)

    const domain = await this.repo.findDomainById(workspaceId, domainId)
    if (!domain) {
      throw this.app.httpErrors.notFound('Custom domain not found')
    }

    const updated = await this.repo.rotateVerificationToken(domain.id)
    domainDriftCache.invalidate(workspaceId)

    await this.audit.log({
      workspaceId,
      actorUserId: userId,
      action: 'domain.refresh_verification',
      entityType: 'workspace_domain',
      entityId: domain.id,
      metadataJson: {
        hostname: domain.hostname
      }
    })

    return toPublicDomain(updated)
  }

  async updateStatus(workspaceId: string, domainId: string, userId: string, input: unknown) {
    await this.ensureAdmin(workspaceId, userId)

    const domain = await this.repo.findDomainById(workspaceId, domainId)
    if (!domain) {
      throw this.app.httpErrors.notFound('Custom domain not found')
    }

    const data = updateDomainStatusSchema.parse(input)
    const nextStatus = data.status

    if (nextStatus === 'VERIFIED') {
      throw this.app.httpErrors.badRequest('Use the verification URL to mark a domain as verified')
    }

    const updated = await this.repo.updateDomain(domain.id, {
      status: nextStatus,
      verifiedAt: nextStatus === 'PENDING' ? null : domain.verifiedAt
    })
    domainDriftCache.invalidate(workspaceId)

    await this.audit.log({
      workspaceId,
      actorUserId: userId,
      action: 'domain.update_status',
      entityType: 'workspace_domain',
      entityId: domain.id,
      metadataJson: {
        hostname: domain.hostname,
        status: nextStatus
      }
    })

    return toPublicDomain(updated)
  }

  async delete(workspaceId: string, domainId: string, userId: string) {
    await this.ensureAdmin(workspaceId, userId)

    const domain = await this.repo.findDomainById(workspaceId, domainId)
    if (!domain) {
      throw this.app.httpErrors.notFound('Custom domain not found')
    }

    const [activeLinks, linksUsingDomain] = await Promise.all([
      this.repo.countLinksUsingDomain(workspaceId, domain.hostname),
      this.repo.listLinksUsingDomain(workspaceId, domain.hostname)
    ])

    if (activeLinks > 0) {
      await this.repo.resetLinksToDefaultDomain(workspaceId, domain.hostname)

      await Promise.all(
        linksUsingDomain.map(async (link) => {
          await redirectCache.delete(domain.hostname, link.slug)
          await redirectCache.set({
            id: link.id,
            domain: DEFAULT_DOMAIN,
            slug: link.slug,
            destinationUrl: link.destinationUrl,
            redirectType: link.redirectType,
            status: link.status,
            expiresAt: link.expiresAt?.toISOString() ?? null,
            deletedAt: link.deletedAt?.toISOString() ?? null
          })
        })
      )
    }

    await this.repo.deleteDomain(domain.id)
    domainDriftCache.invalidate(workspaceId)

    await this.audit.log({
      workspaceId,
      actorUserId: userId,
      action: 'domain.delete',
      entityType: 'workspace_domain',
      entityId: domain.id,
      metadataJson: {
        hostname: domain.hostname,
        relinkedLinks: activeLinks
      }
    })

    return { success: true }
  }

  async verifyFromHostname(hostHeader: string | undefined, token: string | undefined) {
    if (!token) {
      throw this.app.httpErrors.badRequest('Verification token is required')
    }

    const hostname = stripPortFromHost(hostHeader)
    if (!hostname) {
      throw this.app.httpErrors.badRequest('Hostname is required')
    }

    const domain = await this.repo.findDomainByVerificationToken(token)
    if (!domain || domain.hostname !== hostname) {
      throw this.app.httpErrors.notFound('Domain verification record not found')
    }

    const targetHost = expectedDomainTargetHost()
    const [dnsInfo, targetDnsInfo] = await Promise.all([
      resolveDnsDiagnostics(domain.hostname),
      resolveTargetDiagnostics(targetHost)
    ])
    const matchesExpectedTarget = pointsToExpectedTarget(dnsInfo, targetDnsInfo, targetHost)

    if (!matchesExpectedTarget) {
      throw this.app.httpErrors.badRequest('DNS is not pointing at the expected target yet')
    }

    if (domain.status === 'VERIFIED') {
      return toPublicDomain(domain)
    }

    const verified = await this.repo.verifyDomain(domain.id)
    domainDriftCache.invalidate(domain.workspaceId)
    return toPublicDomain(verified)
  }

  async ensureVerifiedWorkspaceDomain(workspaceId: string, domain: string) {
    if (domain === DEFAULT_DOMAIN) {
      return
    }

    const existing = await this.repo.findDomainByHostname(domain)
    if (!existing || existing.workspaceId !== workspaceId) {
      throw this.app.httpErrors.badRequest('Selected custom domain is not connected to this workspace')
    }

    if (existing.status !== 'VERIFIED') {
      throw this.app.httpErrors.badRequest('Selected custom domain is not verified yet')
    }
  }

  private async ensureAdmin(workspaceId: string, userId: string) {
    const membership = await this.repo.findAdminMembership(workspaceId, userId)
    if (!membership) {
      throw this.app.httpErrors.forbidden('Access denied')
    }

    return membership
  }
}
