import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { crashRecovery, unblockSites } from './blocker'
import { store } from './store'
import { registerIpcHandlers } from './ipc'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 960,
    minHeight: 640,
    resizable: true,
    frame: false,
    backgroundColor: '#FAF5F2',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Enforce minimum window size after load
  mainWindow.webContents.once('did-finish-load', () => {
    const [w, h] = mainWindow!.getSize()
    if (w < 960 || h < 640) {
      mainWindow!.setSize(960, 640)
    }
  })

  registerIpcHandlers(mainWindow)
}

app.whenReady().then(async () => {
  const needed = await crashRecovery()

  createWindow()

  if (needed && mainWindow) {
    // Send recovery notification once renderer is ready
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow?.webContents.send('on-recovery')
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', (event) => {
  if (isQuitting) return
  if (store.get('blockingActive')) {
    event.preventDefault()
    isQuitting = true
    unblockSites()
      .catch(() => store.set('blockingActive', false))
      .finally(() => app.quit())
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
