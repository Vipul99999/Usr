'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth-store'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

type Props = {
  children: React.ReactNode
}

export function Protected({ children }: Props) {
  const router = useRouter()
  const { accessToken, hydrated, hydrate } = useAuthStore()

  useEffect(() => {
    if (!hydrated) {
      hydrate()
    }
  }, [hydrate, hydrated])

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.push('/login')
    }
  }, [hydrated, accessToken, router])

  if (!hydrated || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md rounded-[30px] border border-white/10 bg-[rgba(8,19,36,0.74)] p-8 text-center shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur">
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-200/70">Preparing your workspace</p>
          <div className="mt-6 flex justify-center">
            <LoadingSpinner label="Checking your session and loading your dashboard..." />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
