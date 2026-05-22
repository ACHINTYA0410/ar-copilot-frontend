import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
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
  Loader2,
} from 'lucide-react'
import { dealsApi } from '../lib/api/deals'
import { useDeals as useDealsQuery } from '../hooks/useDeals'
import { useDealStats } from '../hooks/useDealStats'
import { StatusDot } from '../components/shared/StatusPill'
import { cn, formatCurrency, formatTimeAgo } from '../lib/utils'
import type { ApiDealResponse, DealStatus } from '../types/api'

const FILTER_TABS: { label: string; value: DealStatus | 'all' }[] = [
  { label: 'All Status', value: 'all' },
  { label: 'Needs Review', value: 'needs_review' },
  { label: 'Stuck', value: 'stuck' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Auto-Approved', value: 'auto_approved' },
]

function StatCard({
  label,
  value,
  color,
  loading,
}: {
  label: string
  value: number | string
  color: string
  loading?: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 relative overflow-hidden">
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', color)} />
      {loading ? (
        <div className="h-8 w-12 bg-gray-100 animate-pulse rounded mb-1" />
      ) : (
        <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      )}
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
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0
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

function QuickPreviewPanel({
  deal,
  onClose,
}: {
  deal: ApiDealResponse
  onClose: () => void
}) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [actioning, setActioning] = useState(false)

  const isActionable = deal.status === 'needs_review' || deal.status === 'stuck'
  const isResolved = deal.status === 'approved' || deal.status === 'rejected'

  const handleStatusChange = async (status: DealStatus) => {
    setActioning(true)
    try {
      await dealsApi.update(deal.id, { status })
      await queryClient.invalidateQueries({ queryKey: ['deals'] })
      await queryClient.invalidateQueries({ queryKey: ['deal-stats'] })
      toast.success(
        status === 'approved'
          ? `${deal.customer_name} approved successfully`
          : `${deal.customer_name} rejected and returned to submitter`,
      )
      onClose()
    } catch {
      // global interceptor already showed toast
    } finally {
      setActioning(false)
    }
  }

  const amount = parseFloat(deal.amount)

  return (
    <div className="w-80 flex-shrink-0 bg-white border-l border-gray-200 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <p className="text-sm font-semibold text-gray-900 leading-tight">{deal.customer_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{deal.id}</p>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {isResolved && (
          <div
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2.5',
              deal.status === 'approved'
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200',
            )}
          >
            {deal.status === 'approved' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )}
            <p
              className={cn(
                'text-xs font-semibold',
                deal.status === 'approved' ? 'text-emerald-800' : 'text-red-800',
              )}
            >
              Deal {deal.status === 'approved' ? 'Approved' : 'Rejected'}
            </p>
          </div>
        )}

        {deal.critical_issues_count > 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-800 mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              {deal.critical_issues_count} Critical Issue{deal.critical_issues_count > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-amber-700">Open Full Review to see details.</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Amount</span>
            <span className="text-sm font-semibold text-gray-900">{formatCurrency(amount)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Region</span>
            <span className="text-sm text-gray-700">{deal.region ?? '—'}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <span className="text-xs text-gray-500 flex-shrink-0">Products</span>
            <div className="flex flex-wrap gap-1 justify-end">
              {deal.products.length > 0 ? (
                deal.products.map((p) => (
                  <span key={p} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                    {p}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">—</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Submitter</span>
            <div className="flex items-center gap-1.5">
              <AvatarCircle
                name={deal.submitted_by_name}
                color={deal.submitted_by_avatar_color}
              />
              <span className="text-sm text-gray-700">{deal.submitted_by_name}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Submitted</span>
            <span className="text-xs text-gray-600">{formatTimeAgo(deal.submitted_at)}</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-700">Validation Score</p>
            <span className="text-xs text-gray-500">
              {deal.validation_score_passed}/{deal.validation_score_total} checks
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full',
                deal.validation_score_total > 0 &&
                  deal.validation_score_passed / deal.validation_score_total >= 0.85
                  ? 'bg-emerald-500'
                  : deal.validation_score_total > 0 &&
                      deal.validation_score_passed / deal.validation_score_total >= 0.65
                    ? 'bg-amber-400'
                    : 'bg-red-500',
              )}
              style={{
                width:
                  deal.validation_score_total > 0
                    ? `${Math.round((deal.validation_score_passed / deal.validation_score_total) * 100)}%`
                    : '0%',
              }}
            />
          </div>
          {deal.critical_issues_count > 0 && (
            <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
              <XCircle className="w-3 h-3" />
              {deal.critical_issues_count} critical issue
              {deal.critical_issues_count > 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>

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
              onClick={() => handleStatusChange('approved')}
              disabled={actioning}
              className="py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {actioning ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Quick Approve'}
            </button>
            <button
              onClick={() => handleStatusChange('rejected')}
              disabled={actioning}
              className="py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
            >
              {actioning ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Quick Reject'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function DealQueue() {
  const navigate = useNavigate()
  const [selectedDeal, setSelectedDeal] = useState<ApiDealResponse | null>(null)
  const [filter, setFilter] = useState<DealStatus | 'all'>('all')
  const [search, setSearch] = useState('')

  const dealsParams = {
    ...(filter !== 'all' ? { status: filter } : {}),
    ...(search ? { search } : {}),
  }

  const { data: dealsData, isLoading: dealsLoading, isError: dealsError } = useDealsQuery(dealsParams)
  const { data: stats, isLoading: statsLoading } = useDealStats()

  const deals = dealsData?.items ?? []

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
            <StatCard
              label="Needs Your Review"
              value={stats?.needs_review ?? 0}
              color="bg-amber-400"
              loading={statsLoading}
            />
            <StatCard
              label="Stuck > 48 Hours"
              value={stats?.stuck ?? 0}
              color="bg-red-500"
              loading={statsLoading}
            />
            <StatCard
              label="Auto-Approved Today"
              value={stats?.auto_approved_today ?? 0}
              color="bg-emerald-500"
              loading={statsLoading}
            />
            <StatCard
              label="Auto-Rejected Today"
              value={stats?.auto_rejected_today ?? 0}
              color="bg-gray-400"
              loading={statsLoading}
            />
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

            {dealsLoading ? (
              <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading deals...</span>
              </div>
            ) : dealsError ? (
              <div className="px-4 py-12 text-center">
                <p className="text-sm font-medium text-red-600 mb-1">Failed to load deals</p>
                <p className="text-xs text-gray-400">
                  Check that the FastAPI server is running on port 8000.
                </p>
              </div>
            ) : deals.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-400 text-sm">
                No deals match your filters.
              </div>
            ) : (
              deals.map((deal) => {
                const isSelected = selectedDeal?.id === deal.id
                const isResolved =
                  deal.status === 'approved' ||
                  deal.status === 'rejected' ||
                  deal.status === 'auto_approved' ||
                  deal.status === 'auto_rejected'
                const amount = parseFloat(deal.amount)

                return (
                  <div
                    key={deal.id}
                    onClick={() => setSelectedDeal(isSelected ? null : deal)}
                    className={cn(
                      'grid grid-cols-[24px_200px_100px_160px_80px_120px_40px] gap-4 px-4 py-3.5 border-b border-gray-50 cursor-pointer transition-colors items-center',
                      isSelected
                        ? 'bg-blue-50 border-l-2 border-l-blue-500'
                        : 'hover:bg-gray-50',
                      isResolved && 'opacity-60',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-blue-600"
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div className="flex items-center gap-2.5 min-w-0">
                      <StatusDot status={deal.status} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                          {deal.customer_name}
                        </p>
                        <p className="text-xs text-gray-400 leading-tight mt-0.5">{deal.id}</p>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-gray-900 tabular-nums">
                      {formatCurrency(amount)}
                    </p>

                    <div className="flex items-center gap-2 min-w-0">
                      <AvatarCircle
                        name={deal.submitted_by_name}
                        color={deal.submitted_by_avatar_color}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate leading-tight">
                          {deal.submitted_by_name}
                        </p>
                        <p className="text-xs text-gray-400 leading-tight">
                          {deal.submitted_by_zone}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 whitespace-nowrap">
                      {formatTimeAgo(deal.submitted_at)}
                    </p>

                    <ValidationBar
                      passed={deal.validation_score_passed}
                      total={deal.validation_score_total}
                    />

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/deal/${deal.id}`)
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
          {!dealsLoading && !dealsError && (
            <p className="text-xs text-gray-400 mt-3">
              Showing {deals.length} of {dealsData?.total ?? 0} deals
            </p>
          )}
        </div>
      </div>

      {/* Side preview panel */}
      {selectedDeal && (
        <QuickPreviewPanel deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
      )}
    </div>
  )
}
