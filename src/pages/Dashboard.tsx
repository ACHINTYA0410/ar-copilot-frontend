import { useNavigate } from 'react-router-dom'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Clock,
  Zap,
  ArrowRight,
  Bot,
  User,
  RefreshCw,
  Shield,
} from 'lucide-react'
import { mockDeals } from '../data/mockDeals'
import { mockAuditLog } from '../data/mockAuditLog'
import { formatCurrency, formatTimeAgo, cn } from '../lib/utils'

function TrafficLightCard({
  state,
  count,
  label,
  sublabel,
  color,
  bg,
  icon: Icon,
}: {
  state: string
  count: number
  label: string
  sublabel: string
  color: string
  bg: string
  icon: React.ElementType
}) {
  return (
    <div className={cn('rounded-2xl p-6 flex flex-col gap-3', bg)}>
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-bold tracking-widest uppercase', color)}>{state}</span>
        <Icon className={cn('w-5 h-5', color)} />
      </div>
      <p className={cn('text-5xl font-bold tabular-nums', color)}>{count}</p>
      <div>
        <p className={cn('text-sm font-semibold', color)}>{label}</p>
        <p className={cn('text-xs mt-0.5 opacity-70', color)}>{sublabel}</p>
      </div>
    </div>
  )
}

function AttentionRow({ deal, onReview }: { deal: (typeof mockDeals)[0]; onReview: () => void }) {
  const urgency = deal.status === 'stuck'
  return (
    <div
      className={cn(
        'flex items-center gap-4 px-5 py-4 border-b border-gray-50 last:border-0',
        urgency && 'bg-red-50/50',
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {urgency && (
            <span className="text-xs font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
              STUCK
            </span>
          )}
          <p className="text-sm font-semibold text-gray-900 truncate">{deal.customer}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="font-medium text-gray-700">{formatCurrency(deal.amount)}</span>
          <span>·</span>
          <span>{deal.submittedBy.name}</span>
          <span>·</span>
          <span>{formatTimeAgo(deal.submittedAt)}</span>
        </div>
        {deal.topIssues.length > 0 && (
          <p className="text-xs text-amber-700 mt-1 truncate">
            {deal.topIssues[0]}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          <p className="text-xs font-semibold text-gray-700">
            {deal.validationScore.passed}/{deal.validationScore.total}
          </p>
          <p className="text-xs text-gray-400">checks</p>
        </div>
        <button
          onClick={onReview}
          className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors"
        >
          Review
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

const AI_LOG_ENTRIES = mockAuditLog
  .filter((e) => e.actor.type === 'ai_agent' || e.actor.type === 'system')
  .slice(0, 5)

const actorIcon = (type: string) => {
  if (type === 'ai_agent') return <Bot className="w-3.5 h-3.5" />
  if (type === 'user') return <User className="w-3.5 h-3.5" />
  return <RefreshCw className="w-3.5 h-3.5" />
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function Dashboard() {
  const navigate = useNavigate()
  const urgentDeals = mockDeals
    .filter((d) => d.status === 'needs_review' || d.status === 'stuck')
    .sort((a, b) => {
      if (a.status === 'stuck' && b.status !== 'stuck') return -1
      if (b.status === 'stuck' && a.status !== 'stuck') return 1
      return b.criticalIssues - a.criticalIssues
    })
    .slice(0, 5)

  const reviewCount = mockDeals.filter(
    (d) => d.status === 'needs_review' || d.status === 'stuck',
  ).length

  const approvedCount =
    mockDeals.filter((d) => d.status === 'auto_approved' || d.status === 'approved').length + 44

  const rejectedCount =
    mockDeals.filter((d) => d.status === 'auto_rejected' || d.status === 'rejected').length + 6

  const totalToday = approvedCount + reviewCount + rejectedCount
  const aiHandledPct = Math.round(((approvedCount + rejectedCount) / totalToday) * 100)
  const timeSaved = ((approvedCount + rejectedCount) * 5.2 / 60).toFixed(1)

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Good morning, Priya</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}Finance Intelligence Overview
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-800">
                AI handled {aiHandledPct}% of deals today
              </span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-xl">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">~{timeSaved} hrs saved</span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Traffic Light Row */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Validation Pipeline — Today
            </h2>
            <p className="text-xs text-gray-400">{totalToday} total submissions</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <TrafficLightCard
              state="Green"
              count={approvedCount}
              label="Auto-Approved"
              sublabel="No Finance touch required"
              color="text-emerald-700"
              bg="bg-emerald-50 border border-emerald-200"
              icon={CheckCircle2}
            />
            <TrafficLightCard
              state="Orange"
              count={reviewCount}
              label="Needs Your Review"
              sublabel="AI flagged for human decision"
              color="text-amber-700"
              bg="bg-amber-50 border border-amber-200"
              icon={AlertTriangle}
            />
            <TrafficLightCard
              state="Red"
              count={rejectedCount}
              label="Auto-Rejected"
              sublabel="Returned to submitter instantly"
              color="text-red-700"
              bg="bg-red-50 border border-red-200"
              icon={XCircle}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Deals needing attention (left 2/3) */}
          <div className="col-span-2 space-y-4">
            {/* Urgent deals */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-bold text-gray-900">Deals Requiring Your Review</p>
                  {reviewCount > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {reviewCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => navigate('/queue')}
                  className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                >
                  View all in queue
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              {urgentDeals.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-600">All caught up!</p>
                  <p className="text-xs text-gray-400 mt-0.5">No deals waiting for review.</p>
                </div>
              ) : (
                urgentDeals.map((deal) => (
                  <AttentionRow
                    key={deal.id}
                    deal={deal}
                    onReview={() => navigate(`/deal/${deal.id}`)}
                  />
                ))
              )}
            </div>

            {/* Key metrics row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Avg Processing Time', value: '2.3 min', sub: 'per deal · AI validation', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'First-Pass Rate', value: '78%', sub: '↑ 6% vs last month', icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Born Digital Rate', value: '64%', sub: '↑ 6% vs last week', icon: Shield, color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((m) => (
                <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mb-3', m.bg)}>
                    <m.icon className={cn('w-4 h-4', m.color)} />
                  </div>
                  <p className="text-xl font-bold text-gray-900">{m.value}</p>
                  <p className="text-xs font-medium text-gray-700 mt-0.5">{m.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Born Digital adoption */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-4 h-4 text-purple-600" />
                <p className="text-sm font-bold text-gray-900">Born Digital Adoption</p>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">e-Signed submissions</span>
                  <span className="text-xs font-bold text-purple-700">64%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '64%' }} />
                </div>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Manual / scanned docs</span>
                  <span className="text-xs font-bold text-gray-500">36%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-300 rounded-full" style={{ width: '36%' }} />
                </div>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-purple-800 mb-1">Fast-Track SLA Active</p>
                <p className="text-xs text-purple-600 leading-relaxed">
                  e-Signed deals are processed first. Manual submissions incur a cross-charge to the submitting team's budget.
                </p>
              </div>
            </div>

            {/* Recent AI activity */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-600" />
                  <p className="text-sm font-bold text-gray-900">Recent AI Actions</p>
                </div>
                <button
                  onClick={() => navigate('/audit')}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Full log
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {AI_LOG_ENTRIES.map((entry) => (
                  <div key={entry.id} className="px-4 py-3 flex items-start gap-2.5">
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                        entry.actor.type === 'ai_agent'
                          ? 'bg-purple-100 text-purple-600'
                          : 'bg-gray-100 text-gray-500',
                      )}
                    >
                      {actorIcon(entry.actor.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-700 leading-tight truncate">{entry.summary}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatTime(entry.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
