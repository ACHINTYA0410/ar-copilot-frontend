import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileText,
  Users,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Clock,
  Loader2,
} from 'lucide-react'
import { dealsApi } from '../lib/api/deals'
import { validationApi } from '../lib/api/validation'
import { useDeal } from '../hooks/useDeal'
import { useValidationRun } from '../hooks/useValidationRun'
import { StatusPill } from '../components/shared/StatusPill'
import { ValidationStrip } from '../components/shared/ValidationStrip'
import { RuleCard } from '../components/shared/RuleCard'
import { Modal } from '../components/shared/Modal'
import { cn, formatCurrency, formatTimeAgo } from '../lib/utils'
import type { ApiRuleResultResponse } from '../types/api'
import type { ValidationRule, RuleSection } from '../types'

// ─── Adapter: backend result → ValidationRule for existing UI components ──────

function toValidationRule(r: ApiRuleResultResponse): ValidationRule {
  const rawStatus = r.status
  let status: 'pass' | 'warning' | 'fail'
  if (rawStatus === 'pass') status = 'pass'
  else if (rawStatus === 'warning') status = 'warning'
  else if (rawStatus === 'fail') status = 'fail'
  else status = 'pass' // pending/running treated as pass for display

  return {
    id: r.id,
    name: r.rule_name,
    section: r.section as RuleSection,
    status,
    confidence: Math.round(r.confidence * 100),
    description: r.ai_reasoning ?? '',
    evidence: r.evidence ?? '',
    actions: status !== 'pass' ? ['approve_anyway', 'reject_reason'] : [],
  }
}

const SECTION_ORDER: RuleSection[] = [
  'Document Content',
  'HubSpot Data Match',
  'Approval & Policy',
  'HubSpot Field Completeness',
]

const TABS = ['Validation Checklist', 'Documents', 'Activity Log'] as const

function SectionBlock({
  title,
  rules,
  resultIds,
  activeRuleId,
  onRuleToggle,
  expandedRuleId,
  onApproveAnyway,
  onRejectWithReason,
}: {
  readonly title: string
  readonly rules: ValidationRule[]
  readonly resultIds: string[]
  readonly activeRuleId: string | undefined
  readonly onRuleToggle: (id: string) => void
  readonly expandedRuleId: string | undefined
  readonly onApproveAnyway: (resultId: string) => void
  readonly onRejectWithReason: (resultId: string) => void
}) {
  const [open, setOpen] = useState(title === 'Document Content')

  const passCount = rules.filter((r) => r.status === 'pass').length
  const warnCount = rules.filter((r) => r.status === 'warning').length
  const failCount = rules.filter((r) => r.status === 'fail').length

  let sectionStatus: 'pass' | 'warning' | 'fail' = 'pass'
  if (failCount > 0) sectionStatus = 'fail'
  else if (warnCount > 0) sectionStatus = 'warning'

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        {sectionStatus === 'fail' ? (
          <XCircle className="w-3.5 h-3.5 text-red-500" />
        ) : sectionStatus === 'warning' ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        )}
        <span className="flex-1 text-sm font-semibold text-gray-800">
          {title} ({rules.length} checks)
        </span>
        <div className="flex items-center gap-2 text-xs">
          {passCount > 0 && <span className="text-emerald-600">{passCount} passed</span>}
          {warnCount > 0 && <span className="text-amber-600">{warnCount} warnings</span>}
          {failCount > 0 && <span className="text-red-600">{failCount} failed</span>}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />
        )}
      </button>
      {open && (
        <div>
          {rules.map((rule, idx) => (
            <div
              key={rule.id}
              id={`rule-${rule.id}`}
              ref={
                activeRuleId === rule.id
                  ? (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  : undefined
              }
            >
              <RuleCard
                rule={rule}
                isExpanded={expandedRuleId === rule.id}
                onToggle={() => onRuleToggle(rule.id)}
                onApproveAnyway={() => onApproveAnyway(resultIds[idx] ?? rule.id)}
                onRejectWithReason={() => onRejectWithReason(resultIds[idx] ?? rule.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const PAST_DEALS = [
  { id: 'DL-10921', customer: 'TechFlow India Ltd', status: 'rejected' as const, date: 'Mar 10' },
  { id: 'DL-10880', customer: 'GlobalSys Corp', status: 'rejected' as const, date: 'Feb 28' },
  { id: 'DL-10700', customer: 'Apex Solutions', status: 'approved' as const, date: 'Jan 15' },
]

export function DealApprovalDashboard() {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Validation Checklist')
  const [expandedRuleId, setExpandedRuleId] = useState<string | undefined>()
  const [activeStripRule, setActiveStripRule] = useState<string | undefined>()

  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [approveNote, setApproveNote] = useState('')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [clarifyModalOpen, setClarifyModalOpen] = useState(false)
  const [clarifyMessage, setClarifyMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { data: deal, isLoading: dealLoading, isError: dealError } = useDeal(dealId)
  const runId = deal?.latest_validation?.id ?? null
  const { data: validationRun } = useValidationRun(runId)

  // Build sections from validation run results
  const allResults = validationRun?.rule_results ?? []
  const allRules = allResults.map(toValidationRule)

  const sectionMap: Record<string, { rules: ValidationRule[]; ids: string[] }> = {}
  for (const result of allResults) {
    const rule = toValidationRule(result)
    if (!sectionMap[rule.section]) sectionMap[rule.section] = { rules: [], ids: [] }
    sectionMap[rule.section].rules.push(rule)
    sectionMap[rule.section].ids.push(result.id)
  }

  const handleStripClick = (ruleId: string) => {
    setActiveStripRule(ruleId)
    setExpandedRuleId(ruleId)
    setActiveTab('Validation Checklist')
    setTimeout(() => {
      document.getElementById(`rule-${ruleId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, 100)
  }

  const handleRuleToggle = (id: string) => {
    setExpandedRuleId((prev) => (prev === id ? undefined : id))
    setActiveStripRule(id)
  }

  const handleApproveAnyway = async (resultId: string) => {
    try {
      await validationApi.applyAction(resultId, { action: 'approve_anyway' })
      await queryClient.invalidateQueries({ queryKey: ['validation-run', runId] })
      toast.success('Rule result overridden — approved anyway')
    } catch {
      // global interceptor handles toast
    }
  }

  const handleRejectWithReason = async (resultId: string) => {
    try {
      await validationApi.applyAction(resultId, { action: 'reject_reason' })
      await queryClient.invalidateQueries({ queryKey: ['validation-run', runId] })
      toast.info('Rejection reason recorded')
    } catch {
      // global interceptor handles toast
    }
  }

  const patchDeal = async (status: 'approved' | 'rejected' | 'needs_clarification') => {
    if (!deal) return
    setSubmitting(true)
    try {
      await dealsApi.update(deal.id, { status: status as Parameters<typeof dealsApi.update>[1]['status'] })
      await queryClient.invalidateQueries({ queryKey: ['deal', deal.id] })
      await queryClient.invalidateQueries({ queryKey: ['deals'] })
      await queryClient.invalidateQueries({ queryKey: ['deal-stats'] })
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmApprove = async () => {
    if (!deal) return
    await patchDeal('approved')
    toast.success(`${deal.customer_name} approved successfully`)
    setApproveModalOpen(false)
    navigate('/queue')
  }

  const handleConfirmReject = async () => {
    if (!deal || !rejectReason.trim()) return
    await patchDeal('rejected')
    toast.info(`${deal.customer_name} rejected — submitter notified`)
    setRejectModalOpen(false)
    navigate('/queue')
  }

  const handleSendClarification = async () => {
    if (!deal || !clarifyMessage.trim()) return
    await patchDeal('needs_clarification' as Parameters<typeof patchDeal>[0])
    toast.info(`Clarification request sent to ${deal.submitted_by_name}`)
    setClarifyModalOpen(false)
    setClarifyMessage('')
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (dealLoading) {
    return (
      <div className="flex flex-1 overflow-hidden bg-gray-50">
        {/* Center column Skeleton */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="max-w-3xl mx-auto px-6 py-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5 h-32 flex flex-col justify-between">
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <div className="w-24 h-6 bg-gray-100 rounded animate-pulse" />
                  <div className="w-20 h-6 bg-gray-100 rounded-full animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="w-24 h-8 bg-gray-100 rounded-lg animate-pulse" />
                  <div className="w-24 h-8 bg-gray-100 rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
              <div className="flex gap-4">
                <div className="w-24 h-5 bg-gray-100 rounded animate-pulse" />
                <div className="w-32 h-5 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 h-40">
              <div className="flex justify-between mb-4">
                <div className="w-32 h-5 bg-gray-200 rounded animate-pulse" />
                <div className="w-24 h-5 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex-1 h-12 bg-gray-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
        {/* Right sidebar Skeleton */}
        <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto p-5 space-y-4">
          <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-4" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (dealError || !deal) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl border border-gray-200 shadow-sm max-w-sm w-full mx-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-base font-semibold text-gray-900 mb-2">Deal Not Found</p>
          <p className="text-sm text-gray-500 mb-6">
            The deal <span className="font-mono bg-gray-100 px-1 rounded text-gray-700">{dealId}</span> could not be loaded. It may have been deleted or you might not have permission to view it.
          </p>
          <button
            onClick={() => navigate('/queue')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Return to Deal Queue
          </button>
        </div>
      </div>
    )
  }

  const amount = parseFloat(deal.amount)
  const isResolved = deal.status === 'approved' || deal.status === 'rejected'
  const failCount = allRules.filter((r) => r.status === 'fail').length
  const hasWarnings = allRules.some((r) => r.status === 'warning')

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-50">
      {/* Center column */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <button
              onClick={() => navigate('/queue')}
              className="hover:text-gray-900 transition-colors"
            >
              Deal Queue
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">{deal.customer_name}</span>
          </div>

          {/* Resolved banner */}
          {isResolved && (
            <div
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3.5 mb-5',
                deal.status === 'approved'
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-red-50 border border-red-200',
              )}
            >
              {deal.status === 'approved' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              )}
              <div>
                <p
                  className={cn(
                    'text-sm font-bold',
                    deal.status === 'approved' ? 'text-emerald-900' : 'text-red-900',
                  )}
                >
                  Deal {deal.status === 'approved' ? 'Approved' : 'Rejected'}
                </p>
                <p
                  className={cn(
                    'text-xs mt-0.5',
                    deal.status === 'approved' ? 'text-emerald-700' : 'text-red-700',
                  )}
                >
                  {deal.status === 'approved'
                    ? 'This deal has been approved and is being processed.'
                    : 'This deal has been rejected. The submitter has been notified.'}
                </p>
              </div>
              <button
                onClick={() => navigate('/queue')}
                className="ml-auto text-xs font-medium text-gray-600 hover:text-gray-900 underline"
              >
                Back to queue
              </button>
            </div>
          )}

          {/* Pattern detection banner */}
          {!isResolved && (
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3.5 mb-5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900">Pattern Detection Active</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Similar missing annexure patterns detected in 3 recent deals from this submitting
                  region. High risk of delay.
                </p>
              </div>
            </div>
          )}

          {/* Deal header card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-gray-100 text-gray-700 text-xs font-mono font-medium px-2.5 py-1 rounded-md">
                  ID: {deal.id}
                </span>
                <StatusPill status={deal.status} />
              </div>
              {!isResolved && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setClarifyModalOpen(true)}
                    disabled={submitting}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Request Clarification
                  </button>
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    disabled={submitting}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => setApproveModalOpen(true)}
                    disabled={submitting}
                    className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{deal.customer_name}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="text-lg font-semibold text-gray-900">{formatCurrency(amount)}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Submitted {formatTimeAgo(deal.submitted_at)}
              </span>
            </div>
          </div>

          {/* Validation Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">Validation Status</p>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">
                  {deal.latest_validation?.passed ?? deal.validation_score_passed}
                </span>{' '}
                of {deal.latest_validation?.total_rules ?? deal.validation_score_total} checks passed
              </p>
            </div>
            {allRules.length > 0 ? (
              <ValidationStrip
                rules={allRules}
                onPillClick={handleStripClick}
                activeRuleId={activeStripRule}
              />
            ) : (
              <p className="text-xs text-gray-400">
                {runId ? 'Loading validation results...' : 'No validation run found for this deal.'}
              </p>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'Validation Checklist' && (
            <div>
              {allRules.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                  <p className="text-sm text-gray-400">
                    {runId
                      ? 'Validation results are loading...'
                      : 'No validation run found. Trigger a validation from the Submitter Upload screen.'}
                  </p>
                </div>
              ) : (
                SECTION_ORDER.map((section) => {
                  const sec = sectionMap[section]
                  if (!sec || sec.rules.length === 0) return null
                  return (
                    <SectionBlock
                      key={section}
                      title={section}
                      rules={sec.rules}
                      resultIds={sec.ids}
                      activeRuleId={activeStripRule}
                      expandedRuleId={expandedRuleId}
                      onRuleToggle={handleRuleToggle}
                      onApproveAnyway={handleApproveAnyway}
                      onRejectWithReason={handleRejectWithReason}
                    />
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'Documents' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center py-16">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">Uploaded Documents</p>
              {deal.documents && deal.documents.length > 0 ? (
                <div className="mt-4 space-y-2 text-left max-w-md mx-auto">
                  {deal.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-lg"
                    >
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{doc.original_filename}</p>
                        <p className="text-xs text-gray-400 capitalize">{doc.document_type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-1">No documents uploaded yet.</p>
              )}
            </div>
          )}

          {activeTab === 'Activity Log' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center py-16">
              <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">Activity Log</p>
              <p className="text-xs text-gray-400 mt-1">
                View full activity in the{' '}
                <button
                  onClick={() => navigate('/audit')}
                  className="text-blue-600 hover:underline"
                >
                  Audit Log
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Intelligence sidebar */}
      <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-white overflow-y-auto">
        <div className="p-5 space-y-4">
          <p className="text-sm font-bold text-gray-900">Intelligence Context</p>

          {/* AI Summary */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-semibold text-blue-800">AI Summary</p>
            </div>
            <div className="space-y-2 text-xs text-blue-900 leading-relaxed">
              <p>
                This deal from {deal.customer_name} shows a{' '}
                {deal.validation_score_total > 0
                  ? `${deal.validation_score_passed}/${deal.validation_score_total} check`
                  : 'pending'}{' '}
                validation result
                {failCount > 0 ? ` with ${failCount} critical failure${failCount > 1 ? 's' : ''}` : ''}.
              </p>
              <p>
                Submitter {deal.submitted_by_name} ({deal.submitted_by_zone} region) has a{' '}
                {deal.first_pass_rate}% first-pass rate.
              </p>
            </div>
          </div>

          {/* Similar past deals */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">Similar Past Deals</p>
            </div>
            <div className="divide-y divide-gray-50">
              {PAST_DEALS.map((pd) => (
                <div key={pd.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{pd.customer}</p>
                    <p className="text-xs text-gray-400">{pd.date}</p>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      pd.status === 'rejected'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-emerald-50 text-emerald-600',
                    )}
                  >
                    {pd.status === 'rejected' ? 'Rejected' : 'Approved'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submitter context */}
          <div className="border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-semibold text-gray-700">Submitter Context</p>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                style={{ backgroundColor: deal.submitted_by_avatar_color }}
              >
                {deal.submitted_by_name
                  .split(' ')
                  .map((w) => w[0])
                  .join('')}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{deal.submitted_by_name}</p>
                <p className="text-xs text-gray-500">
                  Sales Rep · {deal.submitted_by_zone} Region
                </p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-emerald-800">
                {deal.first_pass_rate}% First-Pass Approval Rate
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">Last 90 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Approve Modal ─────────────────────────────────────────────── */}
      <Modal
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Deal"
        subtitle={`${deal.customer_name} — ${formatCurrency(amount)}`}
      >
        {hasWarnings && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              This deal has {allRules.filter((r) => r.status !== 'pass').length} unresolved
              warnings/failures. You are approving with an override.
            </p>
          </div>
        )}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Override Note <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="Explain why you are approving despite open issues..."
            value={approveNote}
            onChange={(e) => setApproveNote(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setApproveModalOpen(false)}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmApprove}
            disabled={submitting}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? 'Approving...' : 'Confirm Approval'}
          </button>
        </div>
      </Modal>

      {/* ─── Reject Modal ──────────────────────────────────────────────── */}
      <Modal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Deal"
        subtitle="The submitter will be notified with your feedback."
      >
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Reason for Rejection <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder="Describe what needs to be fixed before resubmission..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            This message will be sent directly to {deal.submitted_by_name}.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setRejectModalOpen(false)}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmReject}
            disabled={!rejectReason.trim() || submitting}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Rejecting...' : 'Confirm Rejection'}
          </button>
        </div>
      </Modal>

      {/* ─── Clarify Modal ─────────────────────────────────────────────── */}
      <Modal
        open={clarifyModalOpen}
        onClose={() => setClarifyModalOpen(false)}
        title={`Request Clarification from ${deal.submitted_by_name}`}
        subtitle="The submitter will receive this as an in-app notification and email."
      >
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Your Message <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder={`Hi ${deal.submitted_by_name}, I need clarification on...`}
            value={clarifyMessage}
            onChange={(e) => setClarifyMessage(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
          />
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 mb-5">
          <p className="text-xs text-blue-800">
            The deal will remain in your queue while awaiting clarification.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setClarifyModalOpen(false)}
            className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSendClarification}
            disabled={!clarifyMessage.trim() || submitting}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Sending...' : 'Send Request'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
