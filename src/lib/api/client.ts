import axios from 'axios'
import { toast } from 'sonner'

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string

if (!BASE_URL) {
  console.error('VITE_API_BASE_URL is not set. Check your .env.local file.')
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      toast.error('Backend unavailable. Check that the FastAPI server is running on port 8000.')
      return Promise.reject(error)
    }

    const status: number = error.response.status
    const detail: string = error.response.data?.detail ?? 'An unexpected error occurred.'

    if (status === 404) {
      // Let callers handle 404 as empty state — no global toast
      return Promise.reject(error)
    }

    if (status >= 400 && status < 500) {
      toast.error(`Error ${status}: ${detail}`)
    } else if (status >= 500) {
      toast.error(`Server error ${status}. Try again shortly.`)
    }

    return Promise.reject(error)
  }
)

export const API_BASE_URL = BASE_URL
