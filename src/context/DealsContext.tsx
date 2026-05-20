import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { mockDeals } from '../data/mockDeals'
import type { DealStatus } from '../types'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

interface DealsContextType {
  dealStatuses: Record<string, DealStatus>
  updateDealStatus: (id: string, status: DealStatus) => void
  getEffectiveStatus: (id: string) => DealStatus
  reviewQueueCount: number
  toasts: Toast[]
  showToast: (message: string, type?: Toast['type']) => void
}

const DealsContext = createContext<DealsContextType | null>(null)

export function DealsProvider({ children }: { children: ReactNode }) {
  const [dealStatuses, setDealStatuses] = useState<Record<string, DealStatus>>({})
  const [toasts, setToasts] = useState<Toast[]>([])

  const updateDealStatus = useCallback((id: string, status: DealStatus) => {
    setDealStatuses((prev) => ({ ...prev, [id]: status }))
  }, [])

  const getEffectiveStatus = useCallback(
    (id: string): DealStatus => {
      return dealStatuses[id] ?? (mockDeals.find((d) => d.id === id)?.status ?? 'needs_review')
    },
    [dealStatuses],
  )

  const reviewQueueCount = mockDeals.filter((d) => {
    const s = dealStatuses[d.id] ?? d.status
    return s === 'needs_review' || s === 'stuck'
  }).length

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3500)
  }, [])

  return (
    <DealsContext.Provider
      value={{ dealStatuses, updateDealStatus, getEffectiveStatus, reviewQueueCount, toasts, showToast }}
    >
      {children}
    </DealsContext.Provider>
  )
}

export function useDeals() {
  const ctx = useContext(DealsContext)
  if (!ctx) throw new Error('useDeals must be used within DealsProvider')
  return ctx
}
