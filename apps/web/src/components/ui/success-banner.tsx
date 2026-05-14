'use client'

type Props = {
  message: string
}

export function SuccessBanner({ message }: Props) {
  return (
    <div className="animate-in fade-in slide-in-from-top-1 rounded-[22px] border border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.18),rgba(16,185,129,0.08))] px-4 py-3.5 text-sm text-emerald-100 shadow-[0_14px_30px_rgba(0,0,0,0.18)]">
      {message}
    </div>
  )
}
