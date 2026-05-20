// ─── Deal Types ───────────────────────────────────────────────────────────────

export type DealStatus =
  | 'needs_review'
  | 'auto_approved'
  | 'auto_rejected'
  | 'approved'
  | 'rejected'
  | 'stuck'

export interface Submitter {
  name: string
  zone: string
  avatarColor: string
}

export interface ValidationScore {
  passed: number
  total: number
}

export interface Deal {
  id: string
  customer: string
  amount: number
  status: DealStatus
  submittedBy: Submitter
  submittedAt: string
  validationScore: ValidationScore
  criticalIssues: number
  topIssues: string[]
  region: string
  products: string[]
  firstPassRate: number
}

// ─── Rule Types ───────────────────────────────────────────────────────────────

export type RuleStatus = 'pass' | 'warning' | 'fail'
export type RuleSection =
  | 'Document Content'
  | 'HubSpot Data Match'
  | 'Approval & Policy'
  | 'HubSpot Field Completeness'

export interface ValidationRule {
  id: string
  name: string
  section: RuleSection
  status: RuleStatus
  confidence: number
  description: string
  evidence: string
  actions: ('approve_anyway' | 'reject_reason')[]
}

// ─── Checklist Types ──────────────────────────────────────────────────────────

export type ChecklistStatus = 'Active' | 'Draft'

export interface Checklist {
  id: string
  name: string
  rulesCount: number
  status: ChecklistStatus
  version: string
}

// ─── Rule Studio Rule Types ───────────────────────────────────────────────────

export type RuleNodeType = 'Document Content' | 'Logic Node' | 'Integration'
export type ActionOnFail = 'Flag for Manual Review' | 'Auto-Reject' | 'Auto-Reject Workflow'

export interface StudioRule {
  id: string
  name: string
  type: RuleNodeType
  description: string
  threshold: number
  actionOnFail: ActionOnFail
  context: string[]
  firedCount: number
  avgTime: number
  isComplete: boolean
  validationPrompt: string
}

// ─── Audit Log Types ──────────────────────────────────────────────────────────

export type ActorType = 'user' | 'ai_agent' | 'system'
export type AuditActionType =
  | 'deal_approved'
  | 'deal_rejected'
  | 'deal_auto_rejected'
  | 'deal_auto_approved'
  | 'rule_modified'
  | 'pattern_detected'
  | 'deal_submitted'
  | 'deal_flagged'
  | 'override_applied'

export interface AuditActor {
  name: string
  type: ActorType
  avatarColor?: string
}

export interface RuleDiff {
  field: string
  before: string
  after: string
}

export interface AuditEntry {
  id: string
  timestamp: string
  actor: AuditActor
  action: AuditActionType
  summary: string
  detail?: string
  dealId?: string
  ruleName?: string
  diff?: RuleDiff[]
}
