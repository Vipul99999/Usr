'use client'

type Option = {
  label: string
  value: string
}

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  options: Option[]
  error?: string
}

export function SelectField({ label, value, onChange, options, error }: Props) {
  return (
    <div>
      <label className="mb-2 block text-xs uppercase tracking-[0.24em] text-white/52">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-[20px] border px-4 py-3.5 outline-none transition focus:ring-4 focus:ring-cyan-300/10 ${
          error
            ? 'border-red-500/30 bg-red-500/5 text-white'
            : 'border-white/10 bg-slate-950/80 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] focus:border-cyan-200/30'
        }`}
      >
        <option value="">Select option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
    </div>
  )
}
