export const DEFAULT_DOMAIN = 'default'

export const WORKSPACE_PLAN = {
  FREE: 'FREE',
  PRO: 'PRO',
  BUSINESS: 'BUSINESS',
  ENTERPRISE: 'ENTERPRISE'
} as const

export type WorkspacePlanName = (typeof WORKSPACE_PLAN)[keyof typeof WORKSPACE_PLAN]

export type WorkspacePlanLimits = {
  workspaces: number | null
  links: number | null
  customDomains: number | null
  members: number | null
  apiKeys: number | null
  monthlyExports: number | null
  analytics: 'basic' | 'advanced'
  support: 'standard' | 'priority'
}

export const WORKSPACE_PLAN_LIMITS: Record<WorkspacePlanName, WorkspacePlanLimits> = {
  FREE: {
    workspaces: 1,
    links: 100,
    customDomains: 1,
    members: 1,
    apiKeys: 3,
    monthlyExports: 3,
    analytics: 'basic',
    support: 'standard'
  },
  PRO: {
    workspaces: 5,
    links: null,
    customDomains: 10,
    members: 25,
    apiKeys: 25,
    monthlyExports: null,
    analytics: 'advanced',
    support: 'priority'
  },
  BUSINESS: {
    workspaces: null,
    links: null,
    customDomains: null,
    members: null,
    apiKeys: null,
    monthlyExports: null,
    analytics: 'advanced',
    support: 'priority'
  },
  ENTERPRISE: {
    workspaces: null,
    links: null,
    customDomains: null,
    members: null,
    apiKeys: null,
    monthlyExports: null,
    analytics: 'advanced',
    support: 'priority'
  }
}

export const MARKETED_WORKSPACE_PLANS = [
  {
    plan: WORKSPACE_PLAN.FREE,
    label: 'Free',
    price: 'Free',
    summary: 'For founders and solo operators getting their first branded links live.',
    cta: 'Start free',
    highlights: [
      '1 workspace',
      '100 branded links',
      '1 custom domain',
      'Basic analytics and QR codes',
      '3 API keys',
      '3 CSV exports per month'
    ]
  },
  {
    plan: WORKSPACE_PLAN.PRO,
    label: 'Pro',
    price: '$15/mo',
    summary: 'For startups, agencies, and small teams running real campaigns.',
    cta: 'Unlock Pro',
    highlights: [
      'Up to 5 workspaces',
      'Unlimited links',
      '10 custom domains',
      '25 team members',
      'Advanced analytics',
      'Unlimited exports and 25 API keys'
    ]
  }
] as const

export const CUSTOM_DOMAIN_STATUS = {
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  DISABLED: 'DISABLED'
} as const

export const JOB_KIND = {
  SEND_VERIFICATION_EMAIL: 'SEND_VERIFICATION_EMAIL',
  SEND_PASSWORD_RESET_EMAIL: 'SEND_PASSWORD_RESET_EMAIL',
  SEND_INVITATION_EMAIL: 'SEND_INVITATION_EMAIL',
  GENERATE_LINKS_EXPORT: 'GENERATE_LINKS_EXPORT',
  PROCESS_CLICK_EVENT: 'PROCESS_CLICK_EVENT'
} as const

export type JobKind = (typeof JOB_KIND)[keyof typeof JOB_KIND]

export const API_KEY_SCOPES = {
  LINKS_READ: 'links:read',
  LINKS_WRITE: 'links:write',
  ANALYTICS_READ: 'analytics:read',
  TAGS_READ: 'tags:read',
  TAGS_WRITE: 'tags:write',
  EXPORTS_READ: 'exports:read',
  EXPORTS_WRITE: 'exports:write'
} as const

export const API_KEY_SCOPE_LIST = Object.values(API_KEY_SCOPES)

export type ApiKeyScope = (typeof API_KEY_SCOPES)[keyof typeof API_KEY_SCOPES]

export type SendVerificationEmailPayload = {
  to: string
  name?: string | null
  verifyUrl: string
  workspaceId?: string | null
  triggeredByUserId?: string | null
}

export type SendPasswordResetEmailPayload = {
  to: string
  name?: string | null
  resetUrl: string
  workspaceId?: string | null
  triggeredByUserId?: string | null
}

export type SendInvitationEmailPayload = {
  to: string
  invitedByName?: string | null
  workspaceName: string
  roleLabel: string
  acceptUrl: string
  workspaceId?: string | null
  triggeredByUserId?: string | null
}

export type GenerateLinksExportPayload = {
  exportJobId: string
  workspaceId: string
  requestedById: string
}

export type ProcessClickEventPayload = {
  linkId: string
  clickedAt: string
  ipHash: string | null
  referrer: string | null
  userAgent: string | null
  country: string | null
  city: string | null
}
