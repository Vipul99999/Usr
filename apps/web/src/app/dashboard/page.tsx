'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth-store'
import { Card } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { formatWorkspaceRole } from '@/lib/utils/roles'
import { buildShortUrl } from '@/lib/urls'
import { WORKSPACE_PLAN_LIMITS } from '@/lib/plans'

type MeResponse = {
  id: string
  email: string
  name: string | null
  createdAt: string
}

type WorkspaceMembership = {
  id: string
  role: string
  joinedAt: string
  workspace: {
    id: string
    name: string
    slug: string
    brandingTitle: string | null
    plan: string
    createdAt: string
  }
}

type WorkspaceAnalytics = {
  totalLinks: number
  totalClicks: number
  uniqueClicks: number
}

type OpsOverview = {
  storage: {
    provider: string
  }
  cache: {
    mode: string
    redisConfigured: boolean
    l1: {
      entryCount: number
      totalBytes: number
      maxEntries: number
      maxBytes: number
    }
  }
  queueHealth: {
    pendingJobs: number
    processingJobs: number
    completedJobs: number
    deadLetterJobs: number
    retryingJobs: number
    oldestPendingSeconds: number
    activeWorkers: string[]
    recentFailedJobs: Array<{
      id: string
      kind: string
      attempts: number
      maxAttempts: number
      errorMessage: string | null
      updatedAt: string
      lockedBy: string | null
    }>
    recentlyRecoveredJobs: Array<{
      id: string
      kind: string
      attempts: number
      updatedAt: string
    }>
  }
  requestHealth: {
    sampleSize: number
    averageLatencyMs: number | null
    p95LatencyMs: number | null
    errorRateLast24h: number
  }
  exportHealth: {
    pendingExports: number
    failedExports: number
  }
  activeApiKeys: number
  domainHealth: Array<{
    status: string
    count: number
  }>
  recentAbuseSignals: Array<{
    id: string
    kind: string
    actionTaken: string | null
    createdAt: string
  }>
  recentEmailEvents: Array<{
    id: string
    provider: string
    eventType: string
    status: string | null
    createdAt: string
  }>
  recentApiKeyEvents: Array<{
    id: string
    statusCode: number
    createdAt: string
    apiKey: {
      name: string
      keyPrefix: string
    }
  }>
  domainDrift: Array<{
    id: string
    hostname: string
    status: string
    pointsCorrectly: boolean
    usesRecommendedCname: boolean
    issueCount: number
    issues: string[]
  }>
}

type LinkItem = {
  id: string
  title: string | null
  domain: string
  slug: string
  destinationUrl: string
  campaign: string | null
  status: string
  totalClicks: number
  createdAt: string
}

type CampaignSummary = {
  campaign: string
  totalLinks: number
  totalClicks: number
  uniqueClicks: number
  lastClickedAt: string | null
  createdAt: string | null
}

export default function DashboardPage() {
  const { accessToken, workspaceId, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () =>
      apiFetch<MeResponse>('/auth/me', {
        token: accessToken || undefined
      }),
    enabled: !!accessToken
  })

  const workspaceQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: () =>
      apiFetch<WorkspaceMembership[]>('/workspaces', {
        token: accessToken || undefined
      }),
    enabled: !!accessToken
  })

  const analyticsQuery = useQuery({
    queryKey: ['workspace-summary', workspaceId],
    queryFn: () =>
      apiFetch<WorkspaceAnalytics>(`/workspaces/${workspaceId}/analytics/summary`, {
        token: accessToken || undefined
      }),
    enabled: !!accessToken && !!workspaceId
  })

  const linksQuery = useQuery({
    queryKey: ['workspace-links', workspaceId],
    queryFn: () =>
      apiFetch<LinkItem[]>(`/workspaces/${workspaceId}/links`, {
        token: accessToken || undefined
      }),
    enabled: !!accessToken && !!workspaceId
  })

  const opsQuery = useQuery({
    queryKey: ['workspace-ops', workspaceId],
    queryFn: () =>
      apiFetch<OpsOverview>(`/workspaces/${workspaceId}/ops/overview`, {
        token: accessToken || undefined
      }),
    enabled: !!accessToken && !!workspaceId
  })

  const campaignsQuery = useQuery({
    queryKey: ['campaigns-preview', workspaceId],
    queryFn: () =>
      apiFetch<CampaignSummary[]>(`/workspaces/${workspaceId}/campaigns`, {
        token: accessToken || undefined
      }),
    enabled: !!accessToken && !!workspaceId
  })

  const loading =
    meQuery.isLoading ||
    workspaceQuery.isLoading ||
    analyticsQuery.isLoading ||
    linksQuery.isLoading ||
    opsQuery.isLoading ||
    campaignsQuery.isLoading

  const error =
    meQuery.error ||
    workspaceQuery.error ||
    analyticsQuery.error ||
    linksQuery.error ||
    opsQuery.error ||
    campaignsQuery.error

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        {error instanceof Error ? error.message : 'Failed to load dashboard'}
      </div>
    )
  }

  const user = meQuery.data
  const workspace =
    workspaceQuery.data?.find((item) => item.workspace.id === workspaceId) ||
    workspaceQuery.data?.[0]

  const analytics = analyticsQuery.data
  const ops = opsQuery.data
  const topLinks = [...(linksQuery.data || [])]
    .sort((a, b) => b.totalClicks - a.totalClicks)
    .slice(0, 5)
  const driftedDomains = (ops?.domainDrift || []).filter((item) => item.issueCount > 0)
  const failedEmailEvents = (ops?.recentEmailEvents || []).filter(
    (item) => item.status && !['sent', 'delivered', 'received'].includes(item.status.toLowerCase())
  )
  const degradedSignals = [
    ops?.cache.redisConfigured === false ? 'Redis not configured' : null,
    ops?.cache.redisConfigured && ops.cache.mode !== 'l1+l2' ? 'Shared cache degraded' : null,
    (ops?.exportHealth.failedExports || 0) > 0 ? 'Failed exports need review' : null,
    (ops?.queueHealth.deadLetterJobs || 0) > 0 ? 'Worker dead-letter jobs need attention' : null,
    (ops?.queueHealth.retryingJobs || 0) > 3 ? 'Job retries are building up' : null,
    driftedDomains.length > 0 ? 'Branded domains need DNS attention' : null,
    (ops?.recentAbuseSignals.length || 0) > 0 ? 'Recent abuse signals detected' : null,
    failedEmailEvents.length > 0 ? 'Recent email delivery issues detected' : null
  ].filter(Boolean) as string[]
  const confidenceTone =
    degradedSignals.length === 0
      ? 'bg-emerald-500/10 text-emerald-200 border-emerald-400/20'
      : 'bg-amber-500/10 text-amber-100 border-amber-400/20'

  const readinessItems = [
    {
      label: 'Create your first link',
      done: (linksQuery.data || []).length > 0,
      hint: 'Launch a short URL so analytics and QR tools have something to work with.'
    },
    {
      label: 'Connect a branded domain',
      done: (ops?.domainHealth || []).some((item) => item.status === 'VERIFIED'),
      hint: 'Branded links improve trust and make the product feel real to customers.'
    },
    {
      label: 'Name one campaign',
      done: (campaignsQuery.data || []).length > 0,
      hint: 'Campaign labels unlock weekly summaries, report pages, and cleaner exports.'
    },
    {
      label: 'Set up machine access',
      done: (ops?.activeApiKeys || 0) > 0,
      hint: 'Create a scoped API key when your workflow needs automation or integrations.'
    },
    {
      label: 'Verify exports and worker flow',
      done: (ops?.queueHealth.deadLetterJobs || 0) === 0 && (ops?.exportHealth.failedExports || 0) === 0,
      hint: 'Healthy background jobs keep analytics, exports, and delivery feeling trustworthy.'
    }
  ]
  const recommendedAction = (() => {
    if ((linksQuery.data || []).length === 0) {
      return {
        title: 'Create your first live link',
        description: 'This unlocks analytics, copy/share, QR, and the first real feedback loop for the product.',
        href: '/dashboard/links',
        action: 'Open link studio'
      }
    }

    if (!(ops?.domainHealth || []).some((item) => item.status === 'VERIFIED')) {
      return {
        title: 'Connect one branded domain',
        description: 'A branded short host is the fastest way to make the product feel more trustworthy to end users.',
        href: '/dashboard/settings',
        action: 'Open domain settings'
      }
    }

    if ((campaignsQuery.data || []).length === 0) {
      return {
        title: 'Create your first named campaign',
        description: 'Campaign naming unlocks reporting, weekly summaries, exports, and a much cleaner story for your team.',
        href: '/dashboard/links',
        action: 'Name a campaign'
      }
    }

    if ((ops?.queueHealth.deadLetterJobs || 0) > 0 || (ops?.exportHealth.failedExports || 0) > 0) {
      return {
        title: 'Clear background job friction',
        description: 'Fixing failed exports or dead-letter jobs protects the product from quiet trust regressions.',
        href: '/dashboard/security',
        action: 'Review security and ops'
      }
    }

    if ((ops?.activeApiKeys || 0) === 0) {
      return {
        title: 'Create one scoped API key',
        description: 'Machine access is useful for internal automations, reports, and launch-week experiments.',
        href: '/dashboard/api-keys',
        action: 'Open API keys'
      }
    }

    return {
      title: 'Push one real campaign',
      description: 'At this stage, the highest-value product improvement comes from watching real traffic, not guessing.',
      href: '/dashboard/analytics',
      action: 'Open analytics'
    }
  })()
  const planLimits = workspace
    ? WORKSPACE_PLAN_LIMITS[(workspace.workspace.plan in WORKSPACE_PLAN_LIMITS
        ? workspace.workspace.plan
        : 'FREE') as keyof typeof WORKSPACE_PLAN_LIMITS]
    : null

  return (
    <div className="grid gap-6">
      <Card>
        <p className="text-sm text-white/50">Welcome back</p>
        <h1 className="mt-2 text-3xl font-semibold">
          {workspace?.workspace.brandingTitle || workspace?.workspace.name}
        </h1>
        <p className="mt-3 max-w-2xl text-white/65">
          Hello {user?.name || user?.email}. Here&apos;s the current performance snapshot for your
          workspace.
        </p>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-white/50">System confidence</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {degradedSignals.length === 0
                ? 'Core systems look calm for customers right now.'
                : 'A few trust signals need attention before they become customer-facing.'}
            </h2>
            <p className="mt-2 max-w-3xl text-white/60">
              This is the founder view of operational confidence: cache posture, export stability,
              branded-domain safety, and recent abuse pressure.
            </p>
          </div>
          <div className={`rounded-2xl border px-4 py-3 text-sm ${confidenceTone}`}>
            {degradedSignals.length === 0 ? 'All core trust signals look healthy' : `${degradedSignals.length} signals need review`}
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-sm text-white/50">Redirect cache</p>
            <p className="mt-2 text-2xl font-semibold uppercase">{ops?.cache.mode || 'l1-only'}</p>
            <p className="mt-2 text-sm text-white/55">
              {ops?.cache.redisConfigured ? 'Redis/Upstash connected for shared cache use.' : 'Only local L1 cache is active right now.'}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-sm text-white/50">Domain drift</p>
            <p className="mt-2 text-2xl font-semibold">{driftedDomains.length}</p>
            <p className="mt-2 text-sm text-white/55">Connected domains with live routing or DNS concerns.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-sm text-white/50">Failed exports</p>
            <p className="mt-2 text-2xl font-semibold">{ops?.exportHealth.failedExports ?? 0}</p>
            <p className="mt-2 text-sm text-white/55">Background export jobs that need attention.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-sm text-white/50">Recent machine traffic</p>
            <p className="mt-2 text-2xl font-semibold">{ops?.recentApiKeyEvents.length ?? 0}</p>
            <p className="mt-2 text-sm text-white/55">Recent API-key calls reaching this workspace.</p>
          </div>
        </div>

        <div className="mt-6">
          {degradedSignals.length === 0 ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 text-sm text-emerald-100">
              Redirect performance, exports, branded-domain safety, and recent abuse signals all look stable from this workspace view.
            </div>
          ) : (
            <div className="space-y-3">
              {degradedSignals.map((signal) => (
                <div key={signal} className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-4 text-sm text-amber-100">
                  {signal}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-white/50">Startup launch checklist</p>
            <h2 className="mt-2 text-2xl font-semibold">Make this workspace feel production-ready fast.</h2>
            <p className="mt-2 max-w-2xl text-white/60">
              These are the highest-impact actions for a new team: ship one live link, add a branded
              domain, and secure one integration path.
            </p>
          </div>
          <span className="rounded-full bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            {readinessItems.filter((item) => item.done).length}/{readinessItems.length} complete
          </span>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {readinessItems.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium text-white">{item.label}</p>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    item.done ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-white/60'
                  }`}
                >
                  {item.done ? 'Done' : 'Next'}
                </span>
              </div>
              <p className="mt-3 text-sm text-white/55">{item.hint}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-white/50">Next best move</p>
            <h2 className="mt-2 text-2xl font-semibold">{recommendedAction.title}</h2>
            <p className="mt-2 max-w-2xl text-white/60">{recommendedAction.description}</p>
          </div>
          <Link
            href={recommendedAction.href}
            className="inline-flex items-center justify-center rounded-[18px] border border-cyan-200/40 bg-[linear-gradient(135deg,#b6fbff,#4ce8f7_48%,#59d7c5)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_16px_34px_rgba(52,214,232,0.22)]"
          >
            {recommendedAction.action}
          </Link>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-white/50">First-user activation</p>
            <h2 className="mt-2 text-2xl font-semibold">What to do in your first 15 minutes</h2>
            <p className="mt-2 max-w-3xl text-white/60">
              The product becomes much more valuable once you publish one branded link, group it under a campaign, and open one report.
            </p>
          </div>
          <Link
            href={(campaignsQuery.data || []).length > 0 ? '/dashboard/campaigns' : '/dashboard/links'}
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/85 transition hover:bg-white/5"
          >
            {(campaignsQuery.data || []).length > 0 ? 'Open campaign hub' : 'Start in link studio'}
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Step 1</p>
            <h3 className="mt-2 text-lg font-semibold">Publish one branded link</h3>
            <p className="mt-2 text-sm text-white/58">
              Use a clean slug and, if possible, a verified domain. This creates the first real trust moment for your audience.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Step 2</p>
            <h3 className="mt-2 text-lg font-semibold">Group it under a campaign</h3>
            <p className="mt-2 text-sm text-white/58">
              Naming campaigns turns links into reportable work instead of isolated URLs.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Step 3</p>
            <h3 className="mt-2 text-lg font-semibold">Share the weekly story</h3>
            <p className="mt-2 text-sm text-white/58">
              Open the campaign report view, copy the report URL, or export a CSV when the team needs a quick update.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/dashboard/links"
          className="rounded-[28px] border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <p className="text-sm text-white/50">Quick action</p>
          <h3 className="mt-2 text-xl font-semibold">Create and manage links</h3>
          <p className="mt-2 text-white/60">
            Launch new short URLs and manage existing ones.
          </p>
        </Link>

        <Link
          href="/dashboard/analytics"
          className="rounded-[28px] border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <p className="text-sm text-white/50">Quick action</p>
          <h3 className="mt-2 text-xl font-semibold">View analytics</h3>
          <p className="mt-2 text-white/60">
            Track clicks, top links, and workspace activity.
          </p>
        </Link>

        <Link
          href="/dashboard/settings"
          className="rounded-[28px] border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <p className="text-sm text-white/50">Quick action</p>
          <h3 className="mt-2 text-xl font-semibold">Update settings</h3>
          <p className="mt-2 text-white/60">
            Manage profile, members, and workspace branding.
          </p>
        </Link>

        <Link
          href="/dashboard/security"
          className="rounded-[28px] border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
        >
          <p className="text-sm text-white/50">Quick action</p>
          <h3 className="mt-2 text-xl font-semibold">Review security signals</h3>
          <p className="mt-2 text-white/60">
            Watch abuse events, API key activity, and domain drift before they become customer-facing.
          </p>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-white/50">Total links</p>
          <p className="mt-3 text-4xl font-semibold">{analytics?.totalLinks ?? 0}</p>
        </Card>

        <Card>
          <p className="text-sm text-white/50">Total clicks</p>
          <p className="mt-3 text-4xl font-semibold">{analytics?.totalClicks ?? 0}</p>
        </Card>

        <Card>
          <p className="text-sm text-white/50">Unique clicks</p>
          <p className="mt-3 text-4xl font-semibold">{analytics?.uniqueClicks ?? 0}</p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Top links</h2>
              <p className="mt-1 text-white/60">Best performing links in this workspace</p>
            </div>
            <Link
              href="/dashboard/links"
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5"
            >
              View all
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {topLinks.length === 0 ? (
              <EmptyState
                title="No links yet"
                description="Create your first short link to start seeing top performers here."
                actionLabel="Create links"
                actionHref="/dashboard/links"
              />
            ) : (
              topLinks.map((link, index) => (
                <Link
                  key={link.id}
                  href={`/dashboard/links/${link.id}`}
                  className="block rounded-2xl border border-white/10 bg-slate-900/70 p-4 transition hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-xs text-cyan-200">
                          #{index + 1}
                        </span>
                        <p className="truncate font-medium text-white">
                          {link.title || link.slug}
                        </p>
                      </div>
                      <p className="mt-2 truncate text-sm text-cyan-300">
                        {buildShortUrl(link.slug, link.domain)}
                      </p>
                      <p className="mt-2 truncate text-xs text-white/45">
                        Campaign: {link.campaign || 'Not set'}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/70">
                      {link.totalClicks} clicks
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Workspace details</h2>
          <div className="mt-6 space-y-4 text-sm">
            <div>
              <p className="text-white/50">Workspace name</p>
              <p className="mt-1 font-medium text-white">{workspace?.workspace.name}</p>
            </div>
            <div>
              <p className="text-white/50">Plan</p>
              <p className="mt-1 font-medium text-white">{workspace?.workspace.plan}</p>
            </div>
            <div>
              <p className="text-white/50">Role</p>
              <p className="mt-1 font-medium text-white">{formatWorkspaceRole(workspace?.role)}</p>
            </div>
            <div>
              <p className="text-white/50">Slug</p>
              <p className="mt-1 font-medium text-cyan-300">{workspace?.workspace.slug}</p>
            </div>
          </div>

          {planLimits ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white/65">
              <p className="font-medium text-white">Current capacity</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <p>Links: {planLimits.links ?? 'Unlimited'}</p>
                <p>Custom domains: {planLimits.customDomains ?? 'Unlimited'}</p>
                <p>Members: {planLimits.members ?? 'Unlimited'}</p>
                <p>Exports per month: {planLimits.monthlyExports ?? 'Unlimited'}</p>
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Operations pulse</h2>
              <p className="mt-1 text-white/60">Storage, cache posture, exports, and API access at a glance.</p>
            </div>
            <Link
              href="/dashboard/settings"
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5"
            >
              Open settings
            </Link>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Object storage</p>
              <p className="mt-2 text-2xl font-semibold uppercase">{ops?.storage.provider || 'local'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Cache mode</p>
              <p className="mt-2 text-2xl font-semibold uppercase">{ops?.cache.mode || 'l1-only'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Active API keys</p>
              <p className="mt-2 text-2xl font-semibold">{ops?.activeApiKeys ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Exports waiting</p>
              <p className="mt-2 text-2xl font-semibold">{ops?.exportHealth.pendingExports ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Failed exports</p>
              <p className="mt-2 text-2xl font-semibold">{ops?.exportHealth.failedExports ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Retrying jobs</p>
              <p className="mt-2 text-2xl font-semibold">{ops?.queueHealth.retryingJobs ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Dead-letter jobs</p>
              <p className="mt-2 text-2xl font-semibold">{ops?.queueHealth.deadLetterJobs ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Trust and delivery</h2>
          <p className="mt-1 text-white/60">Recent abuse flags and domain health for this workspace.</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {(ops?.domainHealth || []).length === 0 ? (
              <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/60">No custom domains yet</span>
            ) : (
              (ops?.domainHealth || []).map((item) => (
                <span key={item.status} className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/70">
                  {item.status}: {item.count}
                </span>
              ))
            )}
          </div>

          <div className="mt-6 space-y-3">
            {(ops?.recentAbuseSignals || []).length === 0 ? (
              <p className="text-sm text-white/55">No recent abuse signals in this workspace.</p>
            ) : (
              (ops?.recentAbuseSignals || []).map((signal) => (
                <div key={signal.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-white">{signal.kind.replace(/_/g, ' ')}</p>
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-200">
                      {signal.actionTaken || 'flagged'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/45">{new Date(signal.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-xl font-semibold">Worker reliability</h2>
          <p className="mt-1 text-white/60">Keep background processing visible so exports and async delivery never quietly drift.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Active workers</p>
              <p className="mt-2 text-2xl font-semibold">{ops?.queueHealth.activeWorkers.length ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Oldest pending job</p>
              <p className="mt-2 text-2xl font-semibold">
                {ops?.queueHealth.oldestPendingSeconds ? `${Math.floor(ops.queueHealth.oldestPendingSeconds / 60)}m` : '0m'}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {(ops?.queueHealth.recentFailedJobs || []).length === 0 ? (
              <EmptyState
                title="No dead-letter jobs"
                description="Failed worker jobs will show up here once something exhausts its retries."
              />
            ) : (
              (ops?.queueHealth.recentFailedJobs || []).map((job) => (
                <div key={job.id} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-white">{job.kind.replace(/_/g, ' ')}</p>
                    <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-200">
                      {job.attempts}/{job.maxAttempts} attempts
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/60">{job.errorMessage || 'No error message captured'}</p>
                  <p className="mt-2 text-xs text-white/45">{new Date(job.updatedAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Request health</h2>
          <p className="mt-1 text-white/60">Startup-grade performance signals from recent machine traffic and integration activity.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Avg latency</p>
              <p className="mt-2 text-2xl font-semibold">
                {typeof ops?.requestHealth.averageLatencyMs === 'number' ? `${ops.requestHealth.averageLatencyMs} ms` : 'n/a'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">P95 latency</p>
              <p className="mt-2 text-2xl font-semibold">
                {typeof ops?.requestHealth.p95LatencyMs === 'number' ? `${ops.requestHealth.p95LatencyMs} ms` : 'n/a'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Error rate</p>
              <p className="mt-2 text-2xl font-semibold">{ops?.requestHealth.errorRateLast24h ?? 0}%</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white/62">
            Sample size: {ops?.requestHealth.sampleSize ?? 0} recent machine-auth requests from the last 24 hours.
          </div>
        </Card>
      </div>
    </div>
  )
}
