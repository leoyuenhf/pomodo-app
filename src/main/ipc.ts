import { ipcMain, BrowserWindow } from 'electron'
import { IPC } from '@shared/types'
import { getSettings, saveSettings } from './store'
import { blockSites, unblockSites } from './blocker'

export function registerIpcHandlers(win: BrowserWindow): void {
  ipcMain.handle(IPC.GET_SETTINGS, () => getSettings())

  ipcMain.handle(IPC.SAVE_SETTINGS, (_event, settings) => {
    saveSettings(settings)
  })

  ipcMain.handle(IPC.BLOCK_SITES, async (_event, domains: string[]) => {
    try {
      await blockSites(domains)
      return { ok: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return { ok: false, error: message }
    }
  })

  ipcMain.handle(IPC.UNBLOCK_SITES, async () => {
    await unblockSites()
  })

  ipcMain.on(IPC.SET_TITLE, (_event, title: string) => {
    win.setTitle(title)
  })

  ipcMain.on(IPC.TOGGLE_FULLSCREEN, () => {
    win.setFullScreen(!win.isFullScreen())
  })
}
