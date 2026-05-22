import { useQuery } from '@tanstack/react-query'
import { auditApi, type ListAuditParams } from '../lib/api/audit'

export function useAuditLog(params: ListAuditParams = {}) {
  return useQuery({
    queryKey: ['audit-log', params],
    queryFn: () => auditApi.list(params),
  })
}

export function useAuditStats() {
  return useQuery({
    queryKey: ['audit-stats'],
    queryFn: () => auditApi.stats(),
  })
}
