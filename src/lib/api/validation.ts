import { apiClient } from './client'
import type {
  ApiReviewerActionRequest,
  ApiReviewerActionResponse,
  ApiValidationRunResponse,
  ApiValidationTriggerResponse,
} from '../../types/api'

export const validationApi = {
  trigger: (dealId: string, checklistId?: string) =>
    apiClient
      .post<ApiValidationTriggerResponse>(
        `/deals/${dealId}/validate`,
        null,
        { params: checklistId ? { checklist_id: checklistId } : undefined }
      )
      .then((r) => r.data),

  getRun: (runId: string) =>
    apiClient
      .get<ApiValidationRunResponse>(`/validation-runs/${runId}`)
      .then((r) => r.data),

  applyAction: (resultId: string, payload: ApiReviewerActionRequest) =>
    apiClient
      .post<ApiReviewerActionResponse>(`/rule-results/${resultId}/action`, payload)
      .then((r) => r.data),
}
