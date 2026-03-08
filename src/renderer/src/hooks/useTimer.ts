import { useState, useRef, useCallback, useEffect } from 'react'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'done'

export interface TimerState {
  remaining: number    // ms
  fillRatio: number    // 1.0 → 0.0
  status: TimerStatus
}

export interface TimerControls {
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
}

export function useTimer(
  durationMinutes: number,
  onComplete: () => void
): TimerState & TimerControls {
  const totalMs = durationMinutes * 60 * 1000

  const [remaining, setRemaining] = useState(totalMs)
  const [status, setStatus] = useState<TimerStatus>('idle')

  const startAtRef = useRef<number>(0)
  const remainingAtPauseRef = useRef<number>(totalMs)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Reset when duration changes (e.g. user changes settings)
  useEffect(() => {
    if (status === 'idle') {
      setRemaining(durationMinutes * 60 * 1000)
      remainingAtPauseRef.current = durationMinutes * 60 * 1000
    }
  }, [durationMinutes, status])

  const clearTick = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const startTicking = useCallback(() => {
    clearTick()
    startAtRef.current = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startAtRef.current
      const newRemaining = Math.max(0, remainingAtPauseRef.current - elapsed)
      setRemaining(newRemaining)
      if (newRemaining === 0) {
        clearTick()
        setStatus('done')
        onCompleteRef.current()
      }
    }, 100)
  }, [clearTick])

  const start = useCallback(() => {
    const total = durationMinutes * 60 * 1000
    remainingAtPauseRef.current = total
    setRemaining(total)
    setStatus('running')
    startTicking()
  }, [durationMinutes, startTicking])

  const pause = useCallback(() => {
    const elapsed = Date.now() - startAtRef.current
    remainingAtPauseRef.current = Math.max(0, remainingAtPauseRef.current - elapsed)
    clearTick()
    setStatus('paused')
  }, [clearTick])

  const resume = useCallback(() => {
    setStatus('running')
    startTicking()
  }, [startTicking])

  const reset = useCallback(() => {
    clearTick()
    const total = durationMinutes * 60 * 1000
    remainingAtPauseRef.current = total
    setRemaining(total)
    setStatus('idle')
  }, [clearTick, durationMinutes])

  // Cleanup on unmount
  useEffect(() => () => clearTick(), [clearTick])

  const fillRatio = remaining / totalMs

  return { remaining, fillRatio, status, start, pause, resume, reset }
}
