// IPC channel name constants — imported by both main and renderer
export const IPC = {
  GET_SETTINGS: 'get-settings',
  SAVE_SETTINGS: 'save-settings',
  BLOCK_SITES: 'block-sites',
  UNBLOCK_SITES: 'unblock-sites',
  SET_TITLE: 'set-title',
  ON_RECOVERY: 'on-recovery',
  TOGGLE_FULLSCREEN: 'toggle-fullscreen',
  WALLPAPER_ENABLE: 'wallpaper-enable',
  WALLPAPER_DISABLE: 'wallpaper-disable',
  WALLPAPER_TICK: 'wallpaper-tick',
  TIMER_COMPLETE: 'timer-complete',
  MINIMIZE: 'minimize',
} as const

export type Theme = 'basic' | 'tomato'
export type SessionMode = 'focus' | 'break'

export interface AppSettings {
  focusDuration: number    // minutes, 1–120
  breakDuration: number    // minutes, 1–120
  theme: Theme
  blockerEnabled: boolean
  blockedDomains: string[]
}

export interface ChainSession {
  focusDuration: number  // minutes
  restDuration: number   // minutes
}

export interface ElectronAPI {
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>
  blockSites: (domains: string[]) => Promise<{ ok: boolean; error?: string }>
  unblockSites: () => Promise<void>
  setTitle: (title: string) => void
  onRecovery: (callback: () => void) => () => void
  toggleFullscreen: () => void
  timerComplete: () => void
  enableWallpaper: () => Promise<void>
  disableWallpaper: () => Promise<void>
  wallpaperTick: (time: string, mode: SessionMode) => void
  minimize: () => void
}
