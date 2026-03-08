import React from 'react'
import { motion } from 'framer-motion'
import type { SessionMode } from '@shared/types'

interface Props {
  fillRatio: number
  sessionMode: SessionMode
  remaining: number
  isComplete: boolean
}

const SIZE = 300
const CX = SIZE / 2
const CY = SIZE / 2 + 10  // slight downward shift for tomato body center

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Returns SVG arc path for the depleted slice (elapsed portion). */
function arcPath(elapsed: number): string {
  if (elapsed <= 0) return ''
  if (elapsed >= 1) {
    // Full circle as two arcs
    const r = 90
    return `M ${CX} ${CY - r} A ${r} ${r} 0 1 1 ${CX - 0.01} ${CY - r} Z`
  }
  const angle = elapsed * 2 * Math.PI
  const r = 90
  const startX = CX
  const startY = CY - r
  const endX = CX + r * Math.sin(angle)
  const endY = CY - r * Math.cos(angle)
  const large = elapsed > 0.5 ? 1 : 0
  return `M ${CX} ${CY} L ${startX} ${startY} A ${r} ${r} 0 ${large} 1 ${endX} ${endY} Z`
}

export function TomatoTheme({
  fillRatio,
  sessionMode,
  remaining,
  isComplete,
}: Props): React.ReactElement {
  const elapsed = 1 - fillRatio
  const depletedPath = arcPath(elapsed)

  return (
    <motion.div
      className="tomato-theme"
      animate={isComplete ? { rotate: [0, -5, 5, -4, 4, -2, 2, 0] } : {}}
      transition={{ duration: 0.6 }}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Tomato body */}
        <circle cx={CX} cy={CY} r={90} fill="#c5584a" />

        {/* Lighter tomato highlight */}
        <ellipse cx={CX - 22} cy={CY - 28} rx={22} ry={16} fill="#d97060" opacity={0.5} />

        {/* Stem */}
        <rect x={CX - 4} y={CY - 100} width={8} height={22} rx={4} fill="#4a7a3a" />

        {/* Leaves */}
        <g fill="#5a9448">
          <ellipse cx={CX - 14} cy={CY - 96} rx={14} ry={7} transform={`rotate(-30 ${CX - 14} ${CY - 96})`} />
          <ellipse cx={CX + 14} cy={CY - 96} rx={14} ry={7} transform={`rotate(30 ${CX + 14} ${CY - 96})`} />
          <ellipse cx={CX} cy={CY - 100} rx={8} ry={12} />
        </g>

        {/* Depleted overlay (shadow as time passes) */}
        {depletedPath && (
          <path d={depletedPath} fill="rgba(0,0,0,0.35)" clipPath="url(#tomato-clip)" />
        )}

        {/* Clip to tomato circle */}
        <defs>
          <clipPath id="tomato-clip">
            <circle cx={CX} cy={CY} r={90} />
          </clipPath>
        </defs>

        {/* Outer ring track */}
        <circle cx={CX} cy={CY} r={90} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={3} />
      </svg>

      {/* Time overlay */}
      <div className="tomato-theme-text">
        <span className="tomato-theme-mode">
          {sessionMode === 'focus' ? 'FOCUS' : 'REST'}
        </span>
        <span className="tomato-theme-time">{formatTime(remaining)}</span>
      </div>
    </motion.div>
  )
}
