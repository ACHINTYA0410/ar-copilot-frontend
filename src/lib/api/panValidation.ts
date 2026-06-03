import { apiClient } from './client'

export interface PANRuleResult {
  rule: string
  status: 'PASS' | 'FAIL' | 'WARNING'
  inputValue: string | null
  databaseValue: string | null
  message: string
}

export interface PANExtracted {
  pan_number: string | null
  name: string | null
  father_name: string | null
  date_of_birth: string | null
  confidence: number | null
  raw_text: string | null
  possible_pan_numbers: string[]
}

export interface PANDatabase {
  matched: boolean
  pan_number: string | null
  entity_name: string | null
  entity_id: string | null
  trace_id: string | null
  note: string | null
}

export interface PANValidationResponse {
  status: 'PASS' | 'FAIL' | 'WARNING'
  extracted: PANExtracted
  database: PANDatabase
  rules: PANRuleResult[]
}

export const panValidationApi = {
  validateDocument: async (
    file: File,
    entityType?: string,
    entityId?: string,
  ): Promise<PANValidationResponse> => {
    const form = new FormData()
    form.append('file', file)
    if (entityType) form.append('entity_type', entityType)
    if (entityId) form.append('entity_id', entityId)

    const res = await apiClient.post<PANValidationResponse>(
      '/validation/pan/validate-document',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90000 },
    )
    return res.data
  },

  validateManual: async (panNumber: string): Promise<PANValidationResponse> => {
    const form = new FormData()
    form.append('pan_number', panNumber)
    const res = await apiClient.post<PANValidationResponse>(
      '/validation/pan/validate-manual',
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    )
    return res.data
  },
}
