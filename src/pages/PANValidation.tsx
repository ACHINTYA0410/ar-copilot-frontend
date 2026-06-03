import { useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Database,
  FileText,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { panValidationApi } from '../lib/api/panValidation'
import type { PANValidationResponse, PANRuleResult } from '../lib/api/panValidation'

type LoadingPhase = 'idle' | 'extracting' | 'validating' | 'done'
type OverallStatus = 'PASS' | 'FAIL' | 'WARNING'

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf']

function StatusBadge({ status }: { status: OverallStatus }) {
  const cfg = {
    PASS: { bg: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
    FAIL: { bg: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
    WARNING: { bg: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle },
  }[status]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border',
        cfg.bg,
      )}
    >
      <Icon className="w-4 h-4" />
      {status}
    </span>
  )
}

function RuleStatusIcon({ status }: { status: string }) {
  if (status === 'PASS') return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
  if (status === 'FAIL') return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
  return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
}

function RuleRowBg(status: string) {
  if (status === 'PASS') return 'bg-green-50'
  if (status === 'FAIL') return 'bg-red-50'
  return 'bg-amber-50'
}

function DetailField({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 font-medium break-all">{value ?? '—'}</dd>
    </div>
  )
}

export function PANValidation() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [phase, setPhase] = useState<LoadingPhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<PANValidationResponse | null>(null)
  const [rawOpen, setRawOpen] = useState(false)

  // Manual fallback
  const [manualOpen, setManualOpen] = useState(false)
  const [manualPan, setManualPan] = useState('')
  const [manualLoading, setManualLoading] = useState(false)

  const handleFile = (f: File) => {
    if (!ALLOWED.includes(f.type)) {
      setError('Unsupported file type. Upload a PNG, JPG, WEBP, or PDF.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File exceeds 10 MB limit.')
      return
    }
    setError(null)
    setResult(null)
    setSelectedFile(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const runValidation = async () => {
    if (!selectedFile) return
    setError(null)
    setResult(null)
    setPhase('extracting')

    try {
      // Artificial split so UX shows two phases
      const timer = setTimeout(() => setPhase('validating'), 2500)
      const data = await panValidationApi.validateDocument(selectedFile)
      clearTimeout(timer)
      setPhase('done')
      setResult(data)
    } catch (err: unknown) {
      setPhase('done')
      const msg =
        (err as { response?: { data?: { detail?: string } }; message?: string })?.response?.data
          ?.detail ??
        (err as { message?: string })?.message ??
        'Unexpected error.'
      setError(msg)
    }
  }

  const runManual = async () => {
    if (!manualPan.trim()) return
    setManualLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await panValidationApi.validateManual(manualPan.trim())
      setResult(data)
      setPhase('done')
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Unexpected error.'
      setError(msg)
    } finally {
      setManualLoading(false)
    }
  }

  const isLoading = phase === 'extracting' || phase === 'validating'

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              PAN Card Validation
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Upload a PAN card image or PDF. Grok vision OCR extracts details and runs validation
              rules automatically.
            </p>
          </div>
        </div>

        {/* Upload card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-gray-500" />
            Upload PAN Document
          </h2>

          {/* Drop zone */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors',
              dragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50',
              selectedFile && 'border-green-400 bg-green-50',
            )}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.webp,.pdf"
              className="hidden"
              onChange={handleInputChange}
            />
            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-10 h-10 text-green-500" />
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(0)} KB · Click to change
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-10 h-10 text-gray-300" />
                <p className="text-sm font-medium text-gray-700">
                  Drop your PAN card image here or{' '}
                  <span className="text-blue-600 underline">browse</span>
                </p>
                <p className="text-xs text-gray-400">PNG · JPG · WEBP · PDF — max 10 MB</p>
              </div>
            )}
          </div>

          <button
            onClick={runValidation}
            disabled={!selectedFile || isLoading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {phase === 'extracting' ? 'Extracting PAN details…' : 'Validating against database…'}
              </>
            ) : (
              'Run Validation'
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Validation Error</p>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-5">
            {/* Overall status bar */}
            <div
              className={cn(
                'rounded-xl border p-5 flex items-center justify-between',
                result.status === 'PASS'
                  ? 'bg-green-50 border-green-200'
                  : result.status === 'FAIL'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-amber-50 border-amber-200',
              )}
            >
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  Overall Result
                </p>
                <StatusBadge status={result.status} />
                {result.database.note && (
                  <p className="text-xs text-gray-600 mt-2 max-w-lg">{result.database.note}</p>
                )}
              </div>
              {result.database.trace_id && (
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">DB Trace ID</p>
                  <p className="text-xs font-mono text-gray-600 mt-0.5 break-all">
                    {result.database.trace_id}
                  </p>
                </div>
              )}
            </div>

            {/* Extracted details + DB info grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Extracted OCR fields */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">Extracted by OCR</h3>
                </div>
                <dl className="p-5 grid grid-cols-1 gap-4">
                  <DetailField label="PAN Number" value={result.extracted.pan_number} />
                  <DetailField label="Name" value={result.extracted.name} />
                  <DetailField label="Father's Name" value={result.extracted.father_name} />
                  <DetailField label="Date of Birth" value={result.extracted.date_of_birth} />
                  {result.extracted.confidence !== null && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        OCR Confidence
                      </dt>
                      <dd className="mt-0.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.round((result.extracted.confidence ?? 0) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {Math.round((result.extracted.confidence ?? 0) * 100)}%
                          </span>
                        </div>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Database info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-500" />
                  <h3 className="font-semibold text-gray-900 text-sm">Database</h3>
                </div>
                <dl className="p-5 grid grid-cols-1 gap-4">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Master Match
                    </dt>
                    <dd className="mt-0.5">
                      {result.database.matched ? (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                          <CheckCircle className="w-4 h-4" /> Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-gray-500">
                          <AlertTriangle className="w-4 h-4 text-amber-400" /> No master record
                        </span>
                      )}
                    </dd>
                  </div>
                  <DetailField label="Database PAN" value={result.database.pan_number} />
                  <DetailField label="Entity Name" value={result.database.entity_name} />
                  <DetailField label="Entity ID" value={result.database.entity_id} />
                  <DetailField label="Audit Trace ID" value={result.database.trace_id} />
                </dl>
              </div>
            </div>

            {/* Rule results table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 text-sm">Rule Execution Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left">
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-8" />
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Rule
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Extracted Value
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        DB Value
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Message
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.rules.map((r: PANRuleResult, i: number) => (
                      <tr key={i} className={cn('hover:bg-gray-50 transition-colors', RuleRowBg(r.status) + '/30')}>
                        <td className="px-4 py-3">
                          <RuleStatusIcon status={r.status} />
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                          {r.rule}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-700 text-xs">
                          {r.inputValue ?? '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-700 text-xs">
                          {r.databaseValue ?? '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              r.status === 'PASS'
                                ? 'bg-green-100 text-green-700'
                                : r.status === 'FAIL'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-amber-100 text-amber-700',
                            )}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{r.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Raw OCR text — collapsible */}
            {result.extracted.raw_text && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <button
                  className="w-full px-5 py-4 flex items-center justify-between text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setRawOpen(!rawOpen)}
                >
                  <span>Raw OCR Text</span>
                  {rawOpen ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                {rawOpen && (
                  <div className="px-5 pb-5">
                    <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-4 overflow-x-auto whitespace-pre-wrap break-all max-h-64">
                      {result.extracted.raw_text}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Manual fallback */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <button
            className="w-full px-5 py-4 flex items-center justify-between text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
            onClick={() => setManualOpen(!manualOpen)}
          >
            <span>Manual test fallback (no OCR)</span>
            {manualOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>
          {manualOpen && (
            <div className="px-5 pb-5 space-y-3 border-t border-gray-100">
              <p className="text-xs text-gray-400 pt-3">
                Enter a PAN number directly to test format validation and DB trace without uploading a
                document.
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={manualPan}
                  onChange={(e) => setManualPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="flex-1 h-10 border border-gray-300 rounded-lg px-3 text-sm font-mono focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
                <button
                  onClick={runManual}
                  disabled={manualLoading || !manualPan.trim()}
                  className="h-10 px-5 bg-gray-700 hover:bg-gray-800 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {manualLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Validate'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
