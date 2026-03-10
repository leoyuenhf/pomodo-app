import Store from 'electron-store'
import type { AppSettings, Theme } from '@shared/types'

interface StoreSchema extends AppSettings {
  blockingActive: boolean
  wallpaperActive: boolean
  originalWallpaperPath: string
}

const DEFAULT_DOMAINS = [
  'facebook.com', 'www.facebook.com',
  'instagram.com', 'www.instagram.com',
  'twitter.com', 'www.twitter.com',
  'x.com', 'www.x.com',
  'reddit.com', 'www.reddit.com',
  'youtube.com', 'www.youtube.com',
  'netflix.com', 'www.netflix.com',
  'tiktok.com', 'www.tiktok.com',
]

const defaults: StoreSchema = {
  focusDuration: 25,
  breakDuration: 5,
  theme: 'basic' as Theme,
  blockerEnabled: false,
  blockedDomains: DEFAULT_DOMAINS,
  blockingActive: false,
  wallpaperActive: false,
  originalWallpaperPath: '',
}

export const store = new Store<StoreSchema>({
  defaults,
  clearInvalidConfig: true,
})

export function getSettings(): AppSettings {
  return {
    focusDuration: store.get('focusDuration'),
    breakDuration: store.get('breakDuration'),
    theme: store.get('theme'),
    blockerEnabled: store.get('blockerEnabled'),
    blockedDomains: store.get('blockedDomains'),
  }
}

export function saveSettings(settings: Partial<AppSettings>): void {
  const keys = Object.keys(settings) as (keyof AppSettings)[]
  for (const key of keys) {
    const val = settings[key]
    if (val !== undefined) {
      store.set(key, val as StoreSchema[typeof key])
    }
  }
}
