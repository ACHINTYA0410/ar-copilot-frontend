import { apiClient } from './client'
import type {
  ApiDealDetailResponse,
  ApiDealListResponse,
  ApiDealResponse,
  ApiDealStatsResponse,
  ApiDealUpdate,
  DealStatus,
} from '../../types/api'

export interface ListDealsParams {
  status?: DealStatus
  search?: string
  page?: number
  page_size?: number
}

export const dealsApi = {
  list: (params: ListDealsParams = {}) =>
    apiClient
      .get<ApiDealListResponse>('/deals', { params })
      .then((r) => r.data),

  stats: () =>
    apiClient
      .get<ApiDealStatsResponse>('/deals/stats')
      .then((r) => r.data),

  get: (dealId: string) =>
    apiClient
      .get<ApiDealDetailResponse>(`/deals/${dealId}`)
      .then((r) => r.data),

  update: (dealId: string, payload: ApiDealUpdate) =>
    apiClient
      .patch<ApiDealResponse>(`/deals/${dealId}`, payload)
      .then((r) => r.data),
}
