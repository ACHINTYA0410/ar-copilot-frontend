import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Inbox,
  Sliders,
  ClipboardList,
  Plus,
  Zap,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useDeals } from '../../context/DealsContext'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Deal Queue', icon: Inbox, to: '/queue', badgeDynamic: true },
  { label: 'Rule Studio', icon: Sliders, to: '/rules' },
  { label: 'Audit Log', icon: ClipboardList, to: '/audit' },
]

export function Sidebar() {
  const navigate = useNavigate()
  const { reviewQueueCount } = useDeals()

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 leading-tight">AI Copilot</p>
            <p className="text-xs text-gray-400 leading-tight">Deal Intelligence</p>
          </div>
        </div>
      </div>

      {/* Submit button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => navigate('/submit')}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Submit New Deal
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn('w-4 h-4 flex-shrink-0', isActive ? 'text-blue-600' : 'text-gray-400')}
                />
                <span className="flex-1">{item.label}</span>
                {item.badgeDynamic && reviewQueueCount > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {reviewQueueCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom user card */}
      <div className="border-t border-gray-100">
        <div className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            PS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 leading-tight truncate">Priya S.</p>
            <p className="text-xs text-gray-400 leading-tight truncate">Finance Team</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
