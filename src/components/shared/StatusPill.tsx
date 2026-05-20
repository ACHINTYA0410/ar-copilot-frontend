import { cn } from '../../lib/utils'
import type { DealStatus } from '../../types'

const variants: Record<DealStatus, { label: string; className: string }> = {
  needs_review: { label: 'Needs Review', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  auto_approved: { label: 'Auto-Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  auto_rejected: { label: 'Auto-Rejected', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
  stuck: { label: 'Stuck', className: 'bg-red-50 text-red-700 border-red-200' },
}

interface StatusPillProps {
  status: DealStatus
  className?: string
}

export function StatusPill({ status, className }: StatusPillProps) {
  const v = variants[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        v.className,
        className,
      )}
    >
      {v.label}
    </span>
  )
}

export function StatusDot({ status }: { status: DealStatus }) {
  const colors: Record<DealStatus, string> = {
    needs_review: 'bg-amber-400',
    auto_approved: 'bg-emerald-500',
    auto_rejected: 'bg-gray-400',
    approved: 'bg-emerald-500',
    rejected: 'bg-red-500',
    stuck: 'bg-red-500',
  }
  return <span className={cn('inline-block w-2 h-2 rounded-full', colors[status])} />
}
