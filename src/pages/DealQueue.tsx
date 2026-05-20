import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronDown,
  ArrowRight,
  X,
  XCircle,
  AlertTriangle,
  Filter,
  SlidersHorizontal,
  CheckCircle2,
} from 'lucide-react'
import { mockDeals } from '../data/mockDeals'
import { StatusDot } from '../components/shared/StatusPill'
import { useDeals } from '../context/DealsContext'
import { cn, formatCurrency, formatTimeAgo } from '../lib/utils'
import type { Deal, DealStatus } from '../types'

const FILTER_TABS: { label: string; value: DealStatus | 'all' }[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Needs Review', value: 'needs_review' },
  { label: 'Stuck', value: 'stuck' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Auto-Approved', value: 'auto_approved' },
]

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 relative overflow-hidden">
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', color)} />
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}

function AvatarCircle({ name, color }: { name: string; color: string }) {
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  )
}

function ValidationBar({ passed, total }: { passed: number; total: number }) {
  const pct = Math.round((passed / total) * 100)
  const color = pct >= 85 ? 'bg-emerald-500' : pct >= 65 ? 'bg-amber-400' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-500 tabular-nums whitespace-nowrap">
        {passed}/{total}
      </span>
    </div>
  )
}

function QuickPreviewPanel({ deal, effectiveStatus, onClose }: { deal: Deal; effectiveStatus: DealStatus; onClose: () => void }) {
  const navigate = useNavigate()
  const { updateDealStatus, showToast } = useDeals()

  const handleQuickApprove = () => {
    updateDealStatus(deal.id, 'approved')
    showToast(`${deal.customer} approved successfully`, 'success')
    onClose()
  }

  const handleQuickReject = () => {
    updateDealStatus(deal.id, 'rejected')
    showToast(`${deal.customer} rejected and returned to submitter`, 'info')
    onClose()
  }

  const isActionable = effectiveStatus === 'needs_review' || effectiveStatus === 'stuck'
  const isResolved = effectiveStatus === 'approved' || effectiveStatus === 'rejected'

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">{deal.customer}</p>
          <p className="text-xs text-gray-400 mt-0.5">{deal.id}</p>
        </div>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Resolved banner */}
        {isResolved && (
          <div className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-2.5',
            effectiveStatus === 'approved' ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
          )}>
            {effectiveStatus === 'approved'
              ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              : <XCircle className="w-4 h-4 text-red-600" />}
            <p className={cn('text-xs font-semibold', effectiveStatus === 'approved' ? 'text-emerald-800' : 'text-red-800')}>
              Deal {effectiveStatus === 'approved' ? 'Approved' : 'Rejected'}
            </p>
          </div>
        )}

        {/* Top Issues */}
        {deal.topIssues.length > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              Top Issues
            </p>
            <ul className="space-y-1.5">
              {deal.topIssues.map((issue, i) => (
                <li key={i} className="text-xs text-amber-700 flex gap-1.5">
                  <span className="flex-shrink-0 mt-0.5">•</span>
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Deal details */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Amount</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(deal.amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Region</span>
            <span className="text-sm text-gray-700">{deal.region}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs text-gray-500 flex-shrink-0">Products</span>
            <div className="flex flex-wrap gap-1 justify-end">
              {deal.products.map((p) => (
                <span key={p} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{p}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Submitter</span>
            <div className="flex items-center gap-1.5">
              <AvatarCircle name={deal.submittedBy.name} color={deal.submittedBy.avatarColor} />
              <span className="text-sm text-gray-700">{deal.submittedBy.name}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Submitted</span>
            <span className="text-xs text-gray-600">{formatTimeAgo(deal.submittedAt)}</span>
          </div>
        </div>

        {/* Validation score */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-700">Validation Score</p>
            <span className="text-xs text-gray-500">{deal.validationScore.passed}/{deal.validationScore.total} checks</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', deal.validationScore.passed / deal.validationScore.total >= 0.85 ? 'bg-emerald-500' : deal.validationScore.passed / deal.validationScore.total >= 0.65 ? 'bg-amber-400' : 'bg-red-500')}
              style={{ width: `${Math.round((deal.validationScore.passed / deal.validationScore.total) * 100)}%` }}
            />
          </div>
          {deal.criticalIssues > 0 && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {deal.criticalIssues} critical issue{deal.criticalIssues > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 space-y-2">
        <button
          onClick={() => navigate(`/deal/${deal.id}`)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
        >
          Open Full Review
        </button>
        {isActionable && (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleQuickApprove}
              className="py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
            >
              Quick Approve
            </button>
            <button
              onClick={handleQuickReject}
              className="py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
            >
              Quick Reject
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function DealQueue() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [filter, setFilter] = useState<DealStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const { getEffectiveStatus, reviewQueueCount } = useDeals()

  const dealsWithStatus = useMemo(
    () => mockDeals.map((d) => ({ ...d, effectiveStatus: getEffectiveStatus(d.id) })),
    [getEffectiveStatus],
  )

  const filtered = useMemo(() => {
    return dealsWithStatus.filter((d) => {
      const matchStatus = filter === 'all' || d.effectiveStatus === filter
      const matchSearch =
        !search ||
        d.customer.toLowerCase().includes(search.toLowerCase()) ||
        d.id.toLowerCase().includes(search.toLowerCase())
      return matchStatus && matchSearch
    })
  }, [filter, search, dealsWithStatus])

  const stuckCount = dealsWithStatus.filter((d) => d.effectiveStatus === 'stuck').length
  const autoApproved = dealsWithStatus.filter((d) => d.effectiveStatus === 'auto_approved').length + 44
  const autoRejected = dealsWithStatus.filter((d) => d.effectiveStatus === 'auto_rejected').length + 6

  const selectedDealWithStatus = selectedDeal
    ? dealsWithStatus.find((d) => d.id === selectedDeal.id)
    : null

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-50 z-10 px-6 pt-6 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold text-gray-900">Deal Queue</h1>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
              <SlidersHorizontal className="w-4 h-4" />
              Bulk Actions
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4 mb-5">
            <StatCard label="Needs Your Review" value={reviewQueueCount} color="bg-amber-400" />
            <StatCard label="Stuck > 48 Hours" value={stuckCount} color="bg-red-500" />
            <StatCard label="Auto-Approved Today" value={autoApproved} color="bg-emerald-500" />
            <StatCard label="Auto-Rejected Today" value={autoRejected} color="bg-gray-400" />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-56 placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                    filter === tab.value ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100',
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-1.5 text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors ml-auto">
              <Filter className="w-3.5 h-3.5" />
              Sort
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="px-6 py-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-[24px_200px_100px_160px_80px_120px_40px] gap-4 px-4 py-3 border-b border-gray-100 bg-gray-50">
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600 mt-0.5" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Deal</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitter</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</p>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Validation</p>
              <div />
            </div>

            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-400 text-sm">No deals match your filters.</div>
            ) : (
              filtered.map((deal) => {
                const isSelected = selectedDeal?.id === deal.id
                const isResolved = deal.effectiveStatus === 'approved' || deal.effectiveStatus === 'rejected' || deal.effectiveStatus === 'auto_approved' || deal.effectiveStatus === 'auto_rejected'

                return (
                  <div
                    key={deal.id}
                    onClick={() => setSelectedDeal(isSelected ? null : deal)}
                    className={cn(
                      'grid grid-cols-[24px_200px_100px_160px_80px_120px_40px] gap-4 px-4 py-3.5 border-b border-gray-50 cursor-pointer transition-colors items-center',
                      isSelected ? 'bg-blue-50 border-l-2 border-l-blue-500' : 'hover:bg-gray-50',
                      isResolved && 'opacity-60',
                    )}
                  >
                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600" onClick={(e) => e.stopPropagation()} />

                    <div className="flex items-center gap-2.5 min-w-0">
                      <StatusDot status={deal.effectiveStatus} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate leading-tight">{deal.customer}</p>
                        <p className="text-xs text-gray-400 leading-tight mt-0.5">{deal.id}</p>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{formatCurrency(deal.amount)}</p>

                    <div className="flex items-center gap-2 min-w-0">
                      <AvatarCircle name={deal.submittedBy.name} color={deal.submittedBy.avatarColor} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate leading-tight">{deal.submittedBy.name}</p>
                        <p className="text-xs text-gray-400 leading-tight">{deal.submittedBy.zone}</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 whitespace-nowrap">{formatTimeAgo(deal.submittedAt)}</p>

                    <ValidationBar passed={deal.validationScore.passed} total={deal.validationScore.total} />

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.location.href = `/deal/${deal.id}`
                      }}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Review"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
          <p className="text-xs text-gray-400 mt-3">Showing {filtered.length} of {mockDeals.length} deals</p>
        </div>
      </div>

      {/* Side preview panel */}
      {selectedDeal && selectedDealWithStatus && (
        <QuickPreviewPanel
          deal={selectedDeal}
          effectiveStatus={selectedDealWithStatus.effectiveStatus}
          onClose={() => setSelectedDeal(null)}
        />
      )}
    </div>
  )
}
