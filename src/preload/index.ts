import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '@shared/types'
import type { ElectronAPI, AppSettings } from '@shared/types'

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
}

contextBridge.exposeInMainWorld('api', api)
