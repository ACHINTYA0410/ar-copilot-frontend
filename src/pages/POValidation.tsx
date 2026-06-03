import { useState } from 'react'
import { Search, AlertCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '../lib/utils'
import { apiClient } from '../lib/api'

interface ChecklistItem {
  key: string
  label: string
  status: 'pass' | 'fail' | 'warning'
  details: string
}

interface OrderDetails {
  deal_id: string
  agreement_type: string
  order_id: number
  academic_year: string
  order_type: string
  created_by: string
  created_at: string
  po_mode: string
  notification_sent_to: string
  customer_name: string
  po_approved_by: string
  po_approver_contact_no: string
  po_approved_on: string
  po_verification_link: string
  po_link_status: string
  current_order_status: string
  finance_approval_by: string
  finance_approval_at: string
  approval_aging: string
  po_rejected_at: string
  po_rejection_reasons: string
}

interface ValidationResponse {
  order: OrderDetails
  checklist: ChecklistItem[]
  summary: {
    total: number
    passed: number
    warnings: number
    failed: number
  }
}

export function POValidation() {
  const [searchType, setSearchType] = useState<'order_id' | 'agreement_id'>('order_id')
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ValidationResponse | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim()) return

    setLoading(true)
    setError(null)
    setData(null)

    try {
      const response = await apiClient.get<ValidationResponse>('/po-validation/checklist', {
        params: { [searchType]: searchValue },
      })
      setData(response.data)
    } catch (err: any) {
      const status = err.response?.status
      const detail = err.response?.data?.detail

      if (status === 400) {
        setError(detail || 'Please provide a valid Order ID or Agreement ID.')
      } else if (status === 404) {
        setError(detail || 'No order found with the provided ID.')
      } else if (status === 503) {
        setError(detail || 'Could not connect to ORP MySQL. Check VPN/network access and try again.')
      } else {
        setError(detail || err.message || 'An unexpected error occurred.')
      }
    } finally {
      setLoading(false)
    }
  }

  const renderStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'fail':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />
    }
  }

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'fail':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800'
    }
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">PO Validation Checklist</h1>
            <p className="text-sm text-gray-500 mt-1">
              Verify purchase order details and ensure operational compliance.
            </p>
          </div>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="w-48">
              <label htmlFor="searchType" className="sr-only">Search Type</label>
              <select
                id="searchType"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as any)}
                className="w-full h-11 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3"
              >
                <option value="order_id">Order ID</option>
                <option value="agreement_id">Agreement ID</option>
              </select>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full h-11 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 px-3"
                placeholder={`Enter ${searchType === 'order_id' ? 'Order' : 'Agreement'} ID...`}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchValue.trim()}
              className="h-11 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium">Search Failed</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {data && !loading && (
          <div className="space-y-6">
            
            {/* Summary & Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Order Info Card */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-semibold text-gray-900">Order Information</h2>
                </div>
                <div className="p-6 grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{data.order.order_id || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Deal ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{data.order.deal_id || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium truncate" title={data.order.customer_name}>{data.order.customer_name || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{data.order.academic_year || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Order Status</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">{data.order.current_order_status || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium truncate" title={data.order.created_by}>{data.order.created_by || 'N/A'}</dd>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="font-semibold text-gray-900">Validation Summary</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Checks</span>
                    <span className="text-sm font-bold text-gray-900">{data.summary.total}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" /> Passed
                    </span>
                    <span className="text-sm font-bold text-green-700">{data.summary.passed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Warnings
                    </span>
                    <span className="text-sm font-bold text-amber-700">{data.summary.warnings}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-red-500" /> Failed
                    </span>
                    <span className="text-sm font-bold text-red-700">{data.summary.failed}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900">Validation Checklist</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {data.checklist.map((item) => (
                  <li key={item.key} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5">
                        {renderStatusIcon(item.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-500 mt-1">{item.details}</p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
                            getStatusColor(item.status)
                          )}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
