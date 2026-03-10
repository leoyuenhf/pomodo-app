import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/types'
import type { ElectronAPI, AppSettings, SessionMode } from '@shared/types'

const api: ElectronAPI = {
  getSettings: () => ipcRenderer.invoke(IPC.GET_SETTINGS),

  saveSettings: (settings: Partial<AppSettings>) =>
    ipcRenderer.invoke(IPC.SAVE_SETTINGS, settings),

  blockSites: (domains: string[]) =>
    ipcRenderer.invoke(IPC.BLOCK_SITES, domains),

  unblockSites: () => ipcRenderer.invoke(IPC.UNBLOCK_SITES),

  setTitle: (title: string) => ipcRenderer.send(IPC.SET_TITLE, title),

  onRecovery: (callback: () => void) => {
    const handler = (): void => callback()
    ipcRenderer.on(IPC.ON_RECOVERY, handler)
    return () => ipcRenderer.removeListener(IPC.ON_RECOVERY, handler)
  },

  toggleFullscreen: () => ipcRenderer.send(IPC.TOGGLE_FULLSCREEN),

  timerComplete: () => ipcRenderer.send(IPC.TIMER_COMPLETE),

  enableWallpaper: () => ipcRenderer.invoke(IPC.WALLPAPER_ENABLE),

  disableWallpaper: () => ipcRenderer.invoke(IPC.WALLPAPER_DISABLE),

  wallpaperTick: (time: string, mode: SessionMode) =>
    ipcRenderer.send(IPC.WALLPAPER_TICK, time, mode),

  minimize: () => ipcRenderer.send(IPC.MINIMIZE),
}

contextBridge.exposeInMainWorld('api', api)
