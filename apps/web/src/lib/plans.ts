export const WORKSPACE_PLAN_LIMITS = {
  FREE: {
    links: 100,
    customDomains: 1,
    members: 1,
    apiKeys: 3,
    monthlyExports: 3,
    analytics: 'basic'
  },
  PRO: {
    links: null,
    customDomains: 10,
    members: 25,
    apiKeys: 25,
    monthlyExports: null,
    analytics: 'advanced'
  },
  BUSINESS: {
    links: null,
    customDomains: null,
    members: null,
    apiKeys: null,
    monthlyExports: null,
    analytics: 'advanced'
  },
  ENTERPRISE: {
    links: null,
    customDomains: null,
    members: null,
    apiKeys: null,
    monthlyExports: null,
    analytics: 'advanced'
  }
} as const

export const MARKETED_WORKSPACE_PLANS = [
  {
    plan: 'FREE',
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
    plan: 'PRO',
    label: 'Pro',
    price: '$15',
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

export type WebWorkspacePlan = keyof typeof WORKSPACE_PLAN_LIMITS
