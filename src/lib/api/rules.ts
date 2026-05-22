import { apiClient } from './client'
import type {
  ApiRuleResponse,
  ApiRulesBySectionResponse,
  ApiRuleTestResponse,
  ApiRuleUpdate,
} from '../../types/api'

export const rulesApi = {
  listBySection: () =>
    apiClient
      .get<ApiRulesBySectionResponse[]>('/rules')
      .then((r) => r.data),

  get: (ruleId: string) =>
    apiClient
      .get<ApiRuleResponse>(`/rules/${ruleId}`)
      .then((r) => r.data),

  update: (ruleId: string, payload: ApiRuleUpdate) =>
    apiClient
      .patch<ApiRuleResponse>(`/rules/${ruleId}`, payload)
      .then((r) => r.data),

  test: (ruleId: string, dealId: string, documentIds: string[] = []) =>
    apiClient
      .post<ApiRuleTestResponse>(`/rules/${ruleId}/test`, { deal_id: dealId, document_ids: documentIds })
      .then((r) => r.data),
}
