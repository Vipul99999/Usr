'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useAuthStore } from '@/lib/store/auth-store'

export function CtaStrip() {
  const { accessToken, hydrated, hydrate } = useAuthStore()

  useEffect(() => {
    if (!hydrated) hydrate()
  }, [hydrated, hydrate])

  return (
    <div className="premium-panel-strong rounded-[32px] bg-[linear-gradient(135deg,rgba(140,244,255,0.16),rgba(7,15,27,0.94)_38%,rgba(7,15,27,0.98))] p-6 sm:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-cyan-100/75">Ready to launch</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Launch a link product that feels sharp from the first campaign.
          </h3>
          <p className="mt-2 max-w-2xl text-white/65">
            Start with one workspace, one branded short URL, and one real campaign. Everything else compounds from there.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {accessToken ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-[18px] border border-cyan-200/40 bg-[linear-gradient(135deg,#b6fbff,#4ce8f7_48%,#59d7c5)] px-5 py-3 text-center font-semibold text-slate-950 shadow-[0_18px_38px_rgba(52,214,232,0.22)]"
            >
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-[18px] border border-cyan-200/40 bg-[linear-gradient(135deg,#b6fbff,#4ce8f7_48%,#59d7c5)] px-5 py-3 text-center font-semibold text-slate-950 shadow-[0_18px_38px_rgba(52,214,232,0.22)]"
              >
                Start free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-[18px] border border-white/15 px-5 py-3 text-center text-white/85 transition hover:bg-white/[0.05]"
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
