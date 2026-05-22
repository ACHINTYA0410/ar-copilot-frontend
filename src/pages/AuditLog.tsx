import { useState } from 'react'
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
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuditLog, useAuditStats } from '../hooks/useAuditLog'
import { cn } from '../lib/utils'
import type { ApiAuditLogResponse, ActorType, ActionType } from '../types/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function groupByDay(entries: ApiAuditLogResponse[]) {
  const groups: { label: string; entries: ApiAuditLogResponse[] }[] = []
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
      label = d
        .toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
        .toUpperCase()
    }
    if (seen[label] === undefined) {
      seen[label] = groups.length
      groups.push({ label, entries: [] })
    }
    groups[seen[label]].entries.push(entry)
  }
  return groups
}

function actionColor(action: ActionType): string {
  if (action === 'approved' || action === 'auto_approved') return 'text-emerald-600'
  if (action === 'rejected' || action === 'auto_rejected') return 'text-red-600'
  if (action === 'modified_rule') return 'text-blue-600'
  if (action === 'flagged') return 'text-amber-600'
  return 'text-gray-700'
}

function actionIcon(action: ActionType) {
  if (action === 'approved' || action === 'auto_approved')
    return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
  if (action === 'rejected' || action === 'auto_rejected')
    return <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
  if (action === 'modified_rule') return <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
  if (action === 'flagged') return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
  return <FileText className="w-3.5 h-3.5 text-gray-400" />
}

const actorBg: Record<ActorType, string> = {
  user: 'bg-blue-100 text-blue-600',
  ai_agent: 'bg-purple-100 text-purple-600',
  system: 'bg-gray-100 text-gray-500',
}

function ActorIcon({ type }: Readonly<{ type: ActorType }>) {
  if (type === 'user') return <User className="w-3.5 h-3.5" />
  if (type === 'ai_agent') return <Bot className="w-3.5 h-3.5" />
  return <Settings className="w-3.5 h-3.5" />
}

function safeStringify(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function buildDiff(
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): { field: string; before: string; after: string }[] {
  if (!before || !after) return []
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
  const diffs: { field: string; before: string; after: string }[] = []
  for (const key of allKeys) {
    const b = safeStringify(before[key])
    const a = safeStringify(after[key])
    if (b !== a) diffs.push({ field: key, before: b, after: a })
  }
  return diffs
}

function AuditRow({ entry }: Readonly<{ entry: ApiAuditLogResponse }>) {
  const [expanded, setExpanded] = useState(false)
  const diff = buildDiff(entry.before_value, entry.after_value)
  const canExpand = diff.length > 0

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (canExpand && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault()
      setExpanded((v) => !v)
    }
  }

  return (
    <div className="border-b border-gray-50 last:border-0">
      <div
        role={canExpand ? 'button' : undefined}
        tabIndex={canExpand ? 0 : undefined}
        className={cn(
          'flex items-start gap-3 px-5 py-3.5 transition-colors',
          canExpand && 'cursor-pointer hover:bg-gray-50',
        )}
        onClick={() => canExpand && setExpanded((v) => !v)}
        onKeyDown={handleKeyDown}
      >
        <span className="text-xs text-gray-400 whitespace-nowrap w-16 flex-shrink-0 mt-0.5 tabular-nums">
          {formatTime(entry.timestamp)}
        </span>

        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
            actorBg[entry.actor_type],
          )}
        >
          <ActorIcon type={entry.actor_type} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {actionIcon(entry.action_type)}
            <p className={cn('text-sm font-medium', actionColor(entry.action_type))}>
              {entry.description}
            </p>
            {entry.target_type === 'deal' && (
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {entry.target_id}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{entry.actor_name}</p>
        </div>

        {canExpand && (
          <button className="p-1 text-gray-400 flex-shrink-0" aria-label="Toggle diff">
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>

      {expanded && diff.length > 0 && (
        <div className="mx-5 mb-3 ml-24 border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-700">Configuration Change</p>
          </div>
          <div className="font-mono text-xs p-3 space-y-1 bg-white">
            {diff.map((d) => (
              <div key={d.field} className="space-y-0.5">
                <div className="flex gap-2 bg-red-50 px-2 py-1 rounded">
                  <span className="text-red-500 select-none">-</span>
                  <span className="text-red-700">'{d.field}': {d.before}</span>
                </div>
                <div className="flex gap-2 bg-emerald-50 px-2 py-1 rounded">
                  <span className="text-emerald-500 select-none">+</span>
                  <span className="text-emerald-700">'{d.field}': {d.after}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Timeline content helper (avoids nested ternaries) ───────────────────────

function TimelineContent({
  isLoading,
  isError,
  groups,
}: Readonly<{
  isLoading: boolean
  isError: boolean
  groups: { label: string; entries: ApiAuditLogResponse[] }[]
}>) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading audit log...</span>
      </div>
    )
  }
  if (isError) {
    return (
      <div className="text-center py-16">
        <p className="text-sm font-medium text-red-600 mb-1">Failed to load audit log</p>
        <p className="text-xs text-gray-400">
          Check that the FastAPI server is running on port 8000.
        </p>
      </div>
    )
  }
  if (groups.length === 0) {
    return (
      <div className="text-center text-gray-400 py-16 text-sm">
        No audit entries match your search.
      </div>
    )
  }
  return (
    <>
      {groups.map((group) => (
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
      ))}
    </>
  )
}

const FILTER_LABELS = ['Last 7 Days', 'Actor', 'Action Type', 'Deal ID']

export function AuditLog() {
  const [search, setSearch] = useState('')

  const { data, isLoading, isError } = useAuditLog({ search: search || undefined, page_size: 100 })
  const { data: stats, isLoading: statsLoading } = useAuditStats()

  const entries = data?.items ?? []
  const groups = groupByDay(entries)

  const handleExportCSV = () => {
    if (entries.length === 0) {
      toast.info('No entries to export.')
      return
    }
    const rows = [
      ['Timestamp', 'Actor', 'Actor Type', 'Action', 'Description', 'Target ID'].join(','),
      ...entries.map((e) =>
        [
          new Date(e.timestamp).toISOString(),
          e.actor_name,
          e.actor_type,
          e.action_type,
          `"${e.description.replace(/"/g, '""')}"`,
          e.target_id,
        ].join(','),
      ),
    ].join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Audit log exported as CSV')
  }

  const handleExportPDF = () => {
    // PDF export endpoint not yet implemented on the backend
    toast.info('PDF report generation is not yet available.')
  }

  return (
    <div className="flex flex-1 overflow-hidden">
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
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              title="PDF export not yet available"
              className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed"
            >
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
          <TimelineContent isLoading={isLoading} isError={isError} groups={groups} />
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
          {statsLoading ? (
            <div className="h-16 bg-gray-100 animate-pulse rounded" />
          ) : (
            <>
              <div className="text-center mb-4">
                <p className="text-5xl font-bold text-emerald-600">
                  {stats?.compliance_score ?? 0}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Last 7 Days</p>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${stats?.compliance_score ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Platform usage is highly compliant with all active policies.
              </p>
            </>
          )}
        </div>

        {/* Weekly Stats */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">Weekly Statistics</p>
          {statsLoading ? (
            <div className="space-y-3">
              {(['a', 'b', 'c', 'd', 'e'] as const).map((k) => (
                <div key={k} className="h-5 bg-gray-100 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Total Events', value: (stats?.total_actions_7d ?? 0).toLocaleString(), color: 'text-gray-900' },
                { label: 'Auto Processed', value: String(stats?.auto_processed_7d ?? 0), color: 'text-amber-600' },
                { label: 'Rule Changes', value: String(stats?.rule_changes_7d ?? 0), color: 'text-blue-600' },
                { label: 'Approvals', value: String(stats?.approvals_7d ?? 0), color: 'text-emerald-600' },
                { label: 'Rejections', value: String(stats?.rejections_7d ?? 0), color: 'text-red-500' },
              ].map((row, idx) => (
                <div key={row.label}>
                  {idx > 0 && <div className="h-px bg-gray-50 mb-3" />}
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{row.label}</p>
                    <p className={cn('text-sm font-bold tabular-nums', row.color)}>{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
