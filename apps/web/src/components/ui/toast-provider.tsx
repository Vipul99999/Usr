'use client'

import { X } from 'lucide-react'
import { useToastStore } from '@/lib/store/toast-store'

export function ToastProvider() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-[100] flex w-full max-w-sm flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-[22px] border px-4 py-4 shadow-[0_24px_50px_rgba(0,0,0,0.28)] backdrop-blur-xl ${
            toast.type === 'success'
              ? 'border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,185,129,0.18),rgba(16,185,129,0.08))] text-emerald-50'
              : toast.type === 'error'
                ? 'border-red-500/20 bg-[linear-gradient(180deg,rgba(239,68,68,0.18),rgba(239,68,68,0.08))] text-red-50'
                : 'border-cyan-500/20 bg-[linear-gradient(180deg,rgba(34,211,238,0.18),rgba(34,211,238,0.08))] text-cyan-50'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] opacity-70">
                {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Attention' : 'Update'}
              </p>
              <p className="mt-2 text-sm leading-6">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="rounded-lg p-1 opacity-80 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
