'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth-store'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { buildShortUrl } from '@/lib/urls'
import {
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts'
import { useToast } from '@/lib/hooks/use-toast'

type CampaignOverview = {
  campaign: string
  totalLinks: number
  totalClicks: number
  uniqueClicks: number
  lastClickedAt: string | null
  topLinks: Array<{
    id: string
    title: string | null
    slug: string
    domain: string
    totalClicks: number
    uniqueClicks: number
  }>
  topReferrers: Array<{
    referrerHost: string
    clicks: number
  }>
  deviceBreakdown: Array<{
    deviceType: string
    clicks: number
  }>
  countryBreakdown: Array<{
    country: string
    clicks: number
  }>
  recentClicks: Array<{
    id: string
    clickedAt: string
    country: string | null
    city: string | null
    referrerHost: string | null
    deviceType: string | null
    browser: string | null
    os: string | null
    isBot: boolean
    link: {
      id: string
      title: string | null
      slug: string
      domain: string
    }
  }>
  daily: Array<{
    date: string
    clicks: number
    uniqueClicks: number
  }>
  insights: CampaignWeeklySummary
}

type CampaignWeeklySummary = {
  campaign: string
  period: {
    currentStart: string
    currentEnd: string
    previousStart: string
    previousEnd: string
  }
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
      id: string
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

export default function CampaignDetailPage() {
  const { accessToken, workspaceId, hydrate } = useAuthStore()
  const params = useParams<{ campaign: string }>()
  const queryClient = useQueryClient()
  const toast = useToast()
  const campaign = decodeURIComponent(params.campaign)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const overviewQuery = useQuery({
    queryKey: ['campaign-overview', workspaceId, campaign],
    queryFn: () =>
      apiFetch<CampaignOverview>(`/workspaces/${workspaceId}/campaigns/${encodeURIComponent(campaign)}/overview`, {
        token: accessToken || undefined
      }),
    enabled: !!accessToken && !!workspaceId && !!campaign
  })

  const weeklyQuery = useQuery({
    queryKey: ['campaign-weekly-summary', workspaceId, campaign],
    queryFn: () =>
      apiFetch<CampaignWeeklySummary>(
        `/workspaces/${workspaceId}/campaigns/${encodeURIComponent(campaign)}/weekly-summary`,
        {
          token: accessToken || undefined
        }
      ),
    enabled: !!accessToken && !!workspaceId && !!campaign
  })

  const handleExport = async () => {
    if (!accessToken || !workspaceId) return

    try {
      await apiFetch(`/workspaces/${workspaceId}/exports/campaigns/${encodeURIComponent(campaign)}`, {
        method: 'POST',
        token: accessToken
      })
      toast.success('Campaign export queued. Check Export history for the download.')
      await queryClient.invalidateQueries({ queryKey: ['exports', workspaceId] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to queue campaign export')
    }
  }

  if (overviewQuery.isLoading || weeklyQuery.isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
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
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">Campaign overview</p>
            <h1 className="mt-3 text-3xl font-semibold">{overview.campaign}</h1>
            <p className="mt-3 max-w-3xl text-white/62">
              Review campaign-level performance, what changed this week, and which links are carrying the most weight.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/campaigns/${encodeURIComponent(campaign)}/report`}
              className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/85 transition hover:bg-white/5"
            >
              Open shareable report
            </Link>
            <Button onClick={handleExport}>Export campaign CSV</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="premium-panel rounded-[28px] p-6">
          <p className="text-sm text-white/50">Total links</p>
          <p className="mt-3 text-4xl font-semibold">{overview.totalLinks}</p>
        </div>
        <div className="premium-panel rounded-[28px] p-6">
          <p className="text-sm text-white/50">Total clicks</p>
          <p className="mt-3 text-4xl font-semibold">{overview.totalClicks}</p>
        </div>
        <div className="premium-panel rounded-[28px] p-6">
          <p className="text-sm text-white/50">Unique clicks</p>
          <p className="mt-3 text-4xl font-semibold">{overview.uniqueClicks}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">30-day trend</h2>
            <p className="text-sm text-white/55">Campaign click and unique-traffic movement over time.</p>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview.daily.map((item) => ({
                ...item,
                dateLabel: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="dateLabel" stroke="rgba(255,255,255,0.45)" />
                <YAxis stroke="rgba(255,255,255,0.45)" />
                <Tooltip
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    color: 'white'
                  }}
                />
                <Line type="monotone" dataKey="clicks" stroke="#22d3ee" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="uniqueClicks" stroke="#86efac" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">What changed this week</h2>
          <div className="mt-5 grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Weekly click change</p>
              <p className="mt-2 text-3xl font-semibold">
                {weekly.delta.clicks >= 0 ? '+' : ''}
                {weekly.delta.clicksPct}%
              </p>
              <p className="mt-2 text-sm text-white/58">
                {weekly.current.clicks} clicks this week vs {weekly.previous.clicks} last week.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Weekly unique change</p>
              <p className="mt-2 text-3xl font-semibold">
                {weekly.delta.uniqueClicks >= 0 ? '+' : ''}
                {weekly.delta.uniqueClicksPct}%
              </p>
              <p className="mt-2 text-sm text-white/58">
                {weekly.current.uniqueClicks} unique clicks this week vs {weekly.previous.uniqueClicks} last week.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <h2 className="text-xl font-semibold">Narrative insights</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {weekly.narrative.map((item) => (
            <div key={item} className="rounded-2xl border border-cyan-400/15 bg-cyan-400/5 p-4 text-sm text-white/78">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Top links in this campaign</h2>
          <div className="mt-4 space-y-3">
            {overview.topLinks.length === 0 ? (
              <EmptyState title="No links yet" description="Add campaign links to start ranking performance here." />
            ) : (
              overview.topLinks.map((link) => (
                <div key={link.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{link.title || link.slug}</p>
                      <p className="mt-1 truncate text-sm text-cyan-300">{buildShortUrl(link.slug, link.domain)}</p>
                    </div>
                    <div className="text-right text-sm text-white/70">
                      <p>{link.totalClicks} clicks</p>
                      <p>{link.uniqueClicks} unique</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Leading sources and markets</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Top referrer</p>
              <p className="mt-2 text-lg font-semibold">
                {weekly.highlights.topReferrer?.referrerHost || 'Direct / Unknown'}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Top country</p>
              <p className="mt-2 text-lg font-semibold">
                {weekly.highlights.topCountry?.country || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {overview.topReferrers.map((item) => (
              <div key={item.referrerHost} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
                <span className="truncate text-sm text-white/78">{item.referrerHost}</span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/70">{item.clicks}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
