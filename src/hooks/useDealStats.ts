import { useQuery } from '@tanstack/react-query'
import { dealsApi } from '../lib/api/deals'

export function useDealStats() {
  return useQuery({
    queryKey: ['deal-stats'],
    queryFn: () => dealsApi.stats(),
  })
}
