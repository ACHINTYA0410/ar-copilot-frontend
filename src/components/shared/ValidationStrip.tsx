import { cn } from '../../lib/utils'
import type { ValidationRule } from '../../types'

interface ValidationStripProps {
  rules: ValidationRule[]
  onPillClick?: (ruleId: string) => void
  activeRuleId?: string
}

export function ValidationStrip({ rules, onPillClick, activeRuleId }: ValidationStripProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {rules.map((rule) => {
        const colors =
          rule.status === 'pass'
            ? 'bg-emerald-500 hover:bg-emerald-600'
            : rule.status === 'warning'
            ? 'bg-amber-400 hover:bg-amber-500'
            : 'bg-red-500 hover:bg-red-600'

        const isActive = activeRuleId === rule.id

        return (
          <button
            key={rule.id}
            title={rule.name}
            onClick={() => onPillClick?.(rule.id)}
            className={cn(
              'w-5 h-5 rounded-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500',
              colors,
              isActive && 'ring-2 ring-offset-1 ring-blue-500 scale-110',
            )}
          />
        )
      })}
    </div>
  )
}
