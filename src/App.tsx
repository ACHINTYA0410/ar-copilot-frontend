import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DealsProvider } from './context/DealsContext'
import { AppLayout } from './components/layout/AppLayout'
import { Dashboard } from './pages/Dashboard'
import { DealQueue } from './pages/DealQueue'
import { DealApprovalDashboard } from './pages/DealApprovalDashboard'
import { SubmitterUpload } from './pages/SubmitterUpload'
import { RuleStudio } from './pages/RuleStudio'
import { AuditLog } from './pages/AuditLog'

export default function App() {
  return (
    <DealsProvider>
      <BrowserRouter>
        <Routes>
          {/* Submitter upload: standalone layout (no sidebar) */}
          <Route path="/submit" element={<SubmitterUpload />} />

          {/* Main app with sidebar */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/queue" element={<DealQueue />} />
            <Route path="/deal/:dealId" element={<DealApprovalDashboard />} />
            <Route path="/rules" element={<RuleStudio />} />
            <Route path="/audit" element={<AuditLog />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </DealsProvider>
  )
}
