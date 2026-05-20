import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ToastDisplay } from '../shared/ToastDisplay'

export function AppLayout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </div>
      <ToastDisplay />
    </div>
  )
}
