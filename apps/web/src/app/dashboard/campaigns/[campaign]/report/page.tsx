'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth-store'
import { Button } from '@/components/ui/button'
import { SkeletonCard } from '@/components/ui/skeleton-card'

type CampaignWeeklySummary = {
  campaign: string
  current: {
    clicks: number
    uniqueClicks: number
  }
  previous: {
    clicks: number
    uniqueClicks: number
  }
  delta: {
    clicks: number
    clicksPct: number
    uniqueClicks: number
    uniqueClicksPct: number
  }
  highlights: {
    topLink: {
      title: string | null
      slug: string
      domain: string
      totalClicks: number
    } | null
    topReferrer: {
      referrerHost: string
      clicks: number
    } | null
    topCountry: {
      country: string
      clicks: number
    } | null
  }
  narrative: string[]
}

type CampaignOverview = {
  campaign: string
  totalLinks: number
  totalClicks: number
  uniqueClicks: number
  lastClickedAt: string | null
}

export default function CampaignReportPage() {
  const { accessToken, workspaceId, hydrate } = useAuthStore()
  const params = useParams<{ campaign: string }>()
  const campaign = decodeURIComponent(params.campaign)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const overviewQuery = useQuery({
    queryKey: ['campaign-report-overview', workspaceId, campaign],
    queryFn: () =>
      apiFetch<CampaignOverview>(`/workspaces/${workspaceId}/campaigns/${encodeURIComponent(campaign)}/overview`, {
        token: accessToken || undefined
      }),
    enabled: !!accessToken && !!workspaceId && !!campaign
  })

  const weeklyQuery = useQuery({
    queryKey: ['campaign-report-weekly', workspaceId, campaign],
    queryFn: () =>
      apiFetch<CampaignWeeklySummary>(`/workspaces/${workspaceId}/campaigns/${encodeURIComponent(campaign)}/weekly-summary`, {
        token: accessToken || undefined
      }),
    enabled: !!accessToken && !!workspaceId && !!campaign
  })

  if (overviewQuery.isLoading || weeklyQuery.isLoading) {
    return (
      <div className="grid gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  const error = overviewQuery.error || weeklyQuery.error
  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        {error instanceof Error ? error.message : 'Failed to load campaign report'}
      </div>
    )
  }

  const overview = overviewQuery.data!
  const weekly = weeklyQuery.data!

  return (
    <div className="grid gap-6">
      <div className="premium-panel-strong rounded-[32px] bg-[linear-gradient(135deg,rgba(182,251,255,0.14),rgba(7,18,33,0.96)_44%,rgba(7,18,33,0.99))] p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/75">Shareable campaign report</p>
            <h1 className="mt-3 text-4xl font-semibold">{overview.campaign}</h1>
            <p className="mt-3 max-w-3xl text-white/64">
              A cleaner summary view you can share with teammates, founders, or clients when they need the headline story quickly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              Copy report URL
            </Button>
            <Button onClick={() => window.print()}>Print / save PDF</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Campaign links</p>
          <p className="mt-3 text-4xl font-semibold">{overview.totalLinks}</p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Total clicks</p>
          <p className="mt-3 text-4xl font-semibold">{overview.totalClicks}</p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Unique clicks</p>
          <p className="mt-3 text-4xl font-semibold">{overview.uniqueClicks}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-white/46">This week</p>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm text-white/50">Click trend</p>
              <p className="mt-2 text-3xl font-semibold">
                {weekly.delta.clicks >= 0 ? '+' : ''}
                {weekly.delta.clicksPct}%
              </p>
              <p className="mt-2 text-sm text-white/60">
                {weekly.current.clicks} clicks this week compared with {weekly.previous.clicks} the week before.
              </p>
            </div>
            <div>
              <p className="text-sm text-white/50">Unique traffic trend</p>
              <p className="mt-2 text-3xl font-semibold">
                {weekly.delta.uniqueClicks >= 0 ? '+' : ''}
                {weekly.delta.uniqueClicksPct}%
              </p>
              <p className="mt-2 text-sm text-white/60">
                {weekly.current.uniqueClicks} unique clicks this week compared with {weekly.previous.uniqueClicks} last week.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-white/46">Narrative summary</p>
          <div className="mt-4 space-y-3">
            {weekly.narrative.map((item) => (
              <div key={item} className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4 text-sm text-white/80">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Top link</p>
          <p className="mt-3 text-xl font-semibold">
            {weekly.highlights.topLink?.title || weekly.highlights.topLink?.slug || 'No data yet'}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {weekly.highlights.topLink ? `${weekly.highlights.topLink.totalClicks} clicks` : 'No top link yet'}
          </p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Top referrer</p>
          <p className="mt-3 text-xl font-semibold">
            {weekly.highlights.topReferrer?.referrerHost || 'Direct / Unknown'}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {weekly.highlights.topReferrer ? `${weekly.highlights.topReferrer.clicks} clicks` : 'No source data yet'}
          </p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-white/50">Top country</p>
          <p className="mt-3 text-xl font-semibold">
            {weekly.highlights.topCountry?.country || 'Unknown'}
          </p>
          <p className="mt-2 text-sm text-white/60">
            {weekly.highlights.topCountry ? `${weekly.highlights.topCountry.clicks} clicks` : 'No geographic data yet'}
          </p>
        </div>
      </div>
    </div>
  )
}
