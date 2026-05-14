'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth-store'

type Props = {
  children: React.ReactNode
}

export function GuestOnly({ children }: Props) {
  const router = useRouter()
  const { accessToken, hydrated, hydrate } = useAuthStore()

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [hydrated, hydrate])

  useEffect(() => {
    if (hydrated && accessToken) {
      router.replace('/dashboard')
    }
  }, [hydrated, accessToken, router])

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="premium-panel-strong w-full max-w-md rounded-[32px] p-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/70">UrlShortener</p>
          <h1 className="mt-4 text-2xl font-semibold">Preparing your workspace view</h1>
          <p className="mt-3 text-white/60">
            Checking your session and loading the right route.
          </p>
          <div className="mt-6 flex justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-cyan-300" />
          </div>
        </div>
      </div>
    )
  }

  if (accessToken) return null

  return <>{children}</>
}
