import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useDeals } from '../../context/DealsContext'
import { cn } from '../../lib/utils'

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: 'bg-white border-emerald-200 text-emerald-800',
  error: 'bg-white border-red-200 text-red-800',
  warning: 'bg-white border-amber-200 text-amber-800',
  info: 'bg-white border-blue-200 text-blue-800',
}

const ICON_COLORS = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
}

export function ToastDisplay() {
  const { toasts } = useDeals()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm font-medium max-w-sm pointer-events-auto',
              COLORS[toast.type],
            )}
          >
            <Icon className={cn('w-4 h-4 flex-shrink-0', ICON_COLORS[toast.type])} />
            {toast.message}
          </div>
        )
      })}
    </div>
  )
}
