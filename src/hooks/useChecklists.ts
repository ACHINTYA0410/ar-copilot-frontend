import { useQuery } from '@tanstack/react-query'
import { checklistsApi } from '../lib/api/checklists'

export function useChecklists() {
  return useQuery({
    queryKey: ['checklists'],
    queryFn: () => checklistsApi.list(),
  })
}
