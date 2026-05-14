'use client'

type Props = {
  error?: string
  success?: string
}

export function FormMessage({ error, success }: Props) {
  if (!error && !success) return null

  return (
    <div
      className={`rounded-[22px] border px-4 py-3.5 text-sm shadow-[0_12px_28px_rgba(0,0,0,0.16)] ${
        error
          ? 'border-red-500/20 bg-red-500/10 text-red-200'
          : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
      }`}
    >
      {error || success}
    </div>
  )
}
