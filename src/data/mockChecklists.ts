import type { Checklist, StudioRule } from '../types'

export const mockChecklists: Checklist[] = [
  {
    id: 'CL-01',
    name: 'Onboarding Validation',
    rulesCount: 26,
    status: 'Active',
    version: 'v3.2',
  },
  {
    id: 'CL-02',
    name: 'Order Approval',
    rulesCount: 18,
    status: 'Active',
    version: 'v2.1',
  },
  {
    id: 'CL-03',
    name: 'Renewal Validation',
    rulesCount: 12,
    status: 'Draft',
    version: 'v1.0',
  },
  {
    id: 'CL-04',
    name: 'KYC Verification',
    rulesCount: 14,
    status: 'Active',
    version: 'v2.4',
  },
]

export const mockStudioRules: StudioRule[] = [
  {
    id: 'SR-01',
    name: 'Verify Identity Document',
    type: 'Document Content',
    description:
      'Extracts names, dates, and identifiers from uploaded ID documents and cross-references against the HubSpot contact record and government verification APIs.',
    threshold: 85,
    actionOnFail: 'Flag for Manual Review',
    context: ['User Profile', 'ID Scan'],
    firedCount: 3421,
    avgTime: 1.2,
    isComplete: true,
    validationPrompt:
      'Extract the full legal name, date of birth, and ID number from the uploaded identity document. Cross-reference these fields against the HubSpot contact record for this deal. Flag any discrepancies greater than minor formatting differences (e.g., "Pvt Ltd" vs "Private Limited" is acceptable). Return structured JSON with field-level match scores.',
  },
  {
    id: 'SR-02',
    name: 'Check Agreement Signatures',
    type: 'Logic Node',
    description:
      'Validates that all designated signing areas in the agreement PDF contain valid signatures from authorized signatories. Cross-references signatory names against the HubSpot deal contact.',
    threshold: 70,
    actionOnFail: 'Auto-Reject',
    context: ['HubSpot Deal Data', 'Agreement PDF'],
    firedCount: 1247,
    avgTime: 0.8,
    isComplete: true,
    validationPrompt:
      'Verify that line items in the CRM match the generated PDF agreement before final approval. Check each signature zone on pages 1, 7, and 14 for presence of a valid signature. Extract the signatory name where legible and compare against the HubSpot "Authorized Signatory" field. Return pass/fail per page with confidence scores.',
  },
  {
    id: 'SR-03',
    name: 'Risk Scoring API (Draft)',
    type: 'Integration',
    description: 'Configuration incomplete.',
    threshold: 75,
    actionOnFail: 'Flag for Manual Review',
    context: [],
    firedCount: 0,
    avgTime: 0,
    isComplete: false,
    validationPrompt: '',
  },
]
