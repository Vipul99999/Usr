'use client'

import Link from 'next/link'

type Props = {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}

export function EmptyState({ title, description, actionLabel, actionHref }: Props) {
  return (
    <div className="premium-panel rounded-[28px] border-dashed p-10 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-white/42">Nothing here yet</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 text-white/60">{description}</p>
      {actionLabel && actionHref ? (
        <div className="mt-6">
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.05] px-5 py-3 font-semibold text-white transition duration-200 hover:bg-white/10 hover:border-white/15"
          >
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  )
}
