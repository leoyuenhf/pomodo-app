import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execSync, exec } from 'child_process'
import { app } from 'electron'
import sudo from 'sudo-prompt'
import { store } from './store'

const HOSTS_PATH = 'C:\\Windows\\System32\\drivers\\etc\\hosts'
const MARKER_START = '# --- pomodoro-app-block-start ---'
const MARKER_END = '# --- pomodoro-app-block-end ---'

function getBackupPath(): string {
  return path.join(app.getPath('userData'), 'hosts.backup')
}

function flushDns(): void {
  try {
    execSync('ipconfig /flushdns', { stdio: 'ignore' })
  } catch {
    // best-effort
  }
}

function runElevated(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    sudo.exec(command, { name: 'Pomodoro Timer' }, (error) => {
      if (error) reject(error)
      else resolve()
    })
  })
}

export async function blockSites(domains: string[]): Promise<void> {
  // Backup original hosts file
  const backupPath = getBackupPath()
  const original = fs.readFileSync(HOSTS_PATH, 'utf8')
  fs.writeFileSync(backupPath, original, 'utf8')

  // Build new hosts content with our entries appended
  const entries = domains
    .flatMap((d) => [`127.0.0.1 ${d}`, `127.0.0.1 www.${d}`])
    .join('\n')
  const newContent = `${original}\n${MARKER_START}\n${entries}\n${MARKER_END}\n`

  // Write to a temp file, then copy elevated
  const tempFile = path.join(os.tmpdir(), `hosts_pomodoro_${Date.now()}.txt`)
  fs.writeFileSync(tempFile, newContent, 'utf8')

  try {
    await runElevated(`copy /y "${tempFile}" "${HOSTS_PATH}"`)
    store.set('blockingActive', true)
    flushDns()
  } finally {
    try { fs.unlinkSync(tempFile) } catch { /* ignore */ }
  }
}

export async function unblockSites(): Promise<void> {
  const backupPath = getBackupPath()

  if (fs.existsSync(backupPath)) {
    const tempFile = path.join(os.tmpdir(), `hosts_restore_${Date.now()}.txt`)
    fs.copyFileSync(backupPath, tempFile)
    try {
      await runElevated(`copy /y "${tempFile}" "${HOSTS_PATH}"`)
    } finally {
      try { fs.unlinkSync(tempFile) } catch { /* ignore */ }
    }
  } else {
    // Fallback: strip our markers from the current hosts file
    const current = fs.readFileSync(HOSTS_PATH, 'utf8')
    const stripped = stripMarkers(current)
    const tempFile = path.join(os.tmpdir(), `hosts_stripped_${Date.now()}.txt`)
    fs.writeFileSync(tempFile, stripped, 'utf8')
    try {
      await runElevated(`copy /y "${tempFile}" "${HOSTS_PATH}"`)
    } finally {
      try { fs.unlinkSync(tempFile) } catch { /* ignore */ }
    }
  }

  store.set('blockingActive', false)
  flushDns()
}

function stripMarkers(content: string): string {
  const startIdx = content.indexOf(MARKER_START)
  const endIdx = content.indexOf(MARKER_END)
  if (startIdx === -1 || endIdx === -1) return content
  return content.slice(0, startIdx).trimEnd() + '\n'
}

/** Called on app startup. Returns true if recovery was needed. */
export async function crashRecovery(): Promise<boolean> {
  if (!store.get('blockingActive')) return false
  try {
    await unblockSites()
  } catch {
    // If unblock fails on startup, just clear the flag to avoid infinite loops
    store.set('blockingActive', false)
  }
  return true
}
