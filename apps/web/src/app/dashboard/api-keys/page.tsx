'use client'

import { useEffect, useState } from 'react'
import { Activity, Copy, Eye, KeyRound, ShieldCheck, Trash2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth-store'
import { apiKeyScopeValues, createApiKeySchema } from '@/lib/validations/settings'
import { Card } from '@/components/ui/card'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/lib/hooks/use-toast'

type ApiKeyItem = {
  id: string
  name: string
  scopes: string[]
  keyPrefix: string
  status: string
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
  revokedAt: string | null
}

type CreateApiKeyResponse = {
  id: string
  name: string
  scopes: string[]
  keyPrefix: string
  status: string
  expiresAt: string | null
  createdAt: string
  apiKey: string
}

type ApiKeyUsage = {
  apiKeyId: string
  requestsLast7Days: number
  topRoutes: Array<{
    route: string
    requests: number
  }>
}

const scopeLabels: Record<(typeof apiKeyScopeValues)[number], string> = {
  'links:read': 'Read links',
  'links:write': 'Write links',
  'analytics:read': 'Read analytics',
  'tags:read': 'Read tags',
  'tags:write': 'Write tags',
  'exports:read': 'Read exports',
  'exports:write': 'Write exports'
}

const MASKED_KEY = '********************************'

export default function ApiKeysPage() {
  const { accessToken, workspaceId, hydrate } = useAuthStore()
  const toast = useToast()

  const [items, setItems] = useState<ApiKeyItem[]>([])
  const [usageByKey, setUsageByKey] = useState<Record<string, ApiKeyUsage>>({})
  const [name, setName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    'links:read',
    'analytics:read'
  ])
  const [newKey, setNewKey] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyItem | null>(null)
  const [revokeBusy, setRevokeBusy] = useState(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const load = async () => {
    if (!accessToken || !workspaceId) return

    try {
      setLoading(true)
      const data = await apiFetch<ApiKeyItem[]>(`/workspaces/${workspaceId}/api-keys`, {
        token: accessToken
      })
      setItems(data)

      const usagePairs = await Promise.all(
        data.map(async (item) => {
          const usage = await apiFetch<ApiKeyUsage>(
            `/workspaces/${workspaceId}/api-keys/${item.id}/usage`,
            {
              token: accessToken
            }
          )

          return [item.id, usage] as const
        })
      )

      setUsageByKey(Object.fromEntries(usagePairs))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [accessToken, workspaceId])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken || !workspaceId) return

    setFieldErrors({})
    setError('')
    setSuccess('')

    const parsed = createApiKeySchema.safeParse({ name, scopes: selectedScopes })

    if (!parsed.success) {
      const nextErrors = Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
      )
      setFieldErrors(nextErrors)
      setError(parsed.error.issues[0]?.message || 'Invalid input')
      return
    }

    try {
      setSubmitting(true)

      const data = await apiFetch<CreateApiKeyResponse>(`/workspaces/${workspaceId}/api-keys`, {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify(parsed.data)
      })

      setNewKey(data.apiKey)
      setRevealed(false)
      setName('')
      setSelectedScopes(['links:read', 'analytics:read'])
      setSuccess('API key created. Reveal and copy it now because it will not be shown again.')
      toast.success('API key created successfully.')
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create API key'
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const toggleScope = (scope: string) => {
    setSelectedScopes((current) =>
      current.includes(scope)
        ? current.filter((item) => item !== scope)
        : [...current, scope]
    )
  }

  const handleRevoke = async (id: string) => {
    if (!accessToken || !workspaceId) return

    try {
      setRevokeBusy(true)
      setError('')
      setSuccess('')

      await apiFetch(`/workspaces/${workspaceId}/api-keys/${id}`, {
        method: 'DELETE',
        token: accessToken
      })

      setSuccess('API key revoked.')
      toast.success('API key revoked.')
      setKeyToRevoke(null)
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke API key'
      setError(message)
      toast.error(message)
    } finally {
      setRevokeBusy(false)
    }
  }

  const copyNewKey = async () => {
    if (!newKey) return
    await navigator.clipboard.writeText(newKey)
    setSuccess('API key copied.')
    toast.success('API key copied.')
  }

  const activeKeys = items.filter((item) => item.status !== 'REVOKED')
  const totalRequests = activeKeys.reduce(
    (sum, item) => sum + (usageByKey[item.id]?.requestsLast7Days || 0),
    0
  )

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <FormMessage error={error} success={success} />

      <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(103,232,249,0.1),rgba(8,19,36,0.92)_38%,rgba(8,19,36,0.98))] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/70">Machine access</p>
            <h1 className="mt-4 text-3xl font-semibold">Secure integrations without overexposing your workspace.</h1>
            <p className="mt-2 max-w-2xl text-white/64">
              Create scoped API keys, review usage, and revoke access cleanly when an integration no longer needs it.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-white/65">
            <span className="rounded-full bg-white/5 px-4 py-2">Active keys: {activeKeys.length}</span>
            <span className="rounded-full bg-white/5 px-4 py-2">7-day requests: {totalRequests}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-cyan-300" size={18} />
            <p className="font-medium text-white">Safer by default</p>
          </div>
          <p className="mt-3 text-sm text-white/55">
            New API keys expire automatically after a safer default window unless you choose a shorter one through the API.
          </p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-5">
          <div className="flex items-center gap-3">
            <Activity className="text-cyan-300" size={18} />
            <p className="font-medium text-white">Observe real usage</p>
          </div>
          <p className="mt-3 text-sm text-white/55">
            Each key tracks recent request counts and top routes so suspicious patterns are easier to spot.
          </p>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-slate-900/70 p-5">
          <div className="flex items-center gap-3">
            <KeyRound className="text-cyan-300" size={18} />
            <p className="font-medium text-white">Scope the minimum</p>
          </div>
          <p className="mt-3 text-sm text-white/55">
            Give every integration only the scopes it needs so a leaked key has far less blast radius.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-400/15 p-3 text-cyan-200">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-xl font-semibold">Create API key</h3>
              <p className="text-white/60">Generate a secure key for programmatic access.</p>
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <TextField
              label="Key name"
              value={name}
              onChange={setName}
              placeholder="Backend integration"
              error={fieldErrors.name}
            />

            <div>
              <p className="mb-2 block text-sm text-white/70">Scopes</p>
              <div className="grid gap-3">
                {apiKeyScopeValues.map((scope) => (
                  <label
                    key={scope}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white/80"
                  >
                    <span>{scopeLabels[scope]}</span>
                    <input
                      type="checkbox"
                      checked={selectedScopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                    />
                  </label>
                ))}
              </div>
              {fieldErrors.scopes ? <p className="mt-2 text-sm text-red-300">{fieldErrors.scopes}</p> : null}
            </div>

            <Button type="submit" disabled={submitting} fullWidth>
              {submitting ? 'Creating...' : 'Create API key'}
            </Button>
          </form>

          {newKey && (
            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
              <p className="text-sm text-amber-200">
                This key will only be shown once. Reveal and copy it now.
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setRevealed((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/85"
                >
                  <Eye size={15} />
                  {revealed ? 'Hide' : 'Reveal'}
                </button>

                <button
                  onClick={copyNewKey}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/85"
                >
                  <Copy size={15} />
                  Copy
                </button>
              </div>

              <div className="mt-4 rounded-xl bg-slate-900 px-3 py-3 font-mono text-sm text-white">
                {revealed ? newKey : MASKED_KEY}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-xl font-semibold">API keys</h3>
          <p className="mt-2 text-white/60">View active and revoked keys with scope and traffic context.</p>

          {items.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No API keys yet"
                description="Create your first API key when you need programmatic access."
                actionLabel="Open settings"
                actionHref="/dashboard/settings"
              />
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-white">{item.name}</p>
                    <p className="mt-1 text-sm text-cyan-300">{item.keyPrefix}...</p>
                    <p className="mt-1 text-xs text-white/45">
                      Created {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                    <p className="mt-1 text-xs text-white/45">
                      Expires {item.expiresAt ? new Date(item.expiresAt).toLocaleDateString() : 'never'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {item.scopes.map((scope) => (
                        <span key={scope} className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
                          {scopeLabels[scope as keyof typeof scopeLabels] || scope}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/70 p-3 text-sm text-white/70">
                      <p>Requests in last 7 days: {usageByKey[item.id]?.requestsLast7Days ?? 0}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(usageByKey[item.id]?.topRoutes || []).slice(0, 3).map((route) => (
                          <span key={route.route} className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                            {route.route} | {route.requests}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
                      {item.status}
                    </span>

                    {item.status !== 'REVOKED' && (
                      <button
                        onClick={() => setKeyToRevoke(item)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-red-500/20 px-3 py-2 text-sm text-red-300"
                      >
                        <Trash2 size={15} />
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(keyToRevoke)}
        title="Revoke API key"
        description="This integration will stop working immediately after revocation."
        confirmLabel="Revoke key"
        cancelLabel="Keep key"
        tone="danger"
        busy={revokeBusy}
        onCancel={() => {
          if (!revokeBusy) setKeyToRevoke(null)
        }}
        onConfirm={() => {
          if (keyToRevoke) void handleRevoke(keyToRevoke.id)
        }}
        details={
          keyToRevoke ? (
            <div className="space-y-2">
              <p className="font-medium text-white">{keyToRevoke.name}</p>
              <p className="text-cyan-300">{keyToRevoke.keyPrefix}...</p>
              <p className="text-white/55">
                Scopes: {keyToRevoke.scopes.map((scope) => scopeLabels[scope as keyof typeof scopeLabels] || scope).join(', ')}
              </p>
            </div>
          ) : null
        }
      />
    </div>
  )
}
