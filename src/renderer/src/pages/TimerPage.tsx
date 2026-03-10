import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AppSettings, ChainSession, SessionMode } from '@shared/types'
import { useTimer } from '../hooks/useTimer'
import { BasicTheme } from '../components/themes/BasicTheme'
import { TomatoTheme } from '../components/themes/TomatoTheme'

interface Props {
  settings: AppSettings
  onBack: () => void
  sessionChain: ChainSession[]
}

export function TimerPage({ settings, onBack, sessionChain }: Props): React.ReactElement {
  const isChainMode = sessionChain.length > 0
  const [currentChainIndex, setCurrentChainIndex] = useState(0)
  const [sessionMode, setSessionMode] = useState<SessionMode>('focus')
  const [showRestPrompt, setShowRestPrompt] = useState(false)
  const [blockerActive, setBlockerActive] = useState(false)
  const [blockerError, setBlockerError] = useState('')
  const [wallpaperEnabled, setWallpaperEnabled] = useState(false)
  const wallpaperEnabledRef = useRef(false)
  wallpaperEnabledRef.current = wallpaperEnabled
  const lastWallpaperTimeRef = useRef('')

  // Resolve duration from chain or settings
  const currentChainSession = isChainMode ? sessionChain[currentChainIndex] : null
  const focusDuration = currentChainSession ? currentChainSession.focusDuration : settings.focusDuration
  const breakDuration = currentChainSession ? currentChainSession.restDuration : settings.breakDuration
  const duration = sessionMode === 'focus' ? focusDuration : breakDuration

  // Advance to next chain session or end
  const handleChainAdvance = useCallback((): void => {
    const nextIndex = currentChainIndex + 1
    if (nextIndex < sessionChain.length) {
      setCurrentChainIndex(nextIndex)
      setSessionMode('focus')
    } else {
      onBack()
    }
  }, [currentChainIndex, sessionChain.length, onBack])

  const handleComplete = useCallback(() => {
    window.api.timerComplete()
    if (sessionMode === 'focus') {
      if (blockerActive) {
        window.api.unblockSites().then(() => setBlockerActive(false))
      }
      setShowRestPrompt(true)
    } else {
      // REST done
      if (isChainMode) {
        handleChainAdvance()
      } else {
        onBack()
      }
    }
  }, [sessionMode, blockerActive, isChainMode, handleChainAdvance, onBack])

  const { remaining, fillRatio, status, start, pause, resume, reset } = useTimer(
    duration,
    handleComplete
  )

  // Stable ref so setTimeout callbacks always call the latest start()
  const startRef = useRef(start)
  startRef.current = start

  // Update window title + wallpaper tick every timer tick
  useEffect(() => {
    const totalSeconds = Math.ceil(remaining / 1000)
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    const time = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    const label = sessionMode === 'focus' ? 'Focus' : 'Rest'
    window.api.setTitle(`[${time}] — ${label}`)

    if (wallpaperEnabledRef.current && status === 'running' && time !== lastWallpaperTimeRef.current) {
      lastWallpaperTimeRef.current = time
      window.api.wallpaperTick(time, sessionMode)
    }
  }, [remaining, sessionMode, status])

  // Reset title + disable wallpaper on unmount
  useEffect(() => {
    return () => {
      window.api.setTitle('Pomodoro')
      if (wallpaperEnabledRef.current) {
        window.api.disableWallpaper().catch(() => { /* ignore */ })
      }
    }
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
    if (wallpaperEnabled) {
      window.api.disableWallpaper().catch(() => { /* ignore */ })
      setWallpaperEnabled(false)
    }
    onBack()
  }

  const handleRestYes = (): void => {
    setShowRestPrompt(false)
    setSessionMode('break')
    setTimeout(() => startRef.current(), 50)
  }

  const handleRestNo = (): void => {
    setShowRestPrompt(false)
    onBack()
  }

  const handleToggleWallpaper = async (): Promise<void> => {
    if (wallpaperEnabled) {
      await window.api.disableWallpaper()
      setWallpaperEnabled(false)
    } else {
      await window.api.enableWallpaper()
      setWallpaperEnabled(true)
    }
  }

  const isComplete = status === 'done'

  const chainLabel = isChainMode
    ? `Session ${currentChainIndex + 1} of ${sessionChain.length}`
    : null

  return (
    <div className="timer-page">
      {/* Titlebar drag region */}
      <div className="titlebar" />

      {/* Minimize button */}
      <button
        className="fullscreen-btn"
        onClick={() => window.api.minimize()}
        aria-label="Minimize"
      />

      {/* Close button */}
      <button className="close-btn" onClick={handleReset} aria-label="Close" />

      <div className="timer-content">
        {/* Chain progress indicator */}
        {chainLabel && (
          <div className="chain-progress-label">{chainLabel}</div>
        )}

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
          <button
            className={`wallpaper-toggle-btn${wallpaperEnabled ? ' active' : ''}`}
            onClick={handleToggleWallpaper}
            aria-label="Toggle desktop wallpaper"
          >
            {wallpaperEnabled ? 'Desktop: ON' : 'Desktop: OFF'}
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
                {isChainMode && currentChainIndex + 1 < sessionChain.length
                  ? `Time to rest for ${breakDuration} minute${breakDuration !== 1 ? 's' : ''}. Next focus session follows.`
                  : `Time to rest for ${breakDuration} minute${breakDuration !== 1 ? 's' : ''}.`
                }
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
