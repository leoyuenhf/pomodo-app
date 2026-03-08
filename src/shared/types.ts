// IPC channel name constants — imported by both main and renderer
export const IPC = {
  GET_SETTINGS: 'get-settings',
  SAVE_SETTINGS: 'save-settings',
  BLOCK_SITES: 'block-sites',
  UNBLOCK_SITES: 'unblock-sites',
  SET_TITLE: 'set-title',
  ON_RECOVERY: 'on-recovery',
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

export interface ElectronAPI {
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: Partial<AppSettings>) => Promise<void>
  blockSites: (domains: string[]) => Promise<{ ok: boolean; error?: string }>
  unblockSites: () => Promise<void>
  setTitle: (title: string) => void
  onRecovery: (callback: () => void) => () => void
}
