'use client'

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  error?: string
  disabled?: boolean
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  error,
  disabled
}: Props) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.24em] text-white/52">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-[20px] border px-4 py-3.5 outline-none transition placeholder:text-white/25 focus:border-cyan-200/30 focus:ring-4 focus:ring-cyan-300/10 ${
          error
            ? 'border-red-500/30 bg-red-500/5 text-white placeholder:text-red-200/30'
            : 'border-white/10 bg-slate-950/80 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      />
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  )
}
