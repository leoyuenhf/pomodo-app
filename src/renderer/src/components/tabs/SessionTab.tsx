import React, { useRef, useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AppSettings, ChainSession } from '@shared/types'

const MAX_CHAIN = 10

interface Props {
  settings: AppSettings
  onUpdate: (patch: Partial<AppSettings>) => void
  sessionChain: ChainSession[]
  onAddToChain: (session: ChainSession) => void
  onClearChain: () => void
}

export function SessionTab({ settings, onUpdate, sessionChain, onAddToChain, onClearChain }: Props): React.ReactElement {
  const { focusDuration, breakDuration } = settings
  const total = focusDuration + breakDuration
  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const [inputValue, setInputValue] = useState(String(total))

  useEffect(() => {
    setInputValue(String(total))
  }, [total])

  const increment = (): void => {
    if (total >= 240) return
    if (focusDuration < 120) {
      onUpdate({ focusDuration: focusDuration + 1 })
    } else if (breakDuration < 120) {
      onUpdate({ breakDuration: breakDuration + 1 })
    }
  }

  const decrement = (): void => {
    if (focusDuration > 1) {
      onUpdate({ focusDuration: focusDuration - 1 })
    } else if (breakDuration > 1) {
      onUpdate({ breakDuration: breakDuration - 1 })
    }
  }

  const commitInput = (): void => {
    const parsed = parseInt(inputValue, 10)
    const { focusDuration: fd, breakDuration: bd } = settingsRef.current
    const currentTotal = fd + bd
    if (isNaN(parsed) || parsed < 2 || parsed > 240) {
      setInputValue(String(currentTotal))
      return
    }
    const newFocus = Math.max(Math.max(1, parsed - 120), Math.min(Math.min(parsed - 1, 120), Math.round(parsed * fd / currentTotal)))
    onUpdate({ focusDuration: newFocus, breakDuration: parsed - newFocus })
  }

  const handleMouseMove = useCallback((e: MouseEvent): void => {
    if (!draggingRef.current || !containerRef.current) return
    const { focusDuration: fd, breakDuration: bd } = settingsRef.current
    const t = fd + bd
    const { left, width } = containerRef.current.getBoundingClientRect()
    const x = e.clientX - left
    const ratio = Math.max(1 / t, Math.min((t - 1) / t, x / width))
    const newFocus = Math.max(Math.max(1, t - 120), Math.min(Math.min(t - 1, 120), Math.round(ratio * t)))
    const newRest = t - newFocus
    if (newFocus !== fd || newRest !== bd) {
      onUpdate({ focusDuration: newFocus, breakDuration: newRest })
    }
  }, [onUpdate])

  const handleMouseUp = useCallback((): void => {
    draggingRef.current = false
    document.body.style.cursor = ''
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleDividerMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault()
    draggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  useEffect(() => {
    return () => {
      document.body.style.cursor = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const totalChainMinutes = sessionChain.reduce((sum, s) => sum + s.focusDuration + s.restDuration, 0)

  return (
    <div className="session-tab">
      <p className="session-label">How long is the session?</p>

      <div className="spinner-row">
        <div className="spinner-arrows">
          <button className="arrow-btn" onClick={increment} aria-label="Increase">
            ▲
          </button>
          <button className="arrow-btn" onClick={decrement} aria-label="Decrease">
            ▼
          </button>
        </div>
        <input
          className="spinner-number"
          type="text"
          inputMode="numeric"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={commitInput}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commitInput()
              e.currentTarget.blur()
            }
          }}
          aria-label="Total session duration in minutes"
        />
        <span className="spinner-unit">minutes</span>
      </div>

      <div className="duration-cards" ref={containerRef}>
        <div className="duration-card focus-card" style={{ flex: focusDuration }}>
          <span className="card-watermark">FOCUS</span>
          <span className="card-mode">FOCUS</span>
          <span className="card-number">{focusDuration}</span>
          <span className="card-unit">minutes</span>
        </div>

        <div
          className="session-divider"
          onMouseDown={handleDividerMouseDown}
          role="separator"
          aria-label="Drag to adjust focus and rest split"
        />

        <div className="duration-card rest-card" style={{ flex: breakDuration }}>
          <span className="card-watermark">REST</span>
          <span className="card-mode">REST</span>
          <span className="card-number">{breakDuration}</span>
          <span className="card-unit">minutes</span>
        </div>
      </div>

      {/* Chain timeline */}
      <AnimatePresence>
        {sessionChain.length > 0 && (
          <motion.div
            className="chain-area"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="chain-timeline">
              <AnimatePresence initial={false}>
                {sessionChain.map((session, i) => (
                  <motion.div
                    key={i}
                    className="chain-session"
                    style={{ flex: session.focusDuration + session.restDuration, transformOrigin: 'left center' }}
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <div className="chain-block chain-block-focus" style={{ flex: session.focusDuration }}>
                      {session.focusDuration}
                    </div>
                    <div className="chain-block chain-block-rest" style={{ flex: session.restDuration }}>
                      {session.restDuration}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="chain-footer">
              <span className="chain-total">{totalChainMinutes} min total</span>
              <button className="chain-clear-btn" onClick={onClearChain}>
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
