import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSettings } from './hooks/useSettings'
import { LandingPage } from './pages/LandingPage'
import { TimerPage } from './pages/TimerPage'

type Page = 'landing' | 'timer'

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export default function App(): React.ReactElement {
  const { settings, updateSettings, loaded } = useSettings()
  const [page, setPage] = useState<Page>('landing')
  const [showToast, setShowToast] = useState(false)

  // Crash recovery toast
  useEffect(() => {
    const remove = window.api.onRecovery(() => {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 4000)
    })
    return remove
  }, [])

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
            style={{ width: '100%', height: '100%' }}
          >
            <LandingPage
              settings={settings}
              onUpdate={updateSettings}
              onStart={() => setPage('timer')}
            />
          </motion.div>
        ) : (
          <motion.div
            key="timer"
            {...pageVariants}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', height: '100%' }}
          >
            <TimerPage
              settings={settings}
              onBack={() => setPage('landing')}
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
