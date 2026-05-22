import { useQuery } from '@tanstack/react-query'
import { rulesApi } from '../lib/api/rules'

export function useRules() {
  return useQuery({
    queryKey: ['rules'],
    queryFn: () => rulesApi.listBySection(),
  })
}

export function useRule(ruleId: string | null | undefined) {
  return useQuery({
    queryKey: ['rule', ruleId],
    queryFn: () => rulesApi.get(ruleId!),
    enabled: !!ruleId,
  })
}
