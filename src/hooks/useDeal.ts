import { useQuery } from '@tanstack/react-query'
import { dealsApi } from '../lib/api/deals'

export function useDeal(dealId: string | null | undefined) {
  return useQuery({
    queryKey: ['deal', dealId],
    queryFn: () => dealsApi.get(dealId!),
    enabled: !!dealId,
  })
}
