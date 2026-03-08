# CLAUDE.md — Pomodoro App

## Stack
Electron (latest) + React 18 + TypeScript strict + electron-vite · electron-store · Framer Motion · electron-builder (NSIS `.exe`) · Windows 10/11 x64 only.

## Process Boundary — Never Violate
| Process | Owns |
|---|---|
| **Main** | Hosts file, UAC (`sudo-prompt` pkg), electron-store, IPC handlers, auto-update |
| **Renderer** | React UI, timer countdown, theme animation |
| **Preload** | Typed `contextBridge` bridge only |

`contextIsolation: true`, `nodeIntegration: false`. Renderer never touches Node.js directly.

## IPC
All channel names are `const` in `shared/types.ts`, imported by both processes. All payloads fully typed — no `any`.

## Timer
- Modes: **Focus** (default 25 min) · **Short Break** (default 5 min) · range 1–120 min
- Controls: Start / Pause / Resume / Reset / Skip
- Runs in renderer via `setInterval` with drift correction
- Exposes `fillRatio: 1.0 → 0.0` consumed by all theme animations

## Website Blocker
Hosts file: `C:\Windows\System32\drivers\etc\hosts`

**On block:** backup hosts → set `blockingActive: true` in store → append `127.0.0.1 <domain>` entries → `ipconfig /flushdns`

**On unblock:** restore hosts from backup → `ipconfig /flushdns` → clear `blockingActive` flag

**On every startup (before window creation):** if `blockingActive` is set, restore hosts file, clear flag, show recovery toast.

UAC via `sudo-prompt` pkg — prompt on first blocker use per session. If denied, disable blocker gracefully.

## Data (electron-store, main process only)
`focusDuration` · `breakDuration` · `theme` · `blockerEnabled` · `blockedDomains: string[]` · `blockingActive` (crash sentinel)

All stored in `%APPDATA%\pomodoro-app\config.json`. Schema-validate on load; reset to defaults on invalid.

## Themes
| ID | Style |
|---|---|
| `basic` | SVG `stroke-dashoffset` ring, color shifts per mode |
| `tomato` | Skeuomorphic tomato SVG, same `fillRatio` prop |

Theme transitions: Framer Motion fade ~300ms.

## Commands
```bash
npm run dev          # electron-vite dev + HMR
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm run build:win    # electron-builder --win --x64
```

## Conventions
- No `any`. No business logic in JSX — use hooks.
- electron-store accessed **only** from main process.
- `PascalCase.tsx` · `useCamelCase.ts` · `camelCase.ts`

## Hard Constraints
- Zero telemetry.
- Hosts file must never stay blocked across a crash.
