import { useState } from 'react'
import { useDeals } from '../context/DealsContext'
import {
  Search,
  HelpCircle,
  Bell,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  Settings,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Shield,
} from 'lucide-react'
import { mockAuditLog, auditWeeklyStats } from '../data/mockAuditLog'
import { cn } from '../lib/utils'
import type { AuditEntry } from '../types'

function groupByDay(entries: AuditEntry[]) {
  const groups: { label: string; entries: AuditEntry[] }[] = []
  const now = new Date()
  const todayStr = now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const yesterdayStr = yesterday.toDateString()

  const seen: Record<string, number> = {}
  for (const entry of entries) {
    const d = new Date(entry.timestamp)
    const dStr = d.toDateString()
    let label: string
    if (dStr === todayStr) label = 'TODAY'
    else if (dStr === yesterdayStr) label = 'YESTERDAY'
    else {
      label = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase()
    }
    if (seen[label] === undefined) {
      seen[label] = groups.length
      groups.push({ label, entries: [] })
    }
    groups[seen[label]].entries.push(entry)
  }
  return groups
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

const ActorIcon = ({ type }: { type: AuditEntry['actor']['type'] }) => {
  if (type === 'user') return <User className="w-3.5 h-3.5" />
  if (type === 'ai_agent') return <Bot className="w-3.5 h-3.5" />
  return <Settings className="w-3.5 h-3.5" />
}

const actorBg: Record<string, string> = {
  user: 'bg-blue-100 text-blue-600',
  ai_agent: 'bg-purple-100 text-purple-600',
  system: 'bg-gray-100 text-gray-500',
}

function AuditRow({ entry }: { entry: AuditEntry }) {
  const [expanded, setExpanded] = useState(false)

  const canExpand = !!entry.detail || !!entry.diff

  const actionColors: Record<string, string> = {
    deal_approved: 'text-emerald-600',
    deal_rejected: 'text-red-600',
    deal_auto_rejected: 'text-red-600',
    deal_auto_approved: 'text-emerald-600',
    rule_modified: 'text-blue-600',
    pattern_detected: 'text-amber-600',
    deal_submitted: 'text-gray-700',
    deal_flagged: 'text-amber-600',
    override_applied: 'text-amber-600',
  }

  const actionIcon: Record<string, React.ReactNode> = {
    deal_approved: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    deal_auto_approved: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
    deal_rejected: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
    deal_auto_rejected: <AlertTriangle className="w-3.5 h-3.5 text-red-500" />,
    rule_modified: <RefreshCw className="w-3.5 h-3.5 text-blue-500" />,
    pattern_detected: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
    deal_flagged: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
    deal_submitted: <FileText className="w-3.5 h-3.5 text-gray-400" />,
    override_applied: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
  }

  return (
    <div className="border-b border-gray-50 last:border-0">
      <div
        className={cn(
          'flex items-start gap-3 px-5 py-3.5 transition-colors',
          canExpand && 'cursor-pointer hover:bg-gray-50',
        )}
        onClick={() => canExpand && setExpanded((v) => !v)}
      >
        {/* Time */}
        <span className="text-xs text-gray-400 whitespace-nowrap w-16 flex-shrink-0 mt-0.5 tabular-nums">
          {formatTime(entry.timestamp)}
        </span>

        {/* Actor avatar */}
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
            actorBg[entry.actor.type],
          )}
        >
          <ActorIcon type={entry.actor.type} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {actionIcon[entry.action]}
            <p className={cn('text-sm font-medium', actionColors[entry.action] ?? 'text-gray-800')}>
              {entry.summary}
            </p>
            {entry.dealId && (
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {entry.dealId}
              </span>
            )}
          </div>
        </div>

        {/* Expand */}
        {canExpand && (
          <button className="p-1 text-gray-400 flex-shrink-0">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && entry.detail && (
        <div className="mx-5 mb-3 ml-24 bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-700 leading-relaxed">{entry.detail}</p>
          </div>
        </div>
      )}

      {/* Diff view */}
      {expanded && entry.diff && entry.diff.length > 0 && (
        <div className="mx-5 mb-3 ml-24 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-700">Configuration Change</p>
          </div>
          <div className="font-mono text-xs p-3 space-y-1 bg-white">
            {entry.diff.map((d, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex gap-2 bg-red-50 px-2 py-1 rounded">
                  <span className="text-red-500 select-none">-</span>
                  <span className="text-red-700">
                    '{d.field}': {d.before}
                  </span>
                </div>
                <div className="flex gap-2 bg-emerald-50 px-2 py-1 rounded">
                  <span className="text-emerald-500 select-none">+</span>
                  <span className="text-emerald-700">
                    '{d.field}': {d.after}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const FILTER_LABELS = ['Last 7 Days', 'Actor', 'Action Type', 'Deal ID']

export function AuditLog() {
  const [search, setSearch] = useState('')
  const { showToast } = useDeals()

  const handleExportCSV = () => {
    const rows = [
      ['Timestamp', 'Actor', 'Actor Type', 'Summary', 'Deal ID'].join(','),
      ...mockAuditLog.map(e =>
        [new Date(e.timestamp).toISOString(), e.actor.name, e.actor.type, `"${e.summary}"`, e.dealId ?? ''].join(',')
      )
    ].join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-copilot-audit-log-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Audit log exported as CSV', 'success')
  }

  const handleExportPDF = () => {
    showToast('PDF report generation queued — you will receive it by email', 'info')
  }

  const filtered = mockAuditLog.filter(
    (e) =>
      !search ||
      e.summary.toLowerCase().includes(search.toLowerCase()) ||
      e.dealId?.toLowerCase().includes(search.toLowerCase()) ||
      e.actor.name.toLowerCase().includes(search.toLowerCase()),
  )

  const groups = groupByDay(filtered)

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-y-auto min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 bg-white border-b border-gray-200 z-10 px-6 py-3 flex items-center gap-4">
          <h1 className="text-base font-bold text-gray-900">Audit Log</h1>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs, IDs, or actors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <HelpCircle className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            </button>
            <button onClick={handleExportCSV} className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button onClick={handleExportPDF} className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors">
              <FileText className="w-4 h-4" />
              Export Report (PDF)
            </button>
          </div>
        </div>

        {/* Filters row */}
        <div className="px-6 py-3 bg-white border-b border-gray-100 flex items-center gap-3 flex-shrink-0">
          {FILTER_LABELS.map((label) => (
            <button
              key={label}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              {label}
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="px-6 py-5">
          {groups.length === 0 ? (
            <div className="text-center text-gray-400 py-16 text-sm">No audit entries match your search.</div>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-bold text-gray-400 tracking-widest">{group.label}</p>
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">{group.entries.length} events</span>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {group.entries.map((entry) => (
                    <AuditRow key={entry.id} entry={entry} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right stats sidebar */}
      <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto p-5 space-y-5">
        {/* Compliance Score */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-emerald-600" />
            <p className="text-sm font-semibold text-gray-900">Compliance Score</p>
          </div>
          <div className="text-center mb-4">
            <p className="text-5xl font-bold text-emerald-600">{auditWeeklyStats.complianceScore}%</p>
            <p className="text-xs text-gray-400 mt-1">Last 30 Days</p>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-emerald-500 rounded-full"
              style={{ width: `${auditWeeklyStats.complianceScore}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            Platform usage is highly compliant with all active policies.
          </p>
        </div>

        {/* Weekly Stats */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Weekly Statistics</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Total Events</p>
              <p className="text-sm font-bold text-gray-900 tabular-nums">
                {auditWeeklyStats.totalEvents.toLocaleString()}
              </p>
            </div>
            <div className="h-px bg-gray-50" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Manual Overrides</p>
              <p className="text-sm font-bold text-amber-600 tabular-nums">
                {auditWeeklyStats.manualOverrides}
              </p>
            </div>
            <div className="h-px bg-gray-50" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Rule Changes</p>
              <p className="text-sm font-bold text-blue-600 tabular-nums">
                {auditWeeklyStats.ruleChanges}
              </p>
            </div>
            <div className="h-px bg-gray-50" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">AI Actions</p>
              <p className="text-sm font-bold text-purple-600 tabular-nums">
                {auditWeeklyStats.aiActions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Actor breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Actor Breakdown</p>
          <div className="space-y-3">
            {[
              { label: 'AI Agent', count: 1105, color: 'bg-purple-500', pct: 89 },
              { label: 'Human', count: 131, color: 'bg-blue-500', pct: 10 },
              { label: 'System', count: 12, color: 'bg-gray-400', pct: 1 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">{item.label}</span>
                  <span className="text-xs font-semibold text-gray-700 tabular-nums">
                    {item.count.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', item.color)}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
