import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
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
  UploadCloud,
  X,
} from 'lucide-react'
import { documentsApi } from '../lib/api/documents'
import { validationApi } from '../lib/api/validation'
import { dealsApi } from '../lib/api/deals'
import { useValidationStream } from '../hooks/useValidationStream'
import { cn } from '../lib/utils'
import type { ApiRuleResultResponse } from '../types/api'

// Canonical deal used for the submitter upload demo
const DEMO_DEAL_ID = 'DL-12345'

// ─── Check row in Live Checklist ─────────────────────────────────────────────

function statusIcon(status: ApiRuleResultResponse['status']) {
  if (status === 'pass') return <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
  if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
  if (status === 'fail') return <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
  return <Loader2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
}

function CheckRow({ result }: Readonly<{ result: ApiRuleResultResponse }>) {
  const labelColor =
    result.status === 'warning'
      ? 'text-amber-800'
      : result.status === 'fail'
        ? 'text-red-800'
        : 'text-gray-800'

  return (
    <div className="px-5 py-3 animate-fade-in">
      <div className="flex items-start gap-3">
        {statusIcon(result.status)}
        <div className="flex-1 min-w-0">
          <p className={cn('text-xs font-medium leading-tight', labelColor)}>{result.rule_name}</p>
          {result.evidence && (
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{result.evidence}</p>
          )}
        </div>
        <span className="text-xs tabular-nums text-gray-400 flex-shrink-0">
          {Math.round(result.confidence * 100)}%
        </span>
      </div>
    </div>
  )
}

// ─── Uploaded file pill ───────────────────────────────────────────────────────

interface UploadedFile {
  file: File
  docId: string | null
  uploading: boolean
  error: boolean
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({
  passed,
  warnings,
  failed,
  onReset,
}: Readonly<{
  passed: number
  warnings: number
  failed: number
  onReset: () => void
}>) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          <span className="text-base font-bold text-gray-900">AR Co-Pilot</span>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Deal Submitted!</h2>
          <p className="text-gray-500 mb-2">
            <span className="font-semibold text-gray-900">Scholastic Solutions Pvt Ltd</span> has
            been submitted to Finance for review.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            AI validation complete — {passed} passed, {warnings} warnings, {failed} failed.
          </p>

          <div className="bg-white border border-gray-200 rounded-xl p-5 text-left mb-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-blue-700">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">AI validation complete</p>
                <p className="text-xs text-gray-500">{passed + warnings + failed} checks evaluated</p>
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
              onClick={onReset}
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

// ─── Main component ───────────────────────────────────────────────────────────

export function SubmitterUpload() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [activeDocIdx, setActiveDocIdx] = useState(0)
  const [runId, setRunId] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const stream = useValidationStream(runId)

  const passCount = stream.results.filter((r) => r.status === 'pass').length
  const warnCount = stream.results.filter((r) => r.status === 'warning').length
  const failCount = stream.results.filter((r) => r.status === 'fail').length
  const totalStreamed = stream.results.length
  const totalExpected = stream.summary ? stream.summary.passed + stream.summary.warnings + stream.summary.failed : totalStreamed
  const pct = totalExpected > 0 ? Math.round((totalStreamed / totalExpected) * 100) : 0
  const streamDone = stream.status === 'completed' || stream.status === 'timeout'
  const allClear = streamDone && failCount === 0 && warnCount === 0

  const uploadFile = useCallback(async (file: File) => {
    const entry: UploadedFile = { file, docId: null, uploading: true, error: false }
    setUploadedFiles((prev) => [...prev, entry])
    const idx = uploadedFiles.length

    try {
      const res = await documentsApi.upload(DEMO_DEAL_ID, file)
      setUploadedFiles((prev) =>
        prev.map((f, i) => (i === idx ? { ...f, docId: res.id, uploading: false } : f)),
      )
      toast.success(`${file.name} uploaded`)
    } catch {
      setUploadedFiles((prev) =>
        prev.map((f, i) => (i === idx ? { ...f, uploading: false, error: true } : f)),
      )
    }
  }, [uploadedFiles.length])

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    for (const f of files) await uploadFile(f)
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const f of files) await uploadFile(f)
    e.target.value = ''
  }

  const handleStartValidation = async () => {
    setValidating(true)
    try {
      const res = await validationApi.trigger(DEMO_DEAL_ID)
      setRunId(res.validation_run_id)
    } catch {
      // global interceptor shows toast
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async () => {
    try {
      await dealsApi.update(DEMO_DEAL_ID, { status: 'needs_review' })
      setSubmitted(true)
    } catch {
      // global interceptor shows toast
    }
  }

  const handleReset = () => {
    setUploadedFiles([])
    setRunId(null)
    setValidating(false)
    setSubmitted(false)
    stream.reset()
  }

  if (submitted && stream.summary) {
    return (
      <SuccessScreen
        passed={stream.summary.passed}
        warnings={stream.summary.warnings}
        failed={stream.summary.failed}
        onReset={handleReset}
      />
    )
  }

  const activeFile = uploadedFiles[activeDocIdx]
  const uploadsDone = uploadedFiles.length > 0 && uploadedFiles.every((f) => !f.uploading)

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
              <p className="text-sm text-gray-500 mt-0.5">
                Ref: {DEMO_DEAL_ID} · Upload documents to trigger AI validation
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Upload zone + Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Upload zone / file list */}
          <div className="px-6 pt-5 pb-3 flex-shrink-0">
            {uploadedFiles.length === 0 ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors',
                  dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white',
                )}
              >
                <UploadCloud className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm font-medium text-gray-600">
                  Drag & drop files here or{' '}
                  <span className="text-blue-600">browse</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG accepted</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800">
                    Uploaded Documents ({uploadedFiles.length})
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    + Add more
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
                <div className="flex gap-3 flex-wrap">
                  {uploadedFiles.map((uf, idx) => {
                    const isPdf = uf.file.name.toLowerCase().endsWith('.pdf')
                    return (
                      <button
                        key={`${uf.file.name}-${idx}`}
                        onClick={() => setActiveDocIdx(idx)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left',
                          activeDocIdx === idx
                            ? 'border-blue-400 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300',
                        )}
                      >
                        {isPdf ? (
                          <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                        ) : (
                          <Image className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-medium text-gray-900 leading-tight max-w-[140px] truncate">
                            {uf.file.name}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {(uf.file.size / 1024).toFixed(0)} KB
                          </p>
                        </div>
                        {uf.uploading ? (
                          <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
                        ) : uf.error ? (
                          <X className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Document preview */}
          <div className="flex-1 mx-6 mb-4 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-600">
                  {activeFile ? activeFile.file.name : 'No document selected'}
                </span>
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
              {uploadedFiles.length === 0 ? (
                <div className="flex items-center justify-center text-gray-300">
                  <div className="text-center">
                    <FileText className="w-16 h-16 mx-auto mb-3" />
                    <p className="text-sm">Upload a document to preview it here</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow-lg rounded border border-gray-200 w-full max-w-lg p-8 font-mono">
                  <div className="text-center mb-6">
                    <p className="text-lg font-bold text-gray-900 tracking-wide">
                      MASTER SERVICE AGREEMENT
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PE Cycle Template v4.2</p>
                    <div className="border-b border-gray-300 mt-4 mb-4" />
                  </div>
                  <div className="mb-5">
                    <p className="text-sm font-bold text-gray-800 mb-2">1. PARTIES</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      This Master Service Agreement is entered into as of{' '}
                      <span className="bg-amber-100 text-amber-800 px-0.5">12-August-2024</span>{' '}
                      ("Effective Date") between{' '}
                      <strong>Scholastic Solutions Private Limited</strong> and{' '}
                      <strong>PlanetSpark Education Technologies Pvt Ltd</strong>.
                    </p>
                  </div>
                  <div className="mb-5">
                    <p className="text-sm font-bold text-gray-800 mb-2">
                      2. TERM AND TERMINATION
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      This Agreement shall remain in effect for{' '}
                      <strong>3 (three) years</strong> from the Effective Date.
                    </p>
                  </div>
                  <div className="mb-5">
                    <p className="text-sm font-bold text-gray-800 mb-2">3. PAYMENT TERMS</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Total fee: <strong>₹4,50,000</strong>. Tranches: ₹1,50,000 on 01-Apr-2024,
                      ₹1,50,000 on 01-Oct-2024, ₹1,50,000 on{' '}
                      <span className="bg-amber-100 text-amber-700">[DATE MISSING]</span>.
                    </p>
                  </div>
                </div>
              )}
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
                <p className="text-sm font-bold text-blue-700">
                  {stream.status === 'idle' ? 'Ready to Validate' : 'Validation in Progress'}
                </p>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-mono">
                Engine v2.4.1
              </span>
            </div>

            {/* Trigger validation button */}
            {stream.status === 'idle' && (
              <button
                onClick={handleStartValidation}
                disabled={!uploadsDone || validating}
                className={cn(
                  'mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-colors',
                  uploadsDone && !validating
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed',
                )}
              >
                {validating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {validating
                  ? 'Starting...'
                  : uploadsDone
                    ? 'Run AI Validation'
                    : 'Upload documents first'}
              </button>
            )}
          </div>

          {/* Checklist header */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-4 bg-gray-50 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-700">Live Checklist</p>
            <div className="flex items-center gap-3 ml-auto">
              {passCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  {passCount} Passed
                </span>
              )}
              {warnCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  {warnCount} Warnings
                </span>
              )}
              {failCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-red-700">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                  {failCount} Failed
                </span>
              )}
            </div>
          </div>

          {/* Check list */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {stream.status === 'idle' && (
              <div className="px-5 py-8 text-center text-gray-400">
                <Zap className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                <p className="text-xs">Upload documents and run validation to see live results here.</p>
              </div>
            )}

            {(stream.status === 'connecting' || stream.status === 'streaming') &&
              stream.results.length === 0 && (
                <div className="px-5 py-8 flex items-center justify-center gap-2 text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">Starting validation engine...</span>
                </div>
              )}

            {stream.results.map((result) => (
              <CheckRow key={result.id} result={result} />
            ))}

            {stream.status === 'streaming' && stream.results.length > 0 && (
              <div className="px-5 py-3 flex items-center gap-2 text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs">Running next checks...</span>
              </div>
            )}

            {stream.status === 'error' && (
              <div className="px-5 py-4 bg-red-50">
                <p className="text-xs font-medium text-red-700">{stream.error}</p>
              </div>
            )}
          </div>

          {/* Sticky bottom bar */}
          <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
            {totalExpected > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold text-gray-900">{totalStreamed}</span> of{' '}
                    {totalExpected} checks complete
                  </p>
                  <span className="text-xs font-semibold text-gray-700">{pct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      allClear ? 'bg-emerald-500' : 'bg-blue-500',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}

            {streamDone && (warnCount > 0 || failCount > 0) && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-3">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  {warnCount + failCount} issue{warnCount + failCount > 1 ? 's' : ''} found.
                  Review before submitting.
                </p>
              </div>
            )}

            {allClear && (
              <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 mb-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-800 font-medium">
                  All checks passed — ready to submit!
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <button className="flex-1 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors">
                Save Draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={!streamDone}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  streamDone
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
