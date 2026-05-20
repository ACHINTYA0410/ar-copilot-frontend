import type { AuditEntry } from '../types'

const now = new Date()
const todayAt = (h: number, m: number) => {
  const d = new Date(now)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
const yesterdayAt = (h: number, m: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() - 1)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
const daysAgoAt = (days: number, h: number, m: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() - days)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export const mockAuditLog: AuditEntry[] = [
  // ── TODAY ──────────────────────────────────────────────────────────────────
  {
    id: 'AE-001',
    timestamp: todayAt(10, 42),
    actor: { name: 'Priya S.', type: 'user', avatarColor: '#3B82F6' },
    action: 'deal_approved',
    summary: 'Priya S. approved deal DL-12345',
    detail: 'Override applied: "Proceeding with manual verification of secondary documents despite low initial OCR confidence on company seal." Finance lead authorization logged.',
    dealId: 'DL-12345',
  },
  {
    id: 'AE-002',
    timestamp: todayAt(9, 15),
    actor: { name: 'AI Agent', type: 'ai_agent' },
    action: 'deal_auto_rejected',
    summary: 'AI Agent auto-rejected deal DL-12348',
    detail: 'Due to PAN/GST mismatch and expired compliance certificates detected in document payload. Confidence threshold not met (38/100). Automatic rejection triggered per Policy AR-07.',
    dealId: 'DL-12348',
  },
  {
    id: 'AE-003',
    timestamp: todayAt(8, 30),
    actor: { name: 'AI Agent', type: 'ai_agent' },
    action: 'deal_auto_approved',
    summary: 'AI Agent auto-approved deal DL-12400',
    detail: 'All 26 validation checks passed with confidence score 96/100. Auto-approval triggered per Policy AA-03.',
    dealId: 'DL-12400',
  },
  {
    id: 'AE-004',
    timestamp: todayAt(8, 5),
    actor: { name: 'Rohan K.', type: 'user', avatarColor: '#10B981' },
    action: 'deal_submitted',
    summary: 'Rohan K. submitted deal DL-12345 for review',
    detail: 'New deal submission: Scholastic Solutions Pvt Ltd — ₹4,50,000. Validation engine v2.4.1 initiated automatically.',
    dealId: 'DL-12345',
  },
  {
    id: 'AE-005',
    timestamp: todayAt(7, 48),
    actor: { name: 'System', type: 'system' },
    action: 'deal_flagged',
    summary: 'System flagged DL-12345 for pattern review',
    detail: 'Pattern Detection: 3 recent deals from West region share identical "Effective Date mismatch" anomaly. Deal flagged for priority review.',
    dealId: 'DL-12345',
  },
  // ── YESTERDAY ──────────────────────────────────────────────────────────────
  {
    id: 'AE-006',
    timestamp: yesterdayAt(16, 30),
    actor: { name: 'Priya S.', type: 'user', avatarColor: '#3B82F6' },
    action: 'rule_modified',
    summary: 'Priya S. modified rule "Signature & Seal Check"',
    detail: 'Configuration change: Raised confidence threshold to reduce false positives observed over past 2 weeks.',
    ruleName: 'Signature & Seal Check',
    diff: [
      { field: 'confidence_threshold', before: '0.70', after: '0.80' },
      { field: 'action_on_fail', before: 'Flag for Manual Review', after: 'Auto-Reject' },
    ],
  },
  {
    id: 'AE-007',
    timestamp: yesterdayAt(11, 5),
    actor: { name: 'System', type: 'system' },
    action: 'pattern_detected',
    summary: 'System detected pattern anomaly',
    detail: 'Detected a pattern of effective date mismatches across 14 transactions from vendor ID V-8902 over the past 30 days. Escalated to Finance Lead for investigation.',
  },
  {
    id: 'AE-008',
    timestamp: yesterdayAt(10, 20),
    actor: { name: 'AI Agent', type: 'ai_agent' },
    action: 'deal_auto_approved',
    summary: 'AI Agent auto-approved deal DL-12401',
    detail: '25 of 26 checks passed. Minor warning on school owner email format — within acceptable threshold. Auto-approved.',
    dealId: 'DL-12401',
  },
  {
    id: 'AE-009',
    timestamp: yesterdayAt(9, 45),
    actor: { name: 'Neha T.', type: 'user', avatarColor: '#EC4899' },
    action: 'deal_rejected',
    summary: 'Neha T. rejected deal DL-12095',
    detail: 'Manual rejection: Deal stuck for 5 days with unresolved pricing annexure gaps. Submitter notified to resubmit with complete documentation.',
    dealId: 'DL-12095',
  },
  {
    id: 'AE-010',
    timestamp: yesterdayAt(8, 15),
    actor: { name: 'Vikram B.', type: 'user', avatarColor: '#F97316' },
    action: 'deal_submitted',
    summary: 'Vikram B. submitted deal DL-12300 for review',
    detail: 'New deal submission: New Era School — ₹2,80,000. Validation engine initiated.',
    dealId: 'DL-12300',
  },
  // ── 2 DAYS AGO ─────────────────────────────────────────────────────────────
  {
    id: 'AE-011',
    timestamp: daysAgoAt(2, 15, 30),
    actor: { name: 'AI Agent', type: 'ai_agent' },
    action: 'deal_auto_rejected',
    summary: 'AI Agent auto-rejected deal DL-12300',
    detail: 'PAN/GST mismatch and expired compliance certificates. Score: 8/26. Auto-rejection per Policy AR-07.',
    dealId: 'DL-12300',
  },
  {
    id: 'AE-012',
    timestamp: daysAgoAt(2, 14, 0),
    actor: { name: 'Priya S.', type: 'user', avatarColor: '#3B82F6' },
    action: 'rule_modified',
    summary: 'Priya S. modified rule "GST Certificate Validation"',
    detail: 'Added expiry date check to GST validation rule after pattern of expired certificates found.',
    ruleName: 'GST Certificate Validation',
    diff: [
      { field: 'check_expiry', before: 'false', after: 'true' },
      { field: 'expiry_warning_days', before: 'N/A', after: '30' },
    ],
  },
  {
    id: 'AE-013',
    timestamp: daysAgoAt(2, 11, 20),
    actor: { name: 'Karan S.', type: 'user', avatarColor: '#EF4444' },
    action: 'deal_submitted',
    summary: 'Karan S. submitted deal DL-12349 for review',
    detail: 'Deal DL-12349 submitted: Sunrise Public School — ₹5,60,000.',
    dealId: 'DL-12349',
  },
  {
    id: 'AE-014',
    timestamp: daysAgoAt(2, 9, 0),
    actor: { name: 'System', type: 'system' },
    action: 'deal_flagged',
    summary: 'System escalated DL-12220 to stuck status',
    detail: 'Deal DL-12220 (St. Xavier\'s High School) has been awaiting review for 72 hours. Escalated to Finance Lead.',
    dealId: 'DL-12220',
  },
  // ── 3 DAYS AGO ─────────────────────────────────────────────────────────────
  {
    id: 'AE-015',
    timestamp: daysAgoAt(3, 16, 45),
    actor: { name: 'Priya S.', type: 'user', avatarColor: '#3B82F6' },
    action: 'override_applied',
    summary: 'Priya S. applied manual override on DL-12354',
    detail: 'Override: "School owner confirmed GST discrepancy is due to recent address change. Supporting documents verified offline." Deal approved.',
    dealId: 'DL-12354',
  },
  {
    id: 'AE-016',
    timestamp: daysAgoAt(3, 14, 10),
    actor: { name: 'AI Agent', type: 'ai_agent' },
    action: 'deal_auto_approved',
    summary: 'AI Agent auto-approved deal DL-12402',
    detail: 'All 26 checks passed. Confidence: 98/100. Highest score this week. Auto-approved.',
    dealId: 'DL-12402',
  },
  {
    id: 'AE-017',
    timestamp: daysAgoAt(3, 10, 30),
    actor: { name: 'System', type: 'system' },
    action: 'rule_modified',
    summary: 'System published Checklist v3.2',
    detail: 'Onboarding Validation checklist updated to v3.2. Changes: Added Tranche 3 date validation (R-24 enhanced), tightened seal clarity threshold from 50 to 60.',
  },
  {
    id: 'AE-018',
    timestamp: daysAgoAt(3, 9, 0),
    actor: { name: 'Divya R.', type: 'user', avatarColor: '#06B6D4' },
    action: 'deal_submitted',
    summary: 'Divya R. submitted deal DL-12350 for review',
    detail: 'Deal DL-12350 submitted: Vidya Niketan Trust — ₹8,90,000.',
    dealId: 'DL-12350',
  },
  // ── 4 DAYS AGO ─────────────────────────────────────────────────────────────
  {
    id: 'AE-019',
    timestamp: daysAgoAt(4, 17, 0),
    actor: { name: 'Neha T.', type: 'user', avatarColor: '#EC4899' },
    action: 'deal_approved',
    summary: 'Neha T. approved deal DL-12352',
    detail: 'Manual approval after confirming Tranche 3 date verbally with submitter. Date subsequently updated in HubSpot.',
    dealId: 'DL-12352',
  },
  {
    id: 'AE-020',
    timestamp: daysAgoAt(4, 13, 15),
    actor: { name: 'AI Agent', type: 'ai_agent' },
    action: 'pattern_detected',
    summary: 'AI Agent flagged regional pattern in Bihar submissions',
    detail: 'Machine learning anomaly detection: 6 of last 9 deals from Bihar zone contain GST-PAN entity mismatches. Pattern score: HIGH risk.',
  },
  {
    id: 'AE-021',
    timestamp: daysAgoAt(4, 11, 0),
    actor: { name: 'Rohan K.', type: 'user', avatarColor: '#10B981' },
    action: 'deal_submitted',
    summary: 'Rohan K. submitted deal DL-12351 for review',
    detail: 'Deal DL-12351: Greenwood High School — ₹4,20,000.',
    dealId: 'DL-12351',
  },
  {
    id: 'AE-022',
    timestamp: daysAgoAt(4, 9, 30),
    actor: { name: 'System', type: 'system' },
    action: 'deal_flagged',
    summary: 'System escalated DL-12180 to stuck status',
    detail: 'Deal DL-12180 (Cambridge School) has been pending for 96 hours with no resolution.',
    dealId: 'DL-12180',
  },
  // ── 5 DAYS AGO ─────────────────────────────────────────────────────────────
  {
    id: 'AE-023',
    timestamp: daysAgoAt(5, 15, 45),
    actor: { name: 'Priya S.', type: 'user', avatarColor: '#3B82F6' },
    action: 'rule_modified',
    summary: 'Priya S. modified rule "PAN Card Validation"',
    detail: 'Extended OCR confidence threshold and added government DB cross-reference step.',
    ruleName: 'PAN Card Validation',
    diff: [
      { field: 'ocr_min_confidence', before: '0.75', after: '0.85' },
      { field: 'govt_db_check', before: 'false', after: 'true' },
    ],
  },
  {
    id: 'AE-024',
    timestamp: daysAgoAt(5, 14, 0),
    actor: { name: 'AI Agent', type: 'ai_agent' },
    action: 'deal_auto_rejected',
    summary: 'AI Agent auto-rejected deal DL-12301',
    detail: 'Agreement entirely unsigned, PAN absent, GST certificate absent. Score: 6/26. Auto-rejected.',
    dealId: 'DL-12301',
  },
  {
    id: 'AE-025',
    timestamp: daysAgoAt(5, 11, 30),
    actor: { name: 'Sneha P.', type: 'user', avatarColor: '#8B5CF6' },
    action: 'deal_submitted',
    summary: 'Sneha P. submitted deal DL-12346 for review',
    detail: 'Deal DL-12346: Bright Future Academy — ₹3,20,000.',
    dealId: 'DL-12346',
  },
  // ── 6 DAYS AGO ─────────────────────────────────────────────────────────────
  {
    id: 'AE-026',
    timestamp: daysAgoAt(6, 16, 0),
    actor: { name: 'Neha T.', type: 'user', avatarColor: '#EC4899' },
    action: 'deal_rejected',
    summary: 'Neha T. rejected deal DL-11990',
    detail: 'Rejected: Agreement format does not match PE Cycle template. Submitter requested to use updated template v4.2.',
    dealId: 'DL-11990',
  },
  {
    id: 'AE-027',
    timestamp: daysAgoAt(6, 12, 30),
    actor: { name: 'System', type: 'system' },
    action: 'deal_flagged',
    summary: 'System weekly compliance report generated',
    detail: 'Weekly compliance report for W20 2024: 1,248 total events, 98% compliance score, 12 manual overrides, 3 rule changes, 1,105 AI actions.',
  },
  {
    id: 'AE-028',
    timestamp: daysAgoAt(6, 10, 0),
    actor: { name: 'Amit V.', type: 'user', avatarColor: '#10B981' },
    action: 'deal_submitted',
    summary: 'Amit V. submitted deal DL-12347 for review',
    detail: 'Deal DL-12347: EduStar Learning Pvt Ltd — ₹7,80,000.',
    dealId: 'DL-12347',
  },
  // ── 7 DAYS AGO ─────────────────────────────────────────────────────────────
  {
    id: 'AE-029',
    timestamp: daysAgoAt(7, 15, 15),
    actor: { name: 'Priya S.', type: 'user', avatarColor: '#3B82F6' },
    action: 'deal_approved',
    summary: 'Priya S. approved deal DL-11945',
    detail: 'Approved after resolving all warnings manually. High-value deal expedited per Finance Lead instruction.',
    dealId: 'DL-11945',
  },
  {
    id: 'AE-030',
    timestamp: daysAgoAt(7, 9, 0),
    actor: { name: 'System', type: 'system' },
    action: 'pattern_detected',
    summary: 'System initiated nightly validation sweep',
    detail: 'Nightly batch: 47 pending deals re-evaluated. 12 status updates applied. 2 anomalies logged for human review.',
  },
]

export const auditWeeklyStats = {
  totalEvents: 1248,
  manualOverrides: 12,
  ruleChanges: 3,
  aiActions: 1105,
  complianceScore: 98,
}
