'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth-store'
import { Card } from '@/components/ui/card'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/hooks/use-toast'

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
    source: string
    kind: string
    hostname: string | null
    path: string | null
    actionTaken: string | null
    createdAt: string
  }>
  recentApiKeyEvents: Array<{
    id: string
    method: string
    route: string
    statusCode: number
    latencyMs: number | null
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
    verifiedAt: string | null
    pointsCorrectly: boolean
    usesRecommendedCname: boolean
    issueCount: number
    issues: string[]
  }>
}

export default function SecurityPage() {
  const { accessToken, workspaceId, hydrate } = useAuthStore()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [retryingJobId, setRetryingJobId] = useState<string | null>(null)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const opsQuery = useQuery({
    queryKey: ['workspace-security-ops', workspaceId],
    queryFn: () =>
      apiFetch<OpsOverview>(`/workspaces/${workspaceId}/ops/overview`, {
        token: accessToken || undefined
      }),
    enabled: !!accessToken && !!workspaceId
  })

  const handleRetryJob = async (jobId: string) => {
    if (!accessToken || !workspaceId) return

    try {
      setRetryingJobId(jobId)
      await apiFetch(`/workspaces/${workspaceId}/ops/jobs/${jobId}/retry`, {
        method: 'POST',
        token: accessToken
      })
      toast.success('Job moved back to the queue.')
      await queryClient.invalidateQueries({ queryKey: ['workspace-security-ops', workspaceId] })
      await queryClient.invalidateQueries({ queryKey: ['workspace-ops', workspaceId] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to retry job')
    } finally {
      setRetryingJobId(null)
    }
  }

  if (opsQuery.isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (opsQuery.error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        {opsQuery.error instanceof Error ? opsQuery.error.message : 'Failed to load security overview'}
      </div>
    )
  }

  const ops = opsQuery.data
  const driftedDomains = (ops?.domainDrift || []).filter((item) => item.issueCount > 0)
  const systemLooksCalm =
    driftedDomains.length === 0 &&
    (ops?.recentAbuseSignals.length || 0) === 0 &&
    (ops?.exportHealth.failedExports || 0) === 0 &&
    (ops?.queueHealth.deadLetterJobs || 0) === 0 &&
    (!!ops?.cache.redisConfigured ? ops?.cache.mode === 'l1+l2' : true)

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-white/50">Security center</p>
            <h1 className="mt-2 text-3xl font-semibold">Watch the signals that can quietly break trust.</h1>
            <p className="mt-3 max-w-3xl text-white/65">
              This is the founder view for launch week: abuse spikes, domain drift, API key activity, and the small things
              that can become customer-facing incidents if nobody notices them early.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/5"
          >
            Open domain settings
          </Link>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-white/50">Founder summary</p>
            <h2 className="mt-2 text-2xl font-semibold">
              {systemLooksCalm
                ? 'This workspace looks calm from a trust and operations point of view.'
                : 'A few signals are worth checking before they create user-facing friction.'}
            </h2>
            <p className="mt-2 max-w-3xl text-white/60">
              This blends abuse events, branded-domain drift, export stability, and cache posture into one fast read.
            </p>
          </div>
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              systemLooksCalm
                ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
                : 'border-amber-400/20 bg-amber-500/10 text-amber-100'
            }`}
          >
            {systemLooksCalm ? 'No immediate trust regressions' : 'Review the signals below'}
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <p className="text-sm text-white/50">Abuse signals</p>
          <p className="mt-3 text-4xl font-semibold">{ops?.recentAbuseSignals.length ?? 0}</p>
          <p className="mt-2 text-sm text-white/55">Recent auth, redirect, or API-key incidents</p>
        </Card>
        <Card>
          <p className="text-sm text-white/50">Domain drift alerts</p>
          <p className="mt-3 text-4xl font-semibold">{driftedDomains.length}</p>
          <p className="mt-2 text-sm text-white/55">Connected domains with DNS or routing concerns</p>
        </Card>
        <Card>
          <p className="text-sm text-white/50">Recent API key calls</p>
          <p className="mt-3 text-4xl font-semibold">{ops?.recentApiKeyEvents.length ?? 0}</p>
          <p className="mt-2 text-sm text-white/55">Latest machine-to-machine traffic in this workspace</p>
        </Card>
        <Card>
          <p className="text-sm text-white/50">Storage mode</p>
          <p className="mt-3 text-4xl font-semibold uppercase">{ops?.storage.provider || 'local'}</p>
          <p className="mt-2 text-sm text-white/55">Export and asset delivery backend currently in use</p>
        </Card>
        <Card>
          <p className="text-sm text-white/50">Redirect cache</p>
          <p className="mt-3 text-4xl font-semibold uppercase">{ops?.cache.mode || 'l1-only'}</p>
          <p className="mt-2 text-sm text-white/55">
            {ops?.cache.redisConfigured ? 'Shared cache available across instances' : 'Only local cache is active'}
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-xl font-semibold">Worker queue health</h2>
          <p className="mt-1 text-white/60">Retries, dead letters, and queue age are the quiet signals that tell you if async work is staying healthy.</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Retrying jobs</p>
              <p className="mt-2 text-2xl font-semibold">{ops?.queueHealth.retryingJobs ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Dead letters</p>
              <p className="mt-2 text-2xl font-semibold">{ops?.queueHealth.deadLetterJobs ?? 0}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-sm text-white/50">Oldest pending</p>
              <p className="mt-2 text-2xl font-semibold">
                {ops?.queueHealth.oldestPendingSeconds ? `${Math.floor(ops.queueHealth.oldestPendingSeconds / 60)}m` : '0m'}
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {(ops?.queueHealth.recentFailedJobs || []).length === 0 ? (
              <EmptyState
                title="No dead-letter jobs"
                description="Jobs that exhaust retries will show up here so they can be reviewed before users feel the failure."
              />
            ) : (
              (ops?.queueHealth.recentFailedJobs || []).map((job) => (
                <div key={job.id} className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{job.kind.replace(/_/g, ' ')}</p>
                      <p className="mt-2 text-sm text-white/60">{job.errorMessage || 'No error message captured'}</p>
                      <p className="mt-2 text-xs text-white/45">{new Date(job.updatedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-200">
                        {job.attempts}/{job.maxAttempts}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() => handleRetryJob(job.id)}
                        disabled={retryingJobId === job.id}
                      >
                        {retryingJobId === job.id ? 'Retrying...' : 'Retry job'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Recent request health</h2>
          <p className="mt-1 text-white/60">A compact startup metric view for integration latency and error pressure.</p>

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
            Sample size: {ops?.requestHealth.sampleSize ?? 0} recent machine-auth requests over the last 24 hours. Active workers: {(ops?.queueHealth.activeWorkers || []).length}.
          </div>

          <div className="mt-6 space-y-3">
            {(ops?.queueHealth.recentlyRecoveredJobs || []).length === 0 ? (
              <EmptyState
                title="No recovered jobs yet"
                description="Jobs that succeeded after one or more retries will show up here as the system handles noisy real-world conditions."
              />
            ) : (
              (ops?.queueHealth.recentlyRecoveredJobs || []).map((job) => (
                <div key={job.id} className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-white">{job.kind.replace(/_/g, ' ')}</p>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-200">
                      recovered after {job.attempts} attempts
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/45">{new Date(job.updatedAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Domain health drift</h2>
            <p className="mt-1 text-white/60">Catch branded domains that look connected but are no longer safe for live traffic.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {driftedDomains.length === 0 ? (
            <EmptyState
              title="No domain drift detected"
              description="Connected domains currently match the expected target and do not show major routing issues."
            />
          ) : (
            driftedDomains.map((domain) => (
              <div key={domain.id} className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-medium text-white">{domain.hostname}</p>
                    <p className="mt-1 text-sm text-white/60">
                      Status: {domain.status} {domain.verifiedAt ? `| Verified ${new Date(domain.verifiedAt).toLocaleString()}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-white/70">
                      Points correctly: {domain.pointsCorrectly ? 'Yes' : 'No'}
                    </span>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-white/70">
                      Recommended CNAME: {domain.usesRecommendedCname ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm text-amber-100/90">
                  {domain.issues.map((issue) => (
                    <p key={issue}>{issue}</p>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-xl font-semibold">Recent abuse signals</h2>
          <p className="mt-1 text-white/60">Use these to spot redirect probing, auth pressure, or machine-auth trouble early.</p>

          <div className="mt-6 space-y-3">
            {(ops?.recentAbuseSignals || []).length === 0 ? (
              <EmptyState
                title="No recent abuse signals"
                description="This workspace has not triggered recent redirect, auth, or machine-auth abuse warnings."
              />
            ) : (
              (ops?.recentAbuseSignals || []).map((signal) => (
                <div key={signal.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-white">{signal.kind.replace(/_/g, ' ')}</p>
                    <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs text-amber-200">
                      {signal.actionTaken || 'flagged'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/55">
                    {signal.source} {signal.hostname ? `| ${signal.hostname}` : ''} {signal.path ? `| ${signal.path}` : ''}
                  </p>
                  <p className="mt-2 text-xs text-white/45">{new Date(signal.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold">Recent API key traffic</h2>
          <p className="mt-1 text-white/60">A quick machine-auth pulse so you can spot noisy or failing integrations early.</p>

          <div className="mt-6 space-y-3">
            {(ops?.recentApiKeyEvents || []).length === 0 ? (
              <EmptyState
                title="No recent API key traffic"
                description="Machine-to-machine activity will appear here once an integration starts sending requests."
                actionLabel="Open API keys"
                actionHref="/dashboard/api-keys"
              />
            ) : (
              (ops?.recentApiKeyEvents || []).map((event) => (
                <div key={event.id} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium text-white">{event.apiKey.name}</p>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
                      {event.statusCode}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-white/55">
                    {event.method} {event.route} | Prefix {event.apiKey.keyPrefix}
                  </p>
                  <p className="mt-2 text-xs text-white/45">
                    {new Date(event.createdAt).toLocaleString()}
                    {typeof event.latencyMs === 'number' ? ` | ${event.latencyMs} ms` : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
