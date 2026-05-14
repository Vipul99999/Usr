'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth-store'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonCard } from '@/components/ui/skeleton-card'

type CampaignSummary = {
  campaign: string
  totalLinks: number
  totalClicks: number
  uniqueClicks: number
  lastClickedAt: string | null
  createdAt: string | null
}

export default function CampaignsPage() {
  const { accessToken, workspaceId, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const campaignsQuery = useQuery({
    queryKey: ['campaigns', workspaceId],
    queryFn: () =>
      apiFetch<CampaignSummary[]>(`/workspaces/${workspaceId}/campaigns`, {
        token: accessToken || undefined
      }),
    enabled: !!accessToken && !!workspaceId
  })

  if (campaignsQuery.isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (campaignsQuery.error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        {campaignsQuery.error instanceof Error ? campaignsQuery.error.message : 'Failed to load campaigns'}
      </div>
    )
  }

  const campaigns = campaignsQuery.data || []

  return (
    <div className="grid gap-6">
      <Card>
        <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">Campaign reporting</p>
        <h1 className="mt-3 text-3xl font-semibold">Turn link activity into campaign stories.</h1>
        <p className="mt-3 max-w-3xl text-white/62">
          Review campaign-level performance, weekly movement, strongest links, and cleaner
          reporting views for your team or clients.
        </p>
      </Card>

      {campaigns.length === 0 ? (
        <EmptyState
          title="No campaign-tagged links yet"
          description="Add campaign names when creating links to unlock campaign summaries, weekly reporting, and cleaner exports."
          actionLabel="Open link studio"
          actionHref="/dashboard/links"
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {campaigns.map((campaign) => (
            <div key={campaign.campaign} className="premium-panel rounded-[28px] p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm text-white/50">Campaign</p>
                  <h2 className="mt-2 text-2xl font-semibold">{campaign.campaign}</h2>
                  <p className="mt-2 text-sm text-white/58">
                    {campaign.lastClickedAt
                      ? `Last active ${new Date(campaign.lastClickedAt).toLocaleString()}`
                      : 'No recent clicks yet'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/campaigns/${encodeURIComponent(campaign.campaign)}`}
                    className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/85 transition hover:bg-white/5"
                  >
                    View
                  </Link>
                  <Link
                    href={`/dashboard/campaigns/${encodeURIComponent(campaign.campaign)}/report`}
                    className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                  >
                    Report
                  </Link>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs text-white/50">Links</p>
                  <p className="mt-2 text-2xl font-semibold">{campaign.totalLinks}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs text-white/50">Clicks</p>
                  <p className="mt-2 text-2xl font-semibold">{campaign.totalClicks}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs text-white/50">Unique</p>
                  <p className="mt-2 text-2xl font-semibold">{campaign.uniqueClicks}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
