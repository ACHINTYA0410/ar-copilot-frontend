import { apiClient } from './client'
import type { ApiChecklistListResponse, ApiChecklistResponse } from '../../types/api'

export const checklistsApi = {
  list: () =>
    apiClient
      .get<ApiChecklistListResponse>('/checklists')
      .then((r) => r.data),

  get: (checklistId: string) =>
    apiClient
      .get<ApiChecklistResponse>(`/checklists/${checklistId}`)
      .then((r) => r.data),
}
