import { useQuery } from '@tanstack/react-query'
import { validationApi } from '../lib/api/validation'

export function useValidationRun(runId: string | null | undefined) {
  return useQuery({
    queryKey: ['validation-run', runId],
    queryFn: () => validationApi.getRun(runId!),
    enabled: !!runId,
  })
}
