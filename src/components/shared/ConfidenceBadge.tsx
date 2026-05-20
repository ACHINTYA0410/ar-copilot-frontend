import { cn } from '../../lib/utils'

interface ConfidenceBadgeProps {
  value: number
  className?: string
}

export function ConfidenceBadge({ value, className }: ConfidenceBadgeProps) {
  const color =
    value >= 90
      ? 'bg-emerald-50 text-emerald-700'
      : value >= 60
      ? 'bg-amber-50 text-amber-700'
      : 'bg-red-50 text-red-700'

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tabular-nums', color, className)}>
      {value}%
    </span>
  )
}
