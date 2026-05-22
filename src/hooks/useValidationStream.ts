import { useCallback, useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '../lib/api/client'
import type { ApiRuleResultResponse, SseEvent } from '../types/api'

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'completed' | 'error' | 'timeout'

export interface ValidationStreamState {
  results: ApiRuleResultResponse[]
  status: StreamStatus
  summary: { passed: number; warnings: number; failed: number } | null
  error: string | null
}

export function useValidationStream(runId: string | null | undefined) {
  const [state, setState] = useState<ValidationStreamState>({
    results: [],
    status: 'idle',
    summary: null,
    error: null,
  })
  const esRef = useRef<EventSource | null>(null)

  const start = useCallback(() => {
    if (!runId) return

    esRef.current?.close()

    setState({ results: [], status: 'connecting', summary: null, error: null })

    const url = `${API_BASE_URL}/validation-runs/${runId}/stream`
    const es = new EventSource(url)
    esRef.current = es

    es.onopen = () => {
      setState((prev) => ({ ...prev, status: 'streaming' }))
    }

    es.onmessage = (event: MessageEvent<string>) => {
      let parsed: SseEvent
      try {
        parsed = JSON.parse(event.data) as SseEvent
      } catch {
        return
      }

      // Completion / timeout signals are embedded as { event: 'complete' | 'timeout' }
      if ('event' in parsed && parsed.event) {
        if (parsed.event === 'complete') {
          setState((prev) => ({
            ...prev,
            status: 'completed',
            summary: {
              passed: parsed.passed ?? 0,
              warnings: parsed.warnings ?? 0,
              failed: parsed.failed ?? 0,
            },
          }))
        } else if (parsed.event === 'timeout') {
          setState((prev) => ({ ...prev, status: 'timeout', error: 'Validation timed out.' }))
        }
        es.close()
        return
      }

      // Regular rule result
      const result = parsed as ApiRuleResultResponse
      setState((prev) => ({
        ...prev,
        results: [...prev.results, result],
      }))
    }

    es.onerror = () => {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: 'Connection to validation stream lost.',
      }))
      es.close()
    }
  }, [runId])

  // Auto-start when runId is set
  useEffect(() => {
    if (runId) start()
    return () => {
      esRef.current?.close()
    }
  }, [runId, start])

  const reset = useCallback(() => {
    esRef.current?.close()
    setState({ results: [], status: 'idle', summary: null, error: null })
  }, [])

  return { ...state, reset }
}
