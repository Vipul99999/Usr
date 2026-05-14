'use client'

export function SkeletonCard() {
  return (
    <div className="premium-panel animate-pulse rounded-[28px] p-6">
      <div className="h-3 w-28 rounded-full bg-white/10" />
      <div className="mt-5 h-9 w-52 rounded-2xl bg-white/10" />
      <div className="mt-7 h-4 w-full rounded-full bg-white/10" />
      <div className="mt-3 h-4 w-2/3 rounded-full bg-white/10" />
    </div>
  )
}
