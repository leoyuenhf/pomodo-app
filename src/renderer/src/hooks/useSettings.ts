import { useState, useEffect, useCallback } from 'react'
import type { AppSettings } from '@shared/types'

const DEFAULTS: AppSettings = {
  focusDuration: 25,
  breakDuration: 5,
  theme: 'basic',
  blockerEnabled: false,
  blockedDomains: [
    'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
    'reddit.com', 'youtube.com', 'netflix.com', 'tiktok.com',
  ],
}

export function useSettings(): {
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
  loaded: boolean
} {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    window.api.getSettings().then((s) => {
      setSettings(s)
      setLoaded(true)
    })
  }, [])

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      window.api.saveSettings(patch)
      return next
    })
  }, [])

  return { settings, updateSettings, loaded }
}
