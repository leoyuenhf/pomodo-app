import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSettings } from './hooks/useSettings'
import { LandingPage } from './pages/LandingPage'
import { TimerPage } from './pages/TimerPage'
import type { ChainSession } from '@shared/types'

type Page = 'landing' | 'timer'

const MAX_CHAIN = 10

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export default function App(): React.ReactElement {
  const { settings, updateSettings, loaded } = useSettings()
  const [page, setPage] = useState<Page>('landing')
  const [showToast, setShowToast] = useState(false)
  const [sessionChain, setSessionChain] = useState<ChainSession[]>([])

  // Crash recovery toast
  useEffect(() => {
    const remove = window.api.onRecovery(() => {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
    })
    return remove
  }, [])

  const handleAddToChain = (session: ChainSession): void => {
    setSessionChain((prev) => prev.length < MAX_CHAIN ? [...prev, session] : prev)
  }

  const handleClearChain = (): void => {
    setSessionChain([])
  }

  const handleStart = (): void => {
    setPage('timer')
  }

  const handleBack = (): void => {
    setPage('landing')
    setSessionChain([])
  }

  if (!loaded) {
    return <div className="loading" />
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {page === 'landing' ? (
          <motion.div
            key="landing"
            {...pageVariants}
            transition={{ duration: 0.3 }}
            style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <LandingPage
              settings={settings}
              onUpdate={updateSettings}
              onStart={handleStart}
              sessionChain={sessionChain}
              onAddToChain={handleAddToChain}
              onClearChain={handleClearChain}
            />
          </motion.div>
        ) : (
          <motion.div
            key="timer"
            {...pageVariants}
            transition={{ duration: 0.3 }}
            style={{ width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <TimerPage
              settings={settings}
              onBack={handleBack}
              sessionChain={sessionChain}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recovery toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
          >
            Website blocker was cleaned up after unexpected shutdown.
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
