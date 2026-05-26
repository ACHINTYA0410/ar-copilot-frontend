import React, { useEffect, useRef, useState } from 'react'
import {
  Plus,
  Settings,
  Play,
  Copy,
  BookOpen,
  BarChart3,
  Layers,
  FileText,
  X,
  AlertTriangle,
  Download,
  Tag,
  Clock,
  Puzzle,
  TrendingUp,
  Activity,
  Loader2,
  Users,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { useRules, useRule } from '../hooks/useRules'
import { useChecklists } from '../hooks/useChecklists'
import { rulesApi } from '../lib/api/rules'
import { cn } from '../lib/utils'
import type { ApiRuleResponse, ApiChecklistResponse } from '../types/api'

type SectionName = 'Checklists' | 'Assets' | 'Library' | 'Templates' | 'Analytics'

type ChecklistType = 'Deal Onboarding' | 'Deal Presignup' | 'PO Validation' | 'Contract Review' | 'Custom'
type TeamName = 'All Teams' | 'Finance' | 'Sales' | 'Operations' | 'Legal'

interface LocalChecklist extends ApiChecklistResponse {
  checklist_type: ChecklistType
  team: TeamName
}

const CHECKLIST_TYPE_COLORS: Record<ChecklistType, string> = {
  'Deal Onboarding': 'bg-blue-100 text-blue-700',
  'Deal Presignup': 'bg-purple-100 text-purple-700',
  'PO Validation': 'bg-amber-100 text-amber-700',
  'Contract Review': 'bg-emerald-100 text-emerald-700',
  'Custom': 'bg-gray-100 text-gray-600',
}

const TEAM_COLORS: Record<TeamName, string> = {
  'All Teams': 'bg-gray-100 text-gray-600',
  'Finance': 'bg-sky-100 text-sky-700',
  'Sales': 'bg-orange-100 text-orange-700',
  'Operations': 'bg-teal-100 text-teal-700',
  'Legal': 'bg-rose-100 text-rose-700',
}

const CHECKLIST_TYPE_OPTIONS: ChecklistType[] = [
  'Deal Onboarding',
  'Deal Presignup',
  'PO Validation',
  'Contract Review',
  'Custom',
]

const TEAM_OPTIONS: TeamName[] = ['All Teams', 'Finance', 'Sales', 'Operations', 'Legal']

// Preset metadata for existing API checklists (keyed by name substring)
function enrichChecklist(cl: ApiChecklistResponse): LocalChecklist {
  const name = cl.name.toLowerCase()
  let checklist_type: ChecklistType = 'Custom'
  let team: TeamName = 'All Teams'
  if (name.includes('onboard')) { checklist_type = 'Deal Onboarding'; team = 'Sales' }
  else if (name.includes('presign') || name.includes('pre-sign')) { checklist_type = 'Deal Presignup'; team = 'Finance' }
  else if (name.includes('po') || name.includes('purchase')) { checklist_type = 'PO Validation'; team = 'Operations' }
  else if (name.includes('contract')) { checklist_type = 'Contract Review'; team = 'Legal' }
  return { ...cl, checklist_type, team }
}

// ─── New Checklist Modal ──────────────────────────────────────────────────────

function NewChecklistModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (cl: LocalChecklist) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<ChecklistType>('Deal Onboarding')
  const [team, setTeam] = useState<TeamName>('All Teams')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Checklist name is required'); return }
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))
    const now = new Date().toISOString()
    const newCl: LocalChecklist = {
      id: `cl-local-${Date.now()}`,
      name: name.trim(),
      version: 'v1.0.0',
      rule_ids: [],
      status: 'draft',
      created_at: now,
      updated_at: now,
      published_at: null,
      checklist_type: type,
      team,
    }
    onCreate(newCl)
    toast.success(`"${name.trim()}" created as a draft checklist`)
    onClose()
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">New Checklist</p>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Checklist Name <span className="text-red-500">*</span></label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Deal Onboarding Checklist"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type</label>
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ChecklistType)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                {CHECKLIST_TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> Assign to Team</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TEAM_OPTIONS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTeam(t)}
                  className={cn(
                    'text-xs font-medium px-3 py-1.5 rounded-full border transition-colors',
                    team === t
                      ? 'border-blue-400 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this checklist used for?"
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-60"
          >
            {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Create Checklist
          </button>
        </div>
      </div>
    </div>
  )
}

const SIDEBAR_ITEMS: { icon: React.ElementType; label: SectionName }[] = [
  { icon: Layers, label: 'Checklists' },
  { icon: BookOpen, label: 'Assets' },
  { icon: Puzzle, label: 'Library' },
  { icon: FileText, label: 'Templates' },
  { icon: BarChart3, label: 'Analytics' },
]

// ─── Mock data for non-wired sections ────────────────────────────────────────

const MOCK_ASSETS = [
  { id: 'A-01', name: 'ID Document Schema', type: 'Schema', size: '12 KB', updatedAt: '2 days ago', tags: ['identity', 'kyc'] },
  { id: 'A-02', name: 'Contract Template v4', type: 'Document', size: '84 KB', updatedAt: '1 week ago', tags: ['agreement', 'legal'] },
  { id: 'A-03', name: 'Risk Matrix Config', type: 'Configuration', size: '4 KB', updatedAt: '3 days ago', tags: ['risk', 'scoring'] },
  { id: 'A-04', name: 'HubSpot Field Map', type: 'Schema', size: '8 KB', updatedAt: '5 days ago', tags: ['hubspot', 'crm'] },
  { id: 'A-05', name: 'Signature Zone Spec', type: 'Configuration', size: '6 KB', updatedAt: '2 weeks ago', tags: ['signature', 'pdf'] },
]

const ASSET_TYPE_COLORS: Record<string, string> = {
  Schema: 'bg-blue-100 text-blue-700',
  Document: 'bg-purple-100 text-purple-700',
  Configuration: 'bg-orange-100 text-orange-700',
}

const MOCK_LIBRARY = [
  { id: 'LB-01', name: 'Signature Detector', category: 'Document Content', usedIn: 14, description: 'Detects and validates wet/digital signatures across common PDF zones.' },
  { id: 'LB-02', name: 'Date Range Validator', category: 'Logic Node', usedIn: 9, description: 'Checks that document dates fall within configurable acceptable windows.' },
  { id: 'LB-03', name: 'Name Fuzzy Matcher', category: 'Logic Node', usedIn: 21, description: 'Fuzzy-matches person names across documents, tolerating common abbreviations.' },
  { id: 'LB-04', name: 'HubSpot Field Sync', category: 'Integration', usedIn: 18, description: 'Reads and validates CRM field values against document-extracted data.' },
]

const LIBRARY_CAT_COLORS: Record<string, string> = {
  'Document Content': 'bg-blue-100 text-blue-700',
  'Logic Node': 'bg-purple-100 text-purple-700',
  'Integration': 'bg-orange-100 text-orange-700',
}

const MOCK_TEMPLATES = [
  { id: 'T-01', name: 'New Customer Onboarding — Standard', rulesCount: 18, category: 'Onboarding', usedCount: 34, description: 'Full KYC + agreement validation flow for new SMB customers.' },
  { id: 'T-02', name: 'High-Risk Account Review', rulesCount: 27, category: 'Compliance', usedCount: 12, description: 'Extended verification with risk scoring and manual escalation triggers.' },
  { id: 'T-03', name: 'SaaS Renewal Validation', rulesCount: 10, category: 'Renewal', usedCount: 41, description: 'Lightweight checklist verifying renewal terms, signatory, and billing fields.' },
]

const TEMPLATE_CAT_COLORS: Record<string, string> = {
  Onboarding: 'bg-emerald-100 text-emerald-700',
  Compliance: 'bg-red-100 text-red-700',
  Renewal: 'bg-sky-100 text-sky-700',
  Legal: 'bg-amber-100 text-amber-700',
  Enterprise: 'bg-purple-100 text-purple-700',
}

const ANALYTICS_STATS = [
  { label: 'Rules Fired (30d)', value: '48,203', change: '+12%', up: true },
  { label: 'Avg Rule Duration', value: '1.04s', change: '-8%', up: true },
  { label: 'Auto-Rejection Rate', value: '6.2%', change: '+0.4%', up: false },
  { label: 'First-Pass Rate', value: '81%', change: '+3%', up: true },
]

// ─── Rule block on canvas ─────────────────────────────────────────────────────

function RuleBlock({
  rule,
  selected,
  onClick,
}: Readonly<{
  rule: ApiRuleResponse
  selected: boolean
  onClick: () => void
}>) {
  const typeColor =
    rule.section === 'Document Content'
      ? 'bg-blue-100 text-blue-700'
      : rule.section === 'HubSpot Data Match'
        ? 'bg-orange-100 text-orange-700'
        : rule.section === 'Approval & Policy'
          ? 'bg-purple-100 text-purple-700'
          : 'bg-gray-100 text-gray-600'

  return (
    <div
      onClick={onClick}
      className={cn(
        'border rounded-xl p-4 cursor-pointer transition-all',
        selected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
        !rule.is_active && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', typeColor)}>
              {rule.section}
            </span>
            {!rule.is_active && (
              <span className="text-xs text-orange-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Inactive
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900">{rule.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>Threshold: {Math.round(rule.confidence_threshold * 100)}%</span>
        <span>·</span>
        <span>On fail: {rule.action_on_fail}</span>
      </div>

      {rule.fired_count > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-400">
          <BarChart3 className="w-3 h-3" />
          Fired {rule.fired_count.toLocaleString()} times (Avg {rule.avg_runtime_ms}ms)
        </div>
      )}
    </div>
  )
}

// ─── Threshold slider with PATCH on release ───────────────────────────────────

function ThresholdSlider({
  ruleId,
  initialValue,
  onSaved,
}: Readonly<{
  ruleId: string
  initialValue: number
  onSaved: () => void
}>) {
  const [value, setValue] = useState(Math.round(initialValue * 100))
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = Number(e.target.value)
    setValue(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        await rulesApi.update(ruleId, { confidence_threshold: next / 100 })
        onSaved()
        toast.success('Threshold saved')
      } catch {
        // global interceptor handles toast
      }
    }, 500)
  }

  const pct = ((value - 50) / 50) * 100

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Confidence Threshold</span>
        <span className="text-xs font-semibold text-gray-700">{value}%</span>
      </div>
      <div className="relative h-1.5 bg-gray-100 rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-blue-500 rounded-full"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-blue-500 rounded-full shadow-sm"
          style={{ left: `calc(${pct}% - 7px)` }}
        />
      </div>
      <input
        type="range"
        min={50}
        max={100}
        value={value}
        onChange={handleChange}
        className="absolute opacity-0 w-full h-4 cursor-pointer"
        style={{ marginTop: '-10px' }}
        aria-label="Confidence threshold"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>Strict</span>
        <span>{value >= 80 ? 'Strict' : value >= 65 ? 'Balanced' : 'Loose'}</span>
        <span>Loose</span>
      </div>
    </div>
  )
}

// ─── Block Settings panel ─────────────────────────────────────────────────────

function BlockSettings({ ruleId }: Readonly<{ ruleId: string }>) {
  const queryClient = useQueryClient()
  const { data: rule, isLoading } = useRule(ruleId)
  const [testResult, setTestResult] = useState<{ status: string; confidence: number; evidence: string } | null>(null)
  const [testing, setTesting] = useState(false)
  const [nameValue, setNameValue] = useState('')
  const nameDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (rule) setNameValue(rule.name)
  }, [rule])

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNameValue(val)
    if (nameDebounce.current) clearTimeout(nameDebounce.current)
    nameDebounce.current = setTimeout(async () => {
      if (!val.trim()) return
      try {
        await rulesApi.update(ruleId, { name: val })
        await queryClient.invalidateQueries({ queryKey: ['rules'] })
        toast.success('Name saved')
      } catch {
        // global interceptor handles toast
      }
    }, 600)
  }

  const handleTestRule = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await rulesApi.test(ruleId, 'DL-12345')
      setTestResult({ status: res.status, confidence: Math.round(res.confidence * 100), evidence: res.evidence })
      toast.success(`Rule test complete — ${res.status} at ${Math.round(res.confidence * 100)}% confidence`)
    } catch {
      // global interceptor handles toast
    } finally {
      setTesting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-5 space-y-5 animate-pulse">
        <div>
          <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
          <div className="h-9 bg-gray-100 rounded-lg w-full" />
        </div>
        <div>
          <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-24 bg-gray-100 rounded-lg w-full" />
        </div>
        <div>
          <div className="h-3 bg-gray-200 rounded w-32 mb-2" />
          <div className="flex gap-2">
            <div className="h-6 bg-gray-100 rounded-full w-16" />
            <div className="h-6 bg-gray-100 rounded-full w-20" />
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <div className="h-3 bg-gray-200 rounded w-24" />
            <div className="h-3 bg-gray-200 rounded w-8" />
          </div>
          <div className="h-2 bg-gray-100 rounded-full w-full mb-1" />
          <div className="flex justify-between">
            <div className="h-2 bg-gray-50 rounded w-8" />
            <div className="h-2 bg-gray-50 rounded w-8" />
          </div>
        </div>
      </div>
    )
  }

  if (!rule) return null

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rule Name</label>
        <input
          value={nameValue}
          onChange={handleNameChange}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Validation Prompt
        </label>
        <textarea
          defaultValue={rule.prompt}
          rows={5}
          readOnly
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none resize-none leading-relaxed text-gray-700 bg-gray-50"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Required Context (Inputs)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {rule.required_context.length > 0 ? (
            rule.required_context.map((ctx) => (
              <span
                key={ctx}
                className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full"
              >
                {ctx}
              </span>
            ))
          ) : (
            <span className="text-xs text-gray-400">No inputs configured</span>
          )}
        </div>
      </div>

      <ThresholdSlider
        ruleId={rule.id}
        initialValue={rule.confidence_threshold}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ['rules'] })}
      />

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Action on Fail
        </label>
        <div className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-700 capitalize">
          {rule.action_on_fail}
        </div>
      </div>

      <button
        onClick={handleTestRule}
        disabled={testing}
        className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 py-2.5 rounded-lg transition-colors disabled:opacity-50"
      >
        {testing ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
        ) : (
          <Play className="w-4 h-4 text-blue-600" />
        )}
        {testing ? 'Testing...' : 'Test This Rule'}
      </button>

      {testResult && (
        <div
          className={cn(
            'rounded-lg px-4 py-3 border',
            testResult.status === 'pass'
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-red-50 border-red-200',
          )}
        >
          <p
            className={cn(
              'text-xs font-bold mb-1',
              testResult.status === 'pass' ? 'text-emerald-800' : 'text-red-800',
            )}
          >
            {testResult.status === 'pass' ? 'Test Passed' : 'Test Failed'} —{' '}
            {testResult.confidence}% confidence
          </p>
          <p className="text-xs text-gray-600">{testResult.evidence}</p>
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RuleStudio() {
  const [activeSection, setActiveSection] = useState<SectionName>('Checklists')
  const [selectedChecklist, setSelectedChecklist] = useState<LocalChecklist | null>(null)
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null)
  const [teamFilter, setTeamFilter] = useState<TeamName | 'all'>('all')
  const [showNewModal, setShowNewModal] = useState(false)
  const [localChecklists, setLocalChecklists] = useState<LocalChecklist[]>([])

  const { data: checklistsData, isLoading: checklistsLoading } = useChecklists()
  const { data: rulesBySectionData, isLoading: rulesLoading } = useRules()

  const apiChecklists: LocalChecklist[] = (checklistsData?.items ?? []).map(enrichChecklist)
  const allChecklists: LocalChecklist[] = [...apiChecklists, ...localChecklists]
  const filteredChecklists =
    teamFilter === 'all' ? allChecklists : allChecklists.filter((cl) => cl.team === teamFilter)

  const activeChecklist: LocalChecklist | null = selectedChecklist ?? filteredChecklists[0] ?? null

  const allRules = (rulesBySectionData ?? []).flatMap((s) => s.rules)
  const checklistRuleIds = new Set(activeChecklist?.rule_ids ?? [])
  const visibleRules =
    checklistRuleIds.size > 0 ? allRules.filter((r) => checklistRuleIds.has(r.id)) : allRules

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-50">
      {showNewModal && (
        <NewChecklistModal
          onClose={() => setShowNewModal(false)}
          onCreate={(cl) => {
            setLocalChecklists((prev) => [cl, ...prev])
            setSelectedChecklist(cl)
            setSelectedRuleId(null)
          }}
        />
      )}

      {/* Inner sidebar: Rule Studio nav */}
      <div className="w-48 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Rule Studio</p>
          <p className="text-xs text-gray-400 mt-0.5">v2.4.1-stable</p>
        </div>

        <div className="px-3 py-3">
          <button
            onClick={() => toast.info('New rule creation coming soon')}
            className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors mb-3"
          >
            <Plus className="w-3.5 h-3.5" />
            New Rule
          </button>
        </div>

        <nav className="flex-1 px-2">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveSection(item.label)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors mb-0.5 text-left',
                activeSection === item.label
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100',
              )}
            >
              <item.icon
                className={cn(
                  'w-3.5 h-3.5',
                  activeSection === item.label ? 'text-blue-600' : 'text-gray-400',
                )}
              />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {activeSection === 'Checklists' && (
        <>
          {/* Checklist list */}
          <div className="w-64 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-900">Rule Sets</p>
                <button
                  onClick={() => setShowNewModal(true)}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="New checklist"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {/* Team filter */}
              <div className="flex flex-wrap gap-1">
                {(['all', ...TEAM_OPTIONS.filter(t => t !== 'All Teams')] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setTeamFilter(t as TeamName | 'all'); setSelectedChecklist(null) }}
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full border transition-colors',
                      teamFilter === t
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300',
                    )}
                  >
                    {t === 'all' ? 'All' : t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {checklistsLoading ? (
                <div className="space-y-1.5 p-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-full px-3 py-3 rounded-xl border border-gray-100 bg-white animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-3 bg-gray-100 rounded w-12" />
                        <div className="h-4 bg-gray-100 rounded-full w-16" />
                      </div>
                      <div className="h-3 bg-gray-50 rounded w-10" />
                    </div>
                  ))}
                </div>
              ) : filteredChecklists.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-gray-400 mb-2">No checklists found.</p>
                  <button
                    onClick={() => setShowNewModal(true)}
                    className="text-xs font-medium text-blue-600 hover:underline"
                  >
                    Create one
                  </button>
                </div>
              ) : (
                filteredChecklists.map((cl) => (
                  <button
                    key={cl.id}
                    onClick={() => { setSelectedChecklist(cl); setSelectedRuleId(null) }}
                    className={cn(
                      'w-full text-left px-3 py-3 rounded-xl border transition-all',
                      activeChecklist?.id === cl.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50',
                    )}
                  >
                    <p className="text-xs font-semibold text-gray-900 leading-tight mb-1.5">{cl.name}</p>
                    <div className="flex flex-wrap items-center gap-1 mb-1">
                      <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded-full', CHECKLIST_TYPE_COLORS[cl.checklist_type])}>
                        {cl.checklist_type}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-medium px-1.5 py-0.5 rounded-full',
                          cl.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700',
                        )}
                      >
                        {cl.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Users className="w-3 h-3" />
                      <span>{cl.team}</span>
                      <span>·</span>
                      <span>{cl.rule_ids.length} rules</span>
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
              <button
                onClick={() => setShowNewModal(true)}
                className="w-full flex items-center justify-center gap-1.5 border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 text-xs font-medium py-2 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Rule Set
              </button>
            </div>
          </div>

          {/* Rule canvas */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 flex-shrink-0">
              <span className="text-sm font-semibold text-gray-900">
                {activeChecklist?.name ?? 'Select a rule set'}
              </span>
              {activeChecklist && (
                <>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', CHECKLIST_TYPE_COLORS[activeChecklist.checklist_type])}>
                    {activeChecklist.checklist_type}
                  </span>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', TEAM_COLORS[activeChecklist.team])}>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{activeChecklist.team}</span>
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      activeChecklist.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700',
                    )}
                  >
                    {activeChecklist.status}
                  </span>
                </>
              )}
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => toast.info('Draft saved')}
                  className="text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => toast.success('Checklist published — now active in engine')}
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Publish
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {rulesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 bg-white animate-pulse">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="h-4 bg-gray-200 rounded-full w-24" />
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="h-3 bg-gray-100 rounded w-20" />
                        <div className="h-3 bg-gray-100 rounded w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : visibleRules.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-sm">No rules found for this checklist.</p>
                </div>
              ) : (
                visibleRules.map((rule) => (
                  <RuleBlock
                    key={rule.id}
                    rule={rule}
                    selected={selectedRuleId === rule.id}
                    onClick={() =>
                      setSelectedRuleId(selectedRuleId === rule.id ? null : rule.id)
                    }
                  />
                ))
              )}

              <button
                onClick={() => toast.info('New rule creation coming soon')}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm font-medium text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Rule Block
              </button>
            </div>
          </div>

          {/* Block Settings */}
          <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
              <Settings className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-900">Block Settings</p>
              {selectedRuleId && (
                <button
                  onClick={() => setSelectedRuleId(null)}
                  className="ml-auto p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {selectedRuleId ? (
              <BlockSettings ruleId={selectedRuleId} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-6">
                <div>
                  <Settings className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">Select a rule block to edit its settings</p>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeSection === 'Assets' && (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-shrink-0">
            <p className="text-sm font-semibold text-gray-900">Assets</p>
            <span className="text-xs text-gray-400">{MOCK_ASSETS.length} items</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-3 max-w-3xl">
              {MOCK_ASSETS.map((asset) => (
                <div
                  key={asset.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all"
                >
                  <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">{asset.name}</p>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', ASSET_TYPE_COLORS[asset.type])}>
                        {asset.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />Updated {asset.updatedAt}
                      </span>
                      <span>{asset.size}</span>
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {asset.tags.join(', ')}
                      </span>
                    </div>
                  </div>
                  <button className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'Library' && (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-shrink-0">
            <p className="text-sm font-semibold text-gray-900">Rule Library</p>
            <span className="text-xs text-gray-400">{MOCK_LIBRARY.length} components</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-3 max-w-3xl">
              {MOCK_LIBRARY.map((item) => (
                <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', LIBRARY_CAT_COLORS[item.category])}>
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
                    </div>
                    <button
                      onClick={() => toast.success(`"${item.name}" added to checklist`)}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <Activity className="w-3 h-3" />
                    Used in {item.usedIn} checklists
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'Templates' && (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 flex-shrink-0">
            <p className="text-sm font-semibold text-gray-900">Templates</p>
            <span className="text-xs text-gray-400">{MOCK_TEMPLATES.length} templates</span>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-3 max-w-3xl">
              {MOCK_TEMPLATES.map((tmpl) => (
                <div key={tmpl.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <p className="text-sm font-semibold text-gray-900">{tmpl.name}</p>
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', TEMPLATE_CAT_COLORS[tmpl.category] ?? 'bg-gray-100 text-gray-600')}>
                          {tmpl.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed mb-2">{tmpl.description}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>{tmpl.rulesCount} rules</span>
                        <span>·</span>
                        <span>Used {tmpl.usedCount} times</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toast.success(`"${tmpl.name}" cloned as new draft checklist`)}
                      className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      Clone
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'Analytics' && (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
            <p className="text-sm font-semibold text-gray-900">Analytics</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-4 gap-4">
              {ANALYTICS_STATS.map((stat) => (
                <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={cn('text-xs font-medium mt-1 flex items-center gap-1', stat.up ? 'text-emerald-600' : 'text-red-500')}>
                    <TrendingUp className="w-3 h-3" />
                    {stat.change} vs last month
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
