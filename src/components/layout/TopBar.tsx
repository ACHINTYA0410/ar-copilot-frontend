import { Bell, HelpCircle, Search } from 'lucide-react'

interface TopBarProps {
  title?: string
}

export function TopBar({ title }: TopBarProps) {
  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center px-6 gap-4 sticky top-0 z-10">
      {title && <h1 className="text-base font-semibold text-gray-900">{title}</h1>}
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <Search className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  )
}
