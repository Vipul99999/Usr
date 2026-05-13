import { env } from '../../config/env.js'

type DomainDriftItem = {
  id: string
  hostname: string
  status: string
  verifiedAt: Date | null
  pointsCorrectly: boolean
  usesRecommendedCname: boolean
  issueCount: number
  issues: string[]
}

class DomainDriftCache {
  private readonly store = new Map<string, { expiresAt: number; value: DomainDriftItem[] }>()

  get(workspaceId: string) {
    const entry = this.store.get(workspaceId)
    if (!entry) return null

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(workspaceId)
      return null
    }

    return entry.value
  }

  set(workspaceId: string, value: DomainDriftItem[]) {
    this.store.set(workspaceId, {
      value,
      expiresAt: Date.now() + env.OPS_DOMAIN_DRIFT_CACHE_TTL_SECONDS * 1000
    })
  }

  invalidate(workspaceId: string) {
    this.store.delete(workspaceId)
  }
}

export const domainDriftCache = new DomainDriftCache()
export type { DomainDriftItem }
