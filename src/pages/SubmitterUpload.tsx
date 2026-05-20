import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Image,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowLeft,
  Send,
} from 'lucide-react'
import { cn } from '../lib/utils'

type CheckStatus = 'pass' | 'warning' | 'queued' | 'scanning' | 'resolved'

interface CheckItem {
  id: string
  status: CheckStatus
  label: string
  detail: string
  resolvable?: boolean
}

const RESOLUTION_OPTIONS = [
  { value: 'update_crm', label: 'Update CRM Expected Close Date' },
  { value: 'resign', label: 'Require Client to Re-sign' },
  { value: 'exception', label: 'Mark as Intentional Exception' },
]

const DOCS = [
  { id: 'doc-1', name: 'Master_Service_Agreement.pdf', size: '2.4 MB · 14 pages', type: 'pdf', status: 'warning' as const, statusLabel: 'Issues Found' },
  { id: 'doc-2', name: 'PAN_Card_Authorized.jpg', size: '1.1 MB · Image', type: 'image', status: 'pass' as const, statusLabel: 'Validated' },
]

export function SubmitterUpload() {
  const navigate = useNavigate()
  const [activeDoc, setActiveDoc] = useState('doc-1')
  const [selectedResolution, setSelectedResolution] = useState('update_crm')
  const [submitted, setSubmitted] = useState(false)
  const [checks, setChecks] = useState<CheckItem[]>([
    { id: 'c1', status: 'pass', label: 'Document type detected', detail: 'Identified as Master Service Agreement' },
    { id: 'c2', status: 'pass', label: 'PAN matches HubSpot record', detail: 'Signatory identity verified via Govt database' },
    { id: 'c3', status: 'warning', label: 'Effective date mismatch', detail: 'The signature date on page 14 (12-Aug-2024) is older than the CRM Deal creation date (24-Oct-2024). This violates Policy SA-04.', resolvable: true },
    { id: 'c4', status: 'scanning', label: 'Checking indemnity clauses...', detail: 'Scanning paragraph 7.2 for standard limitations' },
    { id: 'c5', status: 'queued', label: 'Queued: Verify Schedule A Pricing', detail: '' },
  ])

  const passCount = checks.filter((c) => c.status === 'pass' || c.status === 'resolved').length
  const issueCount = checks.filter((c) => c.status === 'warning').length
  const allResolved = issueCount === 0 && checks.every((c) => c.status !== 'scanning' && c.status !== 'queued')

  const totalChecks = 26
  // Simulate progress: resolved items advance the check count
  const resolvedExtras = checks.filter(c => c.status === 'resolved').length * 3
  const displayComplete = Math.min(12 + resolvedExtras, totalChecks)
  const pct = Math.round((displayComplete / totalChecks) * 100)

  const handleApplyResolution = (checkId: string) => {
    setChecks((prev) =>
      prev.map((c) => {
        if (c.id === checkId) return { ...c, status: 'resolved' }
        // After resolving, advance scanning → pass and queued → pass to simulate progress
        if (c.status === 'scanning') return { ...c, status: 'pass', label: 'Indemnity clauses verified', detail: 'Standard limitation clauses found in §7.2 — compliant.' }
        if (c.status === 'queued') return { ...c, status: 'pass', label: 'Schedule A Pricing verified', detail: 'Line items match HubSpot deal record.' }
        return c
      }),
    )
  }

  const handleSubmit = () => {
    setSubmitted(true)
  }

  // Success screen
  if (submitted) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-base font-bold text-gray-900">AI Copilot</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Deal Submitted!</h2>
            <p className="text-gray-500 mb-2">
              <span className="font-semibold text-gray-900">Scholastic Solutions Pvt Ltd</span> has been submitted to Finance for review.
            </p>
            <p className="text-sm text-gray-400 mb-6">
              AI validation is complete. The Finance team will review your submission and respond within 24 hours.
            </p>

            <div className="bg-white border border-gray-200 rounded-xl p-5 text-left mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-700">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">AI validation complete</p>
                  <p className="text-xs text-gray-500">26 of 26 checks evaluated</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-auto" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-amber-700">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Queued for Finance review</p>
                  <p className="text-xs text-gray-500">Finance team will review within 24 hours</p>
                </div>
                <Clock className="w-4 h-4 text-amber-500 ml-auto" />
              </div>
              <div className="flex items-center gap-3 opacity-40">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-500">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Approval decision</p>
                  <p className="text-xs text-gray-500">You'll be notified by email</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/queue')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go to Deal Queue
              </button>
              <button
                onClick={() => {
                  setSubmitted(false)
                  setChecks([
                    { id: 'c1', status: 'pass', label: 'Document type detected', detail: 'Identified as Master Service Agreement' },
                    { id: 'c2', status: 'pass', label: 'PAN matches HubSpot record', detail: 'Signatory identity verified via Govt database' },
                    { id: 'c3', status: 'warning', label: 'Effective date mismatch', detail: 'The signature date on page 14 (12-Aug-2024) is older than the CRM Deal creation date (24-Oct-2024). This violates Policy SA-04.', resolvable: true },
                    { id: 'c4', status: 'scanning', label: 'Checking indemnity clauses...', detail: 'Scanning paragraph 7.2 for standard limitations' },
                    { id: 'c5', status: 'queued', label: 'Queued: Verify Schedule A Pricing', detail: '' },
                  ])
                }}
                className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Submit Another Deal
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/queue')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors mt-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">
                  New Deal Submission — Scholastic Solutions Pvt Ltd
                </h1>
                <button className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                  <ExternalLink className="w-3 h-3" />
                  View in CRM
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">Ref: DL-12345 · Created 10 mins ago</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Documents + Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Uploaded docs */}
          <div className="px-6 pt-5 pb-3 flex-shrink-0">
            <p className="text-sm font-semibold text-gray-800 mb-3">Uploaded Documents (2)</p>
            <div className="flex gap-3">
              {DOCS.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc.id)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
                    activeDoc === doc.id
                      ? 'border-blue-400 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300',
                  )}
                >
                  {doc.type === 'pdf' ? (
                    <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                  ) : (
                    <Image className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-900 leading-tight">{doc.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{doc.size}</p>
                  </div>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full ml-2 flex-shrink-0',
                    doc.status === 'pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
                  )}>
                    {doc.statusLabel}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Document preview */}
          <div className="flex-1 mx-6 mb-4 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-600">Page 1 of 14</span>
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors">
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500 w-10 text-center">100%</span>
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors">
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 flex justify-center">
              <div className="bg-white shadow-lg rounded border border-gray-200 w-full max-w-lg p-8 font-mono">
                <div className="text-center mb-6">
                  <p className="text-lg font-bold text-gray-900 tracking-wide">MASTER SERVICE AGREEMENT</p>
                  <p className="text-xs text-gray-500 mt-1">PE Cycle Template v4.2</p>
                  <div className="border-b border-gray-300 mt-4 mb-4" />
                </div>
                <div className="mb-5">
                  <p className="text-sm font-bold text-gray-800 mb-2">1. PARTIES</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    This Master Service Agreement is entered into as of{' '}
                    <span className="bg-amber-100 text-amber-800 px-0.5">12-August-2024</span> ("Effective Date")
                    between <strong>Scholastic Solutions Private Limited</strong> and <strong>PlanetSpark Education Technologies Pvt Ltd</strong>.
                  </p>
                </div>
                <div className="mb-5">
                  <p className="text-sm font-bold text-gray-800 mb-2">2. TERM AND TERMINATION</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    This Agreement shall remain in effect for <strong>3 (three) years</strong> from the Effective Date.
                  </p>
                </div>
                <div className="mb-5">
                  <p className="text-sm font-bold text-gray-800 mb-2">3. PAYMENT TERMS</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Total fee: <strong>₹4,50,000</strong>. Tranches: ₹1,50,000 on 01-Apr-2024, ₹1,50,000 on 01-Oct-2024, ₹1,50,000 on{' '}
                    <span className="bg-amber-100 text-amber-700">[DATE MISSING]</span>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Validation panel */}
        <div className="w-96 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-bold text-blue-700">Validation in Progress</p>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">Engine v2.4.1</span>
            </div>
          </div>

          {/* Checklist header */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-4 bg-gray-50 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-700">Live Checklist</p>
            <div className="flex items-center gap-3 ml-auto">
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {passCount} Passed
              </span>
              {issueCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  {issueCount} Issues
                </span>
              )}
              {issueCount === 0 && passCount > 2 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  All resolved
                </span>
              )}
            </div>
          </div>

          {/* Check list */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {checks.map((check) => (
              <div key={check.id} className="px-5 py-3">
                <div className="flex items-start gap-3">
                  {(check.status === 'pass' || check.status === 'resolved') && (
                    <CheckCircle2 className={cn('w-4 h-4 flex-shrink-0 mt-0.5', check.status === 'resolved' ? 'text-blue-500' : 'text-emerald-500')} />
                  )}
                  {check.status === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  )}
                  {check.status === 'scanning' && (
                    <Loader2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
                  )}
                  {check.status === 'queued' && (
                    <Clock className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs font-medium leading-tight',
                      (check.status === 'pass' || check.status === 'resolved') && 'text-gray-800',
                      check.status === 'warning' && 'text-amber-800',
                      check.status === 'scanning' && 'text-blue-700',
                      check.status === 'queued' && 'text-gray-400',
                    )}>
                      {check.label}
                      {check.status === 'resolved' && (
                        <span className="ml-1 text-blue-600 font-normal">(Override applied)</span>
                      )}
                    </p>
                    {check.detail && <p className="text-xs text-gray-500 mt-0.5">{check.detail}</p>}

                    {/* Resolution options for warnings */}
                    {check.status === 'warning' && check.resolvable && (
                      <div className="mt-3 bg-amber-50 border border-amber-100 rounded-lg p-3">
                        <p className="text-xs font-semibold text-amber-800 mb-2">Resolution Options</p>
                        <div className="space-y-2">
                          {RESOLUTION_OPTIONS.map((opt) => (
                            <label key={opt.value} className="flex items-start gap-2 cursor-pointer">
                              <input
                                type="radio"
                                name={`resolution-${check.id}`}
                                value={opt.value}
                                checked={selectedResolution === opt.value}
                                onChange={() => setSelectedResolution(opt.value)}
                                className="mt-0.5 text-blue-600"
                              />
                              <span className="text-xs text-gray-700">{opt.label}</span>
                            </label>
                          ))}
                        </div>
                        <button
                          onClick={() => handleApplyResolution(check.id)}
                          className="mt-3 w-full py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                        >
                          Apply Resolution
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sticky bottom bar */}
          <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-900">{displayComplete}</span> of {totalChecks} checks complete
                </p>
                <span className="text-xs font-semibold text-gray-700">{pct}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', allResolved ? 'bg-emerald-500' : 'bg-blue-500')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {issueCount > 0 && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  {issueCount} amber issue{issueCount > 1 ? 's' : ''} must be resolved before submission.
                </p>
              </div>
            )}

            {allResolved && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 font-medium">All issues resolved — ready to submit!</p>
              </div>
            )}

            <div className="flex gap-2">
              <button className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
                Save Draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={issueCount > 0}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  issueCount === 0
                    ? 'text-white bg-emerald-600 hover:bg-emerald-700 cursor-pointer'
                    : 'text-white bg-emerald-300 cursor-not-allowed',
                )}
              >
                <Send className="w-4 h-4" />
                Submit for Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
