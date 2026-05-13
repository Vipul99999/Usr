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
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/70">UrlShortener</p>
          <h1 className="mt-4 text-2xl font-semibold">Preparing your workspace view</h1>
          <p className="mt-3 text-white/60">
            Checking your session and loading the right route.
          </p>
        </div>
      </div>
    )
  }

  if (accessToken) return null

  return <>{children}</>
}
