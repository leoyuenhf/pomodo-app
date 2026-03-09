import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { execSync } from 'child_process'
import { app } from 'electron'
import sudo from 'sudo-prompt'
import { resolve4 } from 'dns/promises'
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

async function resolveIPs(domain: string): Promise<string[]> {
  try {
    const ips = await resolve4(domain)
    return ips
  } catch {
    // best-effort; hosts file still works for new connections
    return []
  }
}

async function addFirewallRule(domain: string, ips: string[]): Promise<void> {
  if (ips.length === 0) return
  const remoteip = ips.join(',')
  const name = `PomodoroBlock_${domain}`
  const command = `netsh advfirewall firewall add rule name="${name}" dir=out action=block remoteip=${remoteip}`
  try {
    execSync(command, { stdio: 'ignore' })
  } catch {
    // In dev mode, fall back to sudo-prompt
    try {
      await runElevated(command)
    } catch {
      // best-effort; hosts file still works
    }
  }
}

async function removeFirewallRule(domain: string): Promise<void> {
  const name = `PomodoroBlock_${domain}`
  const command = `netsh advfirewall firewall delete rule name="${name}"`
  try {
    execSync(command, { stdio: 'ignore' })
  } catch {
    // In dev mode, fall back to sudo-prompt
    try {
      await runElevated(command)
    } catch {
      // best-effort
    }
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

/** Write content to the hosts file. In production (requireAdministrator manifest) this
 *  succeeds directly. In dev mode (no manifest) it falls back to sudo-prompt. */
async function writeHostsFile(content: string): Promise<void> {
  try {
    fs.writeFileSync(HOSTS_PATH, content, 'utf8')
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === 'EACCES' || code === 'EPERM') {
      // Dev mode fallback: elevate via sudo-prompt
      const tempFile = path.join(os.tmpdir(), `hosts_pomodoro_${Date.now()}.txt`)
      fs.writeFileSync(tempFile, content, 'utf8')
      try {
        await runElevated(`copy /y "${tempFile}" "${HOSTS_PATH}"`)
      } finally {
        try { fs.unlinkSync(tempFile) } catch { /* ignore */ }
      }
    } else {
      throw err
    }
  }
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

  await writeHostsFile(newContent)

  // Resolve IPs and add Windows Firewall rules to break existing browser connections
  for (const domain of domains) {
    const ips = await resolveIPs(domain)
    await addFirewallRule(domain, ips)
  }

  store.set('blockingActive', true)
  flushDns()
}

export async function unblockSites(): Promise<void> {
  const backupPath = getBackupPath()

  if (fs.existsSync(backupPath)) {
    const backup = fs.readFileSync(backupPath, 'utf8')
    await writeHostsFile(backup)
  } else {
    // Fallback: strip our markers from the current hosts file
    const current = fs.readFileSync(HOSTS_PATH, 'utf8')
    await writeHostsFile(stripMarkers(current))
  }

  // Remove Windows Firewall rules for all blocked domains
  const blockedDomains = store.get('blockedDomains') as string[]
  if (Array.isArray(blockedDomains)) {
    for (const domain of blockedDomains) {
      await removeFirewallRule(domain)
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
    // If unblock fails on startup, clear the flag and try to clean up firewall rules
    store.set('blockingActive', false)
    const blockedDomains = store.get('blockedDomains') as string[]
    if (Array.isArray(blockedDomains)) {
      for (const domain of blockedDomains) {
        await removeFirewallRule(domain)
      }
    }
  }
  return true
}
