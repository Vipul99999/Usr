'use client'

type Props = {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

export function PaginationControls({ page, totalPages, onPrev, onNext }: Props) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between pt-4">
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="rounded-[18px] border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.05] disabled:opacity-40"
      >
        Previous
      </button>

      <span className="text-sm text-white/60">
        Page {page} of {totalPages}
      </span>

      <button
        onClick={onNext}
        disabled={page >= totalPages}
        className="rounded-[18px] border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:bg-white/[0.05] disabled:opacity-40"
      >
        Next
      </button>
    </div>
  )
}
