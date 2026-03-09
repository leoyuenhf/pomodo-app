import React, { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AppSettings, SessionMode } from '@shared/types'
import { useTimer } from '../hooks/useTimer'
import { BasicTheme } from '../components/themes/BasicTheme'
import { TomatoTheme } from '../components/themes/TomatoTheme'

interface Props {
  settings: AppSettings
  onBack: () => void
}

export function TimerPage({ settings, onBack }: Props): React.ReactElement {
  const [sessionMode, setSessionMode] = useState<SessionMode>('focus')
  const [showRestPrompt, setShowRestPrompt] = useState(false)
  const [blockerActive, setBlockerActive] = useState(false)
  const [blockerError, setBlockerError] = useState('')

  const duration =
    sessionMode === 'focus' ? settings.focusDuration : settings.breakDuration

  const handleComplete = useCallback(() => {
    if (sessionMode === 'focus') {
      // Deactivate blocker when focus ends
      if (blockerActive) {
        window.api.unblockSites().then(() => setBlockerActive(false))
      }
      setShowRestPrompt(true)
    } else {
      // REST done → back to landing
      onBack()
    }
  }, [sessionMode, blockerActive, onBack])

  const { remaining, fillRatio, status, start, pause, resume, reset } = useTimer(
    duration,
    handleComplete
  )

  // Update window title every tick
  useEffect(() => {
    const totalSeconds = Math.ceil(remaining / 1000)
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    const time = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    const label = sessionMode === 'focus' ? 'Focus' : 'Rest'
    window.api.setTitle(`[${time}] — ${label}`)
  }, [remaining, sessionMode])

  // Reset title on unmount
  useEffect(() => {
    return () => window.api.setTitle('Pomodoro')
  }, [])

  const handleStart = async (): Promise<void> => {
    if (sessionMode === 'focus' && settings.blockerEnabled) {
      const result = await window.api.blockSites(settings.blockedDomains)
      if (result.ok) {
        setBlockerActive(true)
      } else {
        setBlockerError(result.error ?? 'Blocker failed — continuing without blocking.')
        setTimeout(() => setBlockerError(''), 4000)
      }
    }
    start()
  }

  const handlePause = (): void => {
    pause()
    if (blockerActive) {
      window.api.unblockSites().then(() => setBlockerActive(false))
    }
  }

  const handleResume = async (): Promise<void> => {
    if (sessionMode === 'focus' && settings.blockerEnabled) {
      const result = await window.api.blockSites(settings.blockedDomains)
      if (result.ok) {
        setBlockerActive(true)
      } else {
        setBlockerError(result.error ?? 'Blocker failed — continuing without blocking.')
        setTimeout(() => setBlockerError(''), 4000)
      }
    }
    resume()
  }

  const handleReset = (): void => {
    reset()
    if (blockerActive) {
      window.api.unblockSites().then(() => setBlockerActive(false))
    }
    onBack()
  }

  const handleRestYes = (): void => {
    setShowRestPrompt(false)
    setSessionMode('break')
    // Timer will auto-start for REST
    setTimeout(() => start(), 50)
  }

  const handleRestNo = (): void => {
    setShowRestPrompt(false)
    onBack()
  }

  const isComplete = status === 'done'

  return (
    <div className="timer-page">
      {/* Titlebar drag region */}
      <div className="titlebar" />

      {/* Fullscreen button */}
      <button
        className="fullscreen-btn"
        onClick={() => window.api.toggleFullscreen()}
        aria-label="Toggle fullscreen"
      />

      {/* Close button */}
      <button className="close-btn" onClick={handleReset} aria-label="Close" />

      <div className="timer-content">
        {/* Blocker status indicator */}
        {settings.blockerEnabled && (
          <div className="blocker-status-indicator">
            <div className={`blocker-light ${blockerActive ? 'active' : 'inactive'}`} />
            <span className="blocker-status-text">
              {blockerActive ? 'Blocker: ON' : 'Blocker: OFF'}
            </span>
          </div>
        )}

        {/* Theme display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={settings.theme}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="theme-wrapper"
          >
            {settings.theme === 'basic' ? (
              <BasicTheme
                fillRatio={fillRatio}
                sessionMode={sessionMode}
                remaining={remaining}
              />
            ) : (
              <TomatoTheme
                fillRatio={fillRatio}
                sessionMode={sessionMode}
                remaining={remaining}
                isComplete={isComplete}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="timer-controls">
          {status === 'idle' && (
            <button className="ctrl-btn primary" onClick={handleStart}>
              Start
            </button>
          )}
          {status === 'running' && (
            <button className="ctrl-btn" onClick={handlePause}>
              Pause
            </button>
          )}
          {status === 'paused' && (
            <button className="ctrl-btn primary" onClick={handleResume}>
              Resume
            </button>
          )}
          <button className="ctrl-btn secondary" onClick={handleReset}>
            Reset
          </button>
        </div>

        {/* Blocker error */}
        {blockerError && (
          <p className="blocker-error-msg">{blockerError}</p>
        )}
      </div>

      {/* REST prompt modal */}
      <AnimatePresence>
        {showRestPrompt && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-box"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <h2 className="modal-title">Focus session complete!</h2>
              <p className="modal-body">
                Time to rest for {settings.breakDuration} minute
                {settings.breakDuration !== 1 ? 's' : ''}.
              </p>
              <div className="modal-actions">
                <button className="modal-btn primary" onClick={handleRestYes}>
                  Start REST
                </button>
                <button className="modal-btn secondary" onClick={handleRestNo}>
                  Done for now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
