'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth-store'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { SkeletonCard } from '@/components/ui/skeleton-card'
import { TextField } from '@/components/ui/text-field'
import { Button } from '@/components/ui/button'
import { FormMessage } from '@/components/ui/form-message'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useToast } from '@/lib/hooks/use-toast'
import { formatWorkspaceRole } from '@/lib/utils/roles'
import { z } from 'zod'

type Member = {
  id: string
  role: string
  joinedAt: string
  user: {
    id: string
    email: string
    name: string | null
    avatarUrl: string | null
    emailVerified: boolean
    createdAt: string
  }
}

type Invitation = {
  id: string
  email: string
  role: string
  expiresAt: string
  createdAt: string
  invitedBy: {
    id: string
    email: string
    name: string | null
  }
}

const inviteSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  role: z.enum(['ADMIN', 'MEMBER'])
})

function formatFriendlyDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export default function MembersPage() {
  const { accessToken, workspaceId, hydrate } = useAuthStore()
  const queryClient = useQueryClient()
  const toast = useToast()

  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'ADMIN' | 'MEMBER'>('MEMBER')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null)
  const [revoking, setRevoking] = useState(false)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const membersQuery = useQuery({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () =>
      apiFetch<Member[]>(`/workspaces/${workspaceId}/members`, {
        token: accessToken || undefined
      }),
    enabled: !!accessToken && !!workspaceId
  })

  const invitationsQuery = useQuery({
    queryKey: ['workspace-invitations', workspaceId],
    queryFn: () =>
      apiFetch<Invitation[]>(`/workspaces/${workspaceId}/invitations`, {
        token: accessToken || undefined
      }),
    enabled: !!accessToken && !!workspaceId
  })

  const members = membersQuery.data || []
  const invitations = invitationsQuery.data || []

  const stats = useMemo(
    () => [
      {
        label: 'Active members',
        value: String(members.length),
        description: 'People with current workspace access'
      },
      {
        label: 'Pending invites',
        value: String(invitations.length),
        description: 'Invitations waiting for acceptance'
      },
      {
        label: 'Default role',
        value: 'Member',
        description: 'Best for day-to-day collaboration'
      }
    ],
    [invitations.length, members.length]
  )

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken || !workspaceId) return

    setFieldErrors({})
    setFormError('')
    setFormSuccess('')

    const parsed = inviteSchema.safeParse({ email, role })

    if (!parsed.success) {
      const nextErrors = Object.fromEntries(
        parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message])
      )
      setFieldErrors(nextErrors)
      setFormError(parsed.error.issues[0]?.message || 'Invalid input')
      return
    }

    try {
      setSubmitting(true)

      await apiFetch(`/workspaces/${workspaceId}/invitations`, {
        method: 'POST',
        token: accessToken,
        body: JSON.stringify(parsed.data)
      })

      setEmail('')
      setRole('MEMBER')
      setFormSuccess('Invitation sent successfully.')
      toast.success('Invitation sent successfully.')

      await queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation'
      setFormError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleRevoke = async () => {
    if (!accessToken || !workspaceId || !revokeTarget) return

    try {
      setRevoking(true)
      await apiFetch(`/workspaces/${workspaceId}/invitations/${revokeTarget.id}`, {
        method: 'DELETE',
        token: accessToken
      })

      toast.success('Invitation revoked.')
      setRevokeTarget(null)
      await queryClient.invalidateQueries({ queryKey: ['workspace-invitations', workspaceId] })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to revoke invitation')
    } finally {
      setRevoking(false)
    }
  }

  if (membersQuery.isLoading || invitationsQuery.isLoading) {
    return (
      <div className="grid gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (membersQuery.error || invitationsQuery.error) {
    const error = membersQuery.error || invitationsQuery.error
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
        {error instanceof Error ? error.message : 'Failed to load members'}
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-6">
        <Card className="overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <div className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200/90">
                Team workspace
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Invite the people who will keep links moving.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                Bring in marketers, founders, or client teammates without slowing your setup down. Members can launch links,
                review analytics, and help keep campaigns healthy from one workspace.
              </p>

              <form onSubmit={handleInvite} className="mt-8 grid gap-4 lg:grid-cols-[1fr_180px_auto]">
                <div>
                  <TextField
                    label="Email"
                    value={email}
                    onChange={setEmail}
                    placeholder="teammate@example.com"
                    error={fieldErrors.email}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-white/70">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'ADMIN' | 'MEMBER')}
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-300/50"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button type="submit" disabled={submitting} fullWidth>
                    {submitting ? 'Sending...' : 'Send invite'}
                  </Button>
                </div>
              </form>

              <div className="mt-4">
                <FormMessage error={formError} success={formSuccess} />
              </div>
            </div>

            <div className="grid gap-4">
              {stats.map((item) => (
                <div key={item.label} className="rounded-[26px] border border-white/10 bg-slate-900/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/45">{item.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-white/58">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Pending invitations</h2>
              <p className="mt-2 text-white/60">
                Keep an eye on who has been invited, when their access expires, and who sent the invite.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/65">
              {invitations.length} pending
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {invitations.length === 0 ? (
              <EmptyState
                title="No pending invitations"
                description="When you invite someone, their acceptance status will appear here until they join or you revoke the invite."
              />
            ) : (
              invitations.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-4 rounded-[26px] border border-white/10 bg-slate-900/70 p-5 lg:grid-cols-[1fr_auto]"
                >
                  <div className="grid gap-3">
                    <div>
                      <p className="font-medium text-white">{item.email}</p>
                      <p className="mt-1 text-sm text-white/55">
                        {formatWorkspaceRole(item.role)} access until {formatFriendlyDate(item.expiresAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 text-xs text-white/55">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        Invited {formatFriendlyDate(item.createdAt)}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                        By {item.invitedBy.name || item.invitedBy.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-start lg:justify-end">
                    <Button variant="danger" onClick={() => setRevokeTarget(item)}>
                      Revoke
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Workspace members</h2>
              <p className="mt-2 text-white/60">Everyone who currently has access to your links, analytics, and workspace settings.</p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/65">
              {members.length} active
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {members.length === 0 ? (
              <EmptyState
                title="No members found"
                description="Invite teammates when you are ready to share link management, analytics, or operational responsibilities."
              />
            ) : (
              members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 rounded-[26px] border border-white/10 bg-slate-900/70 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-white">{member.user.name || member.user.email}</p>
                    <p className="mt-1 text-sm text-white/55">{member.user.email}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-emerald-100">
                      {formatWorkspaceRole(member.role)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/55">
                      Joined {formatFriendlyDate(member.joinedAt)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/55">
                      {member.user.emailVerified ? 'Verified account' : 'Pending verification'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={!!revokeTarget}
        title="Revoke invitation?"
        description="This will invalidate the current invite link. The person will need a new invitation before they can join."
        confirmLabel="Revoke invitation"
        cancelLabel="Keep invitation"
        tone="danger"
        busy={revoking}
        onConfirm={handleRevoke}
        onCancel={() => {
          if (!revoking) {
            setRevokeTarget(null)
          }
        }}
        details={
          revokeTarget ? (
            <div className="space-y-2">
              <p className="text-white">{revokeTarget.email}</p>
              <p className="text-white/60">
                {formatWorkspaceRole(revokeTarget.role)} access until {formatFriendlyDate(revokeTarget.expiresAt)}
              </p>
            </div>
          ) : null
        }
      />
    </>
  )
}
