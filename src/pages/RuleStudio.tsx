import React, { useState } from 'react'
import {
  Plus,
  Settings,
  ChevronRight,
  Play,
  Copy,
  Trash2,
  BookOpen,
  BarChart3,
  Layers,
  FileText,
  X,
  AlertTriangle,
  CheckCircle2,
  Download,
  Tag,
  Clock,
  Puzzle,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { mockChecklists, mockStudioRules } from '../data/mockChecklists'
import { useDeals } from '../context/DealsContext'
import { cn } from '../lib/utils'
import type { StudioRule } from '../types'

type SectionName = 'Checklists' | 'Assets' | 'Library' | 'Templates' | 'Analytics'

const SIDEBAR_ITEMS: { icon: React.ElementType; label: SectionName }[] = [
  { icon: Layers, label: 'Checklists' },
  { icon: BookOpen, label: 'Assets' },
  { icon: Puzzle, label: 'Library' },
  { icon: FileText, label: 'Templates' },
  { icon: BarChart3, label: 'Analytics' },
]

// ─── Mock data for non-Checklist sections ────────────────────────────────────

const MOCK_ASSETS = [
  { id: 'A-01', name: 'ID Document Schema', type: 'Schema', size: '12 KB', updatedAt: '2 days ago', tags: ['identity', 'kyc'] },
  { id: 'A-02', name: 'Contract Template v4', type: 'Document', size: '84 KB', updatedAt: '1 week ago', tags: ['agreement', 'legal'] },
  { id: 'A-03', name: 'Risk Matrix Config', type: 'Configuration', size: '4 KB', updatedAt: '3 days ago', tags: ['risk', 'scoring'] },
  { id: 'A-04', name: 'HubSpot Field Map', type: 'Schema', size: '8 KB', updatedAt: '5 days ago', tags: ['hubspot', 'crm'] },
  { id: 'A-05', name: 'Signature Zone Spec', type: 'Configuration', size: '6 KB', updatedAt: '2 weeks ago', tags: ['signature', 'pdf'] },
  { id: 'A-06', name: 'KYC Verification Flow', type: 'Document', size: '22 KB', updatedAt: '1 day ago', tags: ['kyc', 'compliance'] },
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
  { id: 'LB-05', name: 'PAN / TAN Extractor', category: 'Document Content', usedIn: 7, description: 'Extracts and validates Indian tax identification numbers from uploaded documents.' },
  { id: 'LB-06', name: 'Amount Reconciler', category: 'Logic Node', usedIn: 11, description: 'Cross-checks invoice amounts, discounts, and totals for arithmetic consistency.' },
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
  { id: 'T-04', name: 'Partner Agreement Check', rulesCount: 14, category: 'Legal', usedCount: 8, description: 'Validates partner-specific legal clauses and approval thresholds.' },
  { id: 'T-05', name: 'Enterprise Deal — Full Suite', rulesCount: 32, category: 'Enterprise', usedCount: 5, description: 'Comprehensive validation including multi-signatory, legal review, and finance sign-off.' },
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

const ANALYTICS_RULES_PERF = [
  { name: 'Verify Identity Document', fired: 3421, avgTime: 1.2, passRate: 94 },
  { name: 'Check Agreement Signatures', fired: 1247, avgTime: 0.8, passRate: 88 },
  { name: 'HubSpot Field Sync', fired: 4102, avgTime: 0.4, passRate: 97 },
  { name: 'Amount Reconciler', fired: 892, avgTime: 0.6, passRate: 91 },
  { name: 'Name Fuzzy Matcher', fired: 2345, avgTime: 1.5, passRate: 85 },
]

const TYPE_COLORS: Record<string, string> = {
  'Document Content': 'bg-blue-100 text-blue-700',
  'Logic Node': 'bg-purple-100 text-purple-700',
  'Integration': 'bg-orange-100 text-orange-700',
}

function RuleBlock({
  rule,
  selected,
  onClick,
  onDelete,
  onDuplicate,
}: {
  rule: StudioRule
  selected: boolean
  onClick: () => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'border rounded-xl p-4 cursor-pointer transition-all',
        selected
          ? 'border-blue-500 bg-blue-50 shadow-sm'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
        !rule.isComplete && 'opacity-75',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', TYPE_COLORS[rule.type] ?? 'bg-gray-100 text-gray-600')}>
              {rule.type}
            </span>
            {!rule.isComplete && (
              <span className="text-xs text-orange-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Config incomplete
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-gray-900">{rule.name}</p>
        </div>
        {selected && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={(e) => { e.stopPropagation(); onDuplicate() }} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded transition-colors" title="Duplicate">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white rounded transition-colors" title="Delete">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {rule.isComplete && (
        <p className="text-xs text-gray-500 mb-3 leading-relaxed line-clamp-2">{rule.description}</p>
      )}

      {rule.isComplete && (
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>Threshold: {rule.threshold}%</span>
          <span>·</span>
          <span>On fail: {rule.actionOnFail}</span>
        </div>
      )}

      {rule.isComplete && rule.firedCount > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-1 text-xs text-gray-400">
          <BarChart3 className="w-3 h-3" />
          Fired {rule.firedCount.toLocaleString()} times this month (Avg {rule.avgTime}s)
        </div>
      )}
    </div>
  )
}

function ThresholdSlider({ value, label }: { value: number; label: string }) {
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
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>Strict</span>
        <span>{label}</span>
        <span>Loose</span>
      </div>
    </div>
  )
}

export function RuleStudio() {
  const [activeSection, setActiveSection] = useState<SectionName>('Checklists')
  const [selectedChecklist, setSelectedChecklist] = useState('CL-01')
  const [selectedRule, setSelectedRule] = useState<StudioRule | null>(mockStudioRules[1])
  const [rules, setRules] = useState(mockStudioRules)
  const [testResult, setTestResult] = useState<null | 'pass' | 'fail'>(null)
  const [published, setPublished] = useState(false)
  const { showToast } = useDeals()

  const handleSaveDraft = () => {
    showToast('Draft saved — changes not yet published', 'info')
  }

  const handlePublish = () => {
    setPublished(true)
    showToast('Checklist published successfully — now active in engine v3.3', 'success')
  }

  const handleTestRule = () => {
    setTestResult(null)
    setTimeout(() => {
      setTestResult('pass')
      showToast('Rule test completed — 3 of 3 sample deals passed', 'success')
    }, 1200)
  }

  const handleDeleteRule = (ruleId: string) => {
    setRules((prev) => prev.filter((r) => r.id !== ruleId))
    if (selectedRule?.id === ruleId) setSelectedRule(null)
    showToast('Rule removed from checklist', 'info')
  }

  const handleDuplicateRule = (rule: StudioRule) => {
    const copy: StudioRule = { ...rule, id: `${rule.id}-copy`, name: `${rule.name} (Copy)` }
    setRules((prev) => [...prev, copy])
    setSelectedRule(copy)
    showToast('Rule duplicated', 'info')
  }

  const handleAddRule = () => {
    const newRule: StudioRule = {
      id: `SR-0${rules.length + 1}`,
      name: 'New Rule Block',
      type: 'Logic Node',
      description: 'Define what this rule should validate.',
      threshold: 75,
      actionOnFail: 'Flag for Manual Review',
      context: [],
      firedCount: 0,
      avgTime: 0,
      isComplete: false,
      validationPrompt: '',
    }
    setRules((prev) => [...prev, newRule])
    setSelectedRule(newRule)
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-gray-50">
      {/* Inner sidebar: Rule Studio nav */}
      <div className="w-48 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-900">Rule Studio</p>
          <p className="text-xs text-gray-400 mt-0.5">v2.4.1-stable</p>
        </div>

        <div className="px-3 py-3">
          <button onClick={handleAddRule} className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors mb-3">
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
              <item.icon className={cn('w-3.5 h-3.5', activeSection === item.label ? 'text-blue-600' : 'text-gray-400')} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {activeSection === 'Checklists' && (
        <>
          {/* Center left: Checklist list */}
          <div className="w-56 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <p className="text-sm font-semibold text-gray-900">Checklists</p>
              <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {mockChecklists.map((cl) => (
                <button
                  key={cl.id}
                  onClick={() => setSelectedChecklist(cl.id)}
                  className={cn(
                    'w-full text-left px-3 py-3 rounded-xl border transition-all',
                    selectedChecklist === cl.id
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50',
                  )}
                >
                  <p className="text-xs font-semibold text-gray-900 leading-tight">{cl.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-gray-400">{cl.rulesCount} rules</span>
                    <span
                      className={cn(
                        'text-xs font-medium px-1.5 py-0.5 rounded-full',
                        cl.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700',
                      )}
                    >
                      {cl.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{cl.version}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Center right: Rule Builder canvas */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Canvas toolbar */}
            <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center gap-3 flex-shrink-0">
              <input
                defaultValue="Onboarding Validation"
                className="text-sm font-semibold text-gray-900 bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
              />
              <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">Active</span>
              <button className="flex items-center gap-1 text-xs text-gray-500 border border-gray-200 px-2.5 py-1.5 rounded-lg hover:bg-gray-50">
                v3.2 (current)
                <ChevronRight className="w-3 h-3 rotate-90" />
              </button>
              <div className="ml-auto flex items-center gap-2">
                <button onClick={handleSaveDraft} className="text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-1.5 rounded-lg transition-colors">
                  Save Draft
                </button>
                <button
                  onClick={handlePublish}
                  className={cn(
                    'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors',
                    published
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'text-white bg-blue-600 hover:bg-blue-700',
                  )}
                >
                  {published && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {published ? 'Published' : 'Publish'}
                </button>
              </div>
            </div>

            {/* Rule list canvas */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {rules.map((rule) => (
                <RuleBlock
                  key={rule.id}
                  rule={rule}
                  selected={selectedRule?.id === rule.id}
                  onClick={() => setSelectedRule(selectedRule?.id === rule.id ? null : rule)}
                  onDelete={() => handleDeleteRule(rule.id)}
                  onDuplicate={() => handleDuplicateRule(rule)}
                />
              ))}

              <button onClick={handleAddRule} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 text-sm font-medium text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add Rule Block
              </button>
            </div>
          </div>

          {/* Right: Block Settings */}
          <div className="w-72 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
              <Settings className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-semibold text-gray-900">Block Settings</p>
              {selectedRule && (
                <button
                  onClick={() => setSelectedRule(null)}
                  className="ml-auto p-1 text-gray-400 hover:text-gray-600 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {selectedRule ? (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Rule Name</label>
                  <input
                    defaultValue={selectedRule.name}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Validation Prompt</label>
                  <textarea
                    defaultValue={selectedRule.validationPrompt}
                    rows={5}
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed text-gray-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Required Context (Inputs)</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedRule.context.map((ctx) => (
                      <span key={ctx} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
                        {ctx}
                        <button className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {selectedRule.context.length === 0 && (
                      <span className="text-xs text-gray-400">No inputs configured</span>
                    )}
                  </div>
                </div>

                <ThresholdSlider
                  value={selectedRule.threshold}
                  label={selectedRule.threshold >= 80 ? 'Strict' : selectedRule.threshold >= 65 ? 'Balanced' : 'Loose'}
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Action on Fail</label>
                  <div className="relative">
                    <select
                      defaultValue={selectedRule.actionOnFail}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none pr-8 text-red-600 font-medium"
                    >
                      <option className="text-gray-900 font-normal">Flag for Manual Review</option>
                      <option className="text-red-600">Auto-Reject Workflow</option>
                      <option className="text-gray-900 font-normal">Notify Finance Lead</option>
                    </select>
                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                  </div>
                </div>

                <button
                  onClick={handleTestRule}
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-700 py-2.5 rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4 text-blue-600" />
                  Test This Rule
                </button>

                {testResult && (
                  <div className={cn('rounded-lg px-4 py-3 border', testResult === 'pass' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200')}>
                    <p className={cn('text-xs font-bold mb-1', testResult === 'pass' ? 'text-emerald-800' : 'text-red-800')}>
                      {testResult === 'pass' ? 'Test Passed' : 'Test Failed'}
                    </p>
                    <p className="text-xs text-gray-600">Ran against 3 sample deals from last week. 3 of 3 passed with avg confidence 87%.</p>
                  </div>
                )}
              </div>
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
            <div className="ml-auto">
              <button className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" />
                Upload Asset
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 gap-3 max-w-3xl">
              {MOCK_ASSETS.map((asset) => (
                <div key={asset.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 hover:border-gray-300 hover:shadow-sm transition-all">
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
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Updated {asset.updatedAt}</span>
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
            <div className="ml-auto">
              <button className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors">
                <Plus className="w-3.5 h-3.5" />
                New Component
              </button>
            </div>
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
                      onClick={() => showToast(`"${item.name}" added to checklist`, 'success')}
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
                      onClick={() => showToast(`"${tmpl.name}" cloned as new draft checklist`, 'success')}
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
            {/* Stats row */}
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

            {/* Rule performance table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">Rule Performance (30 days)</p>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Rule</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Fired</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Avg Time</th>
                    <th className="text-right text-xs font-medium text-gray-400 px-5 py-3">Pass Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {ANALYTICS_RULES_PERF.map((row) => (
                    <tr key={row.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-sm text-gray-700 font-medium">{row.name}</td>
                      <td className="px-5 py-3 text-sm text-gray-500 text-right">{row.fired.toLocaleString()}</td>
                      <td className="px-5 py-3 text-sm text-gray-500 text-right">{row.avgTime}s</td>
                      <td className="px-5 py-3 text-right">
                        <span className={cn('text-xs font-semibold', row.passRate >= 90 ? 'text-emerald-600' : row.passRate >= 80 ? 'text-amber-600' : 'text-red-500')}>
                          {row.passRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
