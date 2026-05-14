'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth-store'

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

export function WorkspaceSwitcher() {
  const { accessToken, workspaceId, hydrate, setSession, refreshToken } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  const query = useQuery({
    queryKey: ['workspace-switcher'],
    queryFn: () =>
      apiFetch<WorkspaceMembership[]>('/workspaces', {
        token: accessToken || undefined
      }),
    enabled: !!accessToken
  })

  const handleChange = (nextWorkspaceId: string) => {
    if (!accessToken || !refreshToken) return

    setSession({
      accessToken,
      refreshToken,
      workspaceId: nextWorkspaceId
    })
  }

  if (!query.data || query.data.length <= 1) return null

  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/40">
        Workspace
      </label>
      <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3">
        <select
          value={workspaceId || ''}
          onChange={(e) => handleChange(e.target.value)}
          className="w-full rounded-[18px] border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-200/30 focus:ring-4 focus:ring-cyan-300/10"
        >
          {query.data.map((item) => (
            <option key={item.workspace.id} value={item.workspace.id}>
              {item.workspace.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
