'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: Variant
  fullWidth?: boolean
}

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  className = '',
  ...props
}: Props) {
  const base =
    'inline-flex items-center justify-center rounded-[18px] px-5 py-3 font-semibold tracking-[0.01em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-60'

  const variants: Record<Variant, string> = {
    primary:
      'border border-cyan-200/50 bg-[linear-gradient(135deg,#b6fbff,#4ce8f7_48%,#59d7c5)] text-slate-950 shadow-[0_16px_36px_rgba(52,214,232,0.24)] hover:-translate-y-0.5 hover:shadow-[0_24px_40px_rgba(52,214,232,0.3)]',
    secondary:
      'border border-white/10 bg-white/[0.045] text-white hover:bg-white/[0.09] hover:border-white/15',
    danger: 'border border-red-500/20 bg-red-500/10 text-red-200 hover:bg-red-500/15'
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
