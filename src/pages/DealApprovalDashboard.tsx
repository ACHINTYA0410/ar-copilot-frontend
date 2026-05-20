import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
} from 'lucide-react'
import { mockDeals } from '../data/mockDeals'
import { mockRules, getRulesBySection } from '../data/mockRules'
import { StatusPill } from '../components/shared/StatusPill'
import { ValidationStrip } from '../components/shared/ValidationStrip'
import { RuleCard } from '../components/shared/RuleCard'
import { Modal } from '../components/shared/Modal'
import { useDeals } from '../context/DealsContext'
import { cn, formatCurrency, formatTimeAgo } from '../lib/utils'
import type { RuleSection } from '../types'

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
  activeRuleId,
  onRuleToggle,
  expandedRuleId,
}: {
  title: string
  rules: typeof mockRules
  activeRuleId: string | undefined
  onRuleToggle: (id: string) => void
  expandedRuleId: string | undefined
}) {
  const [open, setOpen] = useState(title === 'Document Content')

  const passCount = rules.filter((r) => r.status === 'pass').length
  const warnCount = rules.filter((r) => r.status === 'warning').length
  const failCount = rules.filter((r) => r.status === 'fail').length
  const sectionStatus = failCount > 0 ? 'fail' : warnCount > 0 ? 'warning' : 'pass'

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
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 ml-1" /> : <ChevronDown className="w-4 h-4 text-gray-400 ml-1" />}
      </button>
      {open && (
        <div>
          {rules.map((rule) => (
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
  const { updateDealStatus, getEffectiveStatus, showToast } = useDeals()

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('Validation Checklist')
  const [expandedRuleId, setExpandedRuleId] = useState<string | undefined>('R-06')
  const [activeStripRule, setActiveStripRule] = useState<string | undefined>()

  // Modal states
  const [approveModalOpen, setApproveModalOpen] = useState(false)
  const [approveNote, setApproveNote] = useState('')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [clarifyModalOpen, setClarifyModalOpen] = useState(false)
  const [clarifyMessage, setClarifyMessage] = useState('')

  const deal = mockDeals.find((d) => d.id === dealId) ?? mockDeals[0]
  const sections = getRulesBySection(mockRules)
  const effectiveStatus = getEffectiveStatus(deal.id)

  const hasWarnings = mockRules.some((r) => r.status === 'warning')
  const failCount = mockRules.filter((r) => r.status === 'fail').length

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

  const handleConfirmApprove = () => {
    updateDealStatus(deal.id, 'approved')
    showToast(`${deal.customer} approved successfully`, 'success')
    setApproveModalOpen(false)
    navigate('/queue')
  }

  const handleConfirmReject = () => {
    if (!rejectReason.trim()) return
    updateDealStatus(deal.id, 'rejected')
    showToast(`${deal.customer} rejected — submitter notified`, 'info')
    setRejectModalOpen(false)
    navigate('/queue')
  }

  const handleSendClarification = () => {
    if (!clarifyMessage.trim()) return
    showToast(`Clarification request sent to ${deal.submittedBy.name}`, 'info')
    setClarifyModalOpen(false)
    setClarifyMessage('')
  }

  const isResolved = effectiveStatus === 'approved' || effectiveStatus === 'rejected'

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-50">
      {/* Center column */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-3xl mx-auto px-6 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
            <button onClick={() => navigate('/queue')} className="hover:text-gray-900 transition-colors">
              Deal Queue
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">{deal.customer}</span>
          </div>

          {/* Resolved banner */}
          {isResolved && (
            <div className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-3.5 mb-5',
              effectiveStatus === 'approved'
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            )}>
              {effectiveStatus === 'approved'
                ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                : <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />}
              <div>
                <p className={cn('text-sm font-bold', effectiveStatus === 'approved' ? 'text-emerald-900' : 'text-red-900')}>
                  Deal {effectiveStatus === 'approved' ? 'Approved' : 'Rejected'}
                </p>
                <p className={cn('text-xs mt-0.5', effectiveStatus === 'approved' ? 'text-emerald-700' : 'text-red-700')}>
                  {effectiveStatus === 'approved'
                    ? 'This deal has been approved and is being processed.'
                    : 'This deal has been rejected. The submitter has been notified.'}
                </p>
              </div>
              <button onClick={() => navigate('/queue')} className="ml-auto text-xs font-medium text-gray-600 hover:text-gray-900 underline">
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
                  Similar missing annexure patterns detected in 3 recent deals from this submitting region. High risk of delay.
                </p>
              </div>
              <button className="text-xs font-medium text-amber-700 underline hover:text-amber-900 flex-shrink-0">
                View Analysis
              </button>
            </div>
          )}

          {/* Deal header card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-gray-100 text-gray-700 text-xs font-mono font-medium px-2.5 py-1 rounded-md">
                  ID: {deal.id}
                </span>
                <StatusPill status={effectiveStatus} />
              </div>
              {!isResolved && (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => setClarifyModalOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Request Clarification
                  </button>
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                  <button
                    onClick={() => setApproveModalOpen(true)}
                    className="flex items-center gap-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve
                  </button>
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{deal.customer}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="text-lg font-semibold text-gray-900">{formatCurrency(deal.amount)}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Submitted {formatTimeAgo(deal.submittedAt)}
              </span>
            </div>
          </div>

          {/* Validation Status */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-gray-900">Validation Status</p>
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-900">{deal.validationScore.passed}</span>
                {' '}of {deal.validationScore.total} checks passed
              </p>
            </div>
            <ValidationStrip
              rules={mockRules}
              onPillClick={handleStripClick}
              activeRuleId={activeStripRule}
            />
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
              {SECTION_ORDER.map((section) => (
                <SectionBlock
                  key={section}
                  title={section}
                  rules={sections[section]}
                  activeRuleId={activeStripRule}
                  expandedRuleId={expandedRuleId}
                  onRuleToggle={handleRuleToggle}
                />
              ))}
            </div>
          )}

          {activeTab === 'Documents' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center py-16">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">Document Preview</p>
              <p className="text-xs text-gray-400 mt-1">Uploaded documents would appear here</p>
            </div>
          )}

          {activeTab === 'Activity Log' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center py-16">
              <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium text-gray-600">Activity Log</p>
              <p className="text-xs text-gray-400 mt-1">Deal activity history would appear here</p>
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
                This deal from {deal.customer} shows a strong overall match with HubSpot records ({deal.validationScore.passed}/{deal.validationScore.total} checks passed), but has {failCount} critical failure{failCount > 1 ? 's' : ''} requiring attention before approval.
              </p>
              <p>
                The missing Pricing Annexure on Page 4 is the most significant issue — this section contains binding price commitments and cannot be waived without escalation. The effective date discrepancy of 3 days may indicate a backdating attempt or a data entry error.
              </p>
              <p>
                The submitter ({deal.submittedBy.name}) has a {deal.firstPassRate}% first-pass rate, suggesting this may be an inadvertent oversight rather than a systemic issue.
              </p>
            </div>
          </div>

          {/* Document preview */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              <p className="text-xs font-semibold text-gray-700">Master Agreement</p>
            </div>
            <div className="relative bg-gray-100 h-40 flex items-center justify-center">
              <div className="bg-white w-32 h-36 rounded shadow-sm mx-auto flex flex-col items-start p-2 text-[6px] text-gray-400 overflow-hidden relative">
                <div className="w-full h-1.5 bg-gray-200 rounded mb-1" />
                <div className="w-3/4 h-1 bg-gray-100 rounded mb-2" />
                <div className="w-full h-0.5 bg-gray-100 rounded mb-1" />
                <div className="w-full h-0.5 bg-gray-100 rounded mb-1" />
                <div className="w-2/3 h-0.5 bg-gray-100 rounded mb-2" />
                <div className="absolute right-2 bottom-8 w-8 h-10 border-2 border-red-500 rounded-sm bg-red-50 flex items-center justify-center">
                  <span className="text-[5px] text-red-600 text-center leading-tight font-bold">P4 Missing</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5">
              <p className="text-xs text-red-600 font-medium mb-2 flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                Page 4 (Missing Annexure)
              </p>
              <button className="text-xs text-blue-600 hover:underline">Open full preview →</button>
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
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    pd.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600',
                  )}>
                    {pd.status === 'rejected' ? 'Rejected' : 'Approved'}
                  </span>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-gray-50">
              <button
                onClick={() => navigate('/queue')}
                className="text-xs text-blue-600 hover:underline"
              >
                View all →
              </button>
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
                style={{ backgroundColor: deal.submittedBy.avatarColor }}
              >
                {deal.submittedBy.name.split(' ').map((w) => w[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{deal.submittedBy.name}</p>
                <p className="text-xs text-gray-500">Sales Rep · {deal.submittedBy.zone} Region</p>
              </div>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              <p className="text-xs font-semibold text-emerald-800">{deal.firstPassRate}% First-Pass Approval Rate</p>
              <p className="text-xs text-emerald-600 mt-0.5">Last 90 days · 23 deals submitted</p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Approve Modal ─────────────────────────────────────────────── */}
      <Modal
        open={approveModalOpen}
        onClose={() => setApproveModalOpen(false)}
        title="Approve Deal"
        subtitle={`${deal.customer} — ${formatCurrency(deal.amount)}`}
      >
        {hasWarnings && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2.5 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              This deal has {mockRules.filter(r => r.status !== 'pass').length} unresolved warnings/failures. You are approving with an override.
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
            className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Confirm Approval
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
          <p className="text-xs text-gray-400 mt-1">This message will be sent directly to {deal.submittedBy.name}.</p>
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
            disabled={!rejectReason.trim()}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm Rejection
          </button>
        </div>
      </Modal>

      {/* ─── Clarify Modal ─────────────────────────────────────────────── */}
      <Modal
        open={clarifyModalOpen}
        onClose={() => setClarifyModalOpen(false)}
        title={`Request Clarification from ${deal.submittedBy.name}`}
        subtitle="The submitter will receive this as an in-app notification and email."
      >
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
            Your Message <span className="text-red-500">*</span>
          </label>
          <textarea
            placeholder={`Hi ${deal.submittedBy.name}, I need clarification on...`}
            value={clarifyMessage}
            onChange={(e) => setClarifyMessage(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
          />
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5 mb-5">
          <p className="text-xs text-blue-800">
            The deal will remain in your queue while awaiting clarification. You'll be notified when {deal.submittedBy.name} responds.
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
            disabled={!clarifyMessage.trim()}
            className="flex-1 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Send Request
          </button>
        </div>
      </Modal>
    </div>
  )
}
