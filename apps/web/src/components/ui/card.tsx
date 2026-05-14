'use client'

import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: Props) {
  return (
    <div
      className={`premium-panel premium-shell rounded-[30px] p-6 ${className}`}
    >
      {children}
    </div>
  )
}
