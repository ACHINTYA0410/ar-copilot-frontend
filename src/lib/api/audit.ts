import { apiClient } from './client'
import type { ApiAuditLogListResponse, ApiAuditStatsResponse, ActorType, ActionType } from '../../types/api'

export interface ListAuditParams {
  actor_type?: ActorType
  action_type?: ActionType
  target_id?: string
  search?: string
  page?: number
  page_size?: number
}

export const auditApi = {
  list: (params: ListAuditParams = {}) =>
    apiClient
      .get<ApiAuditLogListResponse>('/audit-log', { params })
      .then((r) => r.data),

  stats: () =>
    apiClient
      .get<ApiAuditStatsResponse>('/audit-log/stats')
      .then((r) => r.data),
}
