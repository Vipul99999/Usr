import type { WorkspacePlan } from '@repo/db'
import { WORKSPACE_PLAN, WORKSPACE_PLAN_LIMITS, type WorkspacePlanName } from '@repo/shared'

export function normalizeWorkspacePlan(plan: WorkspacePlan | string | null | undefined): WorkspacePlanName {
  if (plan && plan in WORKSPACE_PLAN_LIMITS) {
    return plan as WorkspacePlanName
  }

  return WORKSPACE_PLAN.FREE
}

export function getWorkspacePlanLimits(plan: WorkspacePlan | string | null | undefined) {
  return WORKSPACE_PLAN_LIMITS[normalizeWorkspacePlan(plan)]
}

export function assertLimit(options: {
  current: number
  limit: number | null
  resourceLabel: string
  upgradeMessage?: string
}): void {
  if (options.limit === null) {
    return
  }

  if (options.current >= options.limit) {
    throw new Error(
      options.upgradeMessage ||
        `Your current plan allows ${options.limit} ${options.resourceLabel}. Upgrade to Pro for more capacity.`
    )
  }
}
