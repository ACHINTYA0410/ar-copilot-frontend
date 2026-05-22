import { useQuery } from '@tanstack/react-query'
import { dealsApi, type ListDealsParams } from '../lib/api/deals'

export function useDeals(params: ListDealsParams = {}) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => dealsApi.list(params),
  })
}
