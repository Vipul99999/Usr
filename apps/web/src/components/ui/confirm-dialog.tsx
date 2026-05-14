'use client'

import { ReactNode } from 'react'
import { Button } from './button'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'neutral'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
  details?: ReactNode
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'neutral',
  busy = false,
  onConfirm,
  onCancel,
  details
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 px-4 pb-4 pt-10 sm:items-center sm:px-6">
      <div className="premium-panel-strong w-full max-w-lg rounded-[30px] p-5 sm:p-6">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/42">Please confirm</p>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-white/60">{description}</p>
        </div>

        {details ? <div className="mt-4 rounded-[22px] border border-white/10 bg-slate-900/70 p-4 text-sm text-white/70">{details}</div> : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
