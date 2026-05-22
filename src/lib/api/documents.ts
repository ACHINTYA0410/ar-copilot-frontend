import { apiClient } from './client'
import type { ApiDocumentUploadResponse } from '../../types/api'

export const documentsApi = {
  upload: (dealId: string, file: File, documentType = 'other') => {
    const form = new FormData()
    form.append('file', file)
    form.append('document_type', documentType)
    return apiClient
      .post<ApiDocumentUploadResponse>(`/deals/${dealId}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data)
  },
}
