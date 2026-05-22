import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useDealStats } from '../hooks/useDealStats'

interface DealsContextType {
  reviewQueueCount: number
  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

const DealsContext = createContext<DealsContextType | null>(null)

export function DealsProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { data: stats } = useDealStats()
  const reviewQueueCount = (stats?.needs_review ?? 0) + (stats?.stuck ?? 0)

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    if (type === 'success') toast.success(message)
    else if (type === 'error') toast.error(message)
    else if (type === 'info') toast.info(message)
    else toast.warning(message)
  }

  const value = useMemo(() => ({ reviewQueueCount, showToast }), [reviewQueueCount])

  return (
    <DealsContext.Provider value={value}>
      {children}
    </DealsContext.Provider>
  )
}

export function useDeals() {
  const ctx = useContext(DealsContext)
  if (!ctx) throw new Error('useDeals must be used within DealsProvider')
  return ctx
}
