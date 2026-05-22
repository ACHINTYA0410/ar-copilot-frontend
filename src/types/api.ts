// ─── Enums (match backend exactly) ───────────────────────────────────────────

export type DealStatus =
  | 'needs_review'
  | 'auto_approved'
  | 'auto_rejected'
  | 'approved'
  | 'rejected'
  | 'stuck'

export type ValidationRunStatus = 'pending' | 'running' | 'completed' | 'failed'

export type RuleResultStatus = 'pass' | 'warning' | 'fail' | 'pending' | 'running'

export type ActionTaken = 'none' | 'approve_anyway' | 'reject_reason' | 'pending_review'

export type ActionOnFail = 'warn' | 'reject' | 'review'

export type DocumentType = 'contract' | 'invoice' | 'id_proof' | 'gst' | 'other'

export type DocumentStatus = 'pending' | 'processing' | 'processed' | 'failed'

export type ChecklistStatus = 'draft' | 'active' | 'archived'

export type ActorType = 'user' | 'ai_agent' | 'system'

export type ActionType =
  | 'approved'
  | 'rejected'
  | 'auto_approved'
  | 'auto_rejected'
  | 'submitted'
  | 'uploaded_document'
  | 'modified_rule'
  | 'validation_started'
  | 'validation_completed'
  | 'reviewer_action'
  | 'flagged'

export type TargetType = 'deal' | 'rule' | 'document' | 'checklist' | 'validation_run'

// ─── Deal ─────────────────────────────────────────────────────────────────────

export interface ApiDealResponse {
  id: string
  customer_name: string
  amount: string
  status: DealStatus
  submitted_by_name: string
  submitted_by_zone: string
  submitted_by_avatar_color: string
  submitted_at: string
  region: string | null
  products: string[]
  first_pass_rate: number
  validation_score_passed: number
  validation_score_total: number
  critical_issues_count: number
  created_at: string
  updated_at: string
}

export interface ApiDocumentSummary {
  id: string
  original_filename: string
  document_type: string
  status: string
  file_size: number
  uploaded_at: string
}

export interface ApiValidationSummary {
  id: string
  status: ValidationRunStatus
  total_rules: number
  passed: number
  warnings: number
  failed: number
  started_at: string | null
  completed_at: string | null
}

export interface ApiDealDetailResponse extends ApiDealResponse {
  documents: ApiDocumentSummary[]
  latest_validation: ApiValidationSummary | null
}

export interface ApiDealListResponse {
  items: ApiDealResponse[]
  total: number
  page: number
  page_size: number
}

export interface ApiDealStatsResponse {
  needs_review: number
  stuck: number
  auto_approved_today: number
  auto_rejected_today: number
}

export interface ApiDealUpdate {
  status?: DealStatus
  customer_name?: string
  amount?: string
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ApiRuleResultResponse {
  id: string
  validation_run_id: string
  rule_id: string
  rule_name: string
  section: string
  status: RuleResultStatus
  confidence: number
  evidence: string | null
  ai_reasoning: string | null
  action_taken: ActionTaken
  reviewer_comment: string | null
  executed_at: string | null
}

export interface ApiValidationRunResponse {
  id: string
  deal_id: string
  checklist_id: string | null
  status: ValidationRunStatus
  total_rules: number
  passed: number
  warnings: number
  failed: number
  started_at: string | null
  completed_at: string | null
  created_at: string
  rule_results: ApiRuleResultResponse[]
}

export interface ApiValidationTriggerResponse {
  validation_run_id: string
  deal_id: string
  message: string
}

export interface ApiReviewerActionRequest {
  action: ActionTaken
  comment?: string
}

export interface ApiReviewerActionResponse {
  result_id: string
  action_taken: ActionTaken
  message: string
}

// SSE stream event — either a rule result or a completion summary
export type SseEvent =
  | (ApiRuleResultResponse & { event?: undefined })
  | { event: 'complete' | 'timeout'; run_id?: string; passed?: number; warnings?: number; failed?: number; status?: string }

// ─── Documents ────────────────────────────────────────────────────────────────

export interface ApiDocumentUploadResponse {
  id: string
  deal_id: string
  original_filename: string
  document_type: string
  file_size: number
  message: string
}

// ─── Rules ────────────────────────────────────────────────────────────────────

export interface ApiRuleResponse {
  id: string
  name: string
  section: string
  prompt: string
  required_context: string[]
  confidence_threshold: number
  action_on_fail: ActionOnFail
  error_message: string | null
  is_active: boolean
  fired_count: number
  avg_runtime_ms: number
  created_at: string
  updated_at: string
}

export interface ApiRulesBySectionResponse {
  section: string
  rules: ApiRuleResponse[]
}

export interface ApiRuleUpdate {
  name?: string
  prompt?: string
  confidence_threshold?: number
  action_on_fail?: ActionOnFail
  error_message?: string
  is_active?: boolean
}

export interface ApiRuleTestResponse {
  rule_id: string
  status: string
  confidence: number
  evidence: string
  reasoning: string
  runtime_ms: number
}

// ─── Checklists ───────────────────────────────────────────────────────────────

export interface ApiChecklistResponse {
  id: string
  name: string
  version: string
  rule_ids: string[]
  status: ChecklistStatus
  created_at: string
  updated_at: string
  published_at: string | null
}

export interface ApiChecklistListResponse {
  items: ApiChecklistResponse[]
  total: number
}

// ─── Audit ────────────────────────────────────────────────────────────────────

export interface ApiAuditLogResponse {
  id: string
  timestamp: string
  actor_type: ActorType
  actor_name: string
  action_type: ActionType
  target_type: TargetType
  target_id: string
  description: string
  before_value: Record<string, unknown> | null
  after_value: Record<string, unknown> | null
  metadata_: Record<string, unknown> | null
}

export interface ApiAuditLogListResponse {
  items: ApiAuditLogResponse[]
  total: number
  page: number
  page_size: number
}

export interface ApiWeeklyStatPoint {
  date: string
  approved: number
  rejected: number
  auto_processed: number
}

export interface ApiAuditStatsResponse {
  compliance_score: number
  total_actions_7d: number
  approvals_7d: number
  rejections_7d: number
  auto_processed_7d: number
  rule_changes_7d: number
  weekly_trend: ApiWeeklyStatPoint[]
}
