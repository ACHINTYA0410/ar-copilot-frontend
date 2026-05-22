import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils'
import { ConfidenceBadge } from './ConfidenceBadge'
import type { ValidationRule } from '../../types'

interface RuleCardProps {
  readonly rule: ValidationRule
  readonly isExpanded?: boolean
  readonly onToggle?: () => void
  readonly onApproveAnyway?: () => void
  readonly onRejectWithReason?: () => void
}

const StatusIcon = ({ status }: Readonly<{ status: ValidationRule['status'] }>) => {
  if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
  if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
  return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
}

function rowBgFor(status: ValidationRule['status']): string {
  if (status === 'fail') return 'hover:bg-red-50'
  if (status === 'warning') return 'hover:bg-amber-50'
  return 'hover:bg-gray-50'
}

function expandedBgFor(status: ValidationRule['status']): string {
  if (status === 'fail') return 'bg-red-50 border-red-100'
  if (status === 'warning') return 'bg-amber-50 border-amber-100'
  return 'bg-gray-50 border-gray-100'
}

export function RuleCard({
  rule,
  isExpanded: controlledExpanded,
  onToggle,
  onApproveAnyway,
  onRejectWithReason,
}: RuleCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const expanded = controlledExpanded ?? internalExpanded

  const handleToggle = () => {
    if (onToggle) onToggle()
    else setInternalExpanded((v) => !v)
  }

  return (
    <div className={cn('border-b border-gray-100 last:border-0', expanded && 'bg-gray-50')}>
      <button
        onClick={handleToggle}
        className={cn('w-full flex items-center gap-3 px-4 py-3 text-left transition-colors', rowBgFor(rule.status))}
      >
        <StatusIcon status={rule.status} />
        <span className="flex-1 text-sm font-medium text-gray-800">{rule.name}</span>
        <ConfidenceBadge value={rule.confidence} />
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className={cn('px-4 pb-4 border-t', expandedBgFor(rule.status))}>
          {rule.description && (
            <p className="text-xs text-gray-500 mt-3 mb-2">{rule.description}</p>
          )}
          {rule.evidence && (
            <div className="bg-white rounded-md border border-gray-200 px-3 py-2 mb-3">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                AI Finding
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">{rule.evidence}</p>
            </div>
          )}
          {rule.actions.length > 0 && (
            <div className="flex gap-2">
              {rule.actions.includes('approve_anyway') && (
                <button
                  onClick={onApproveAnyway}
                  className="text-xs font-medium px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Approve anyway
                </button>
              )}
              {rule.actions.includes('reject_reason') && (
                <button
                  onClick={onRejectWithReason}
                  className="text-xs font-medium px-3 py-1.5 rounded-md bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 transition-colors"
                >
                  Reject with reason
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
