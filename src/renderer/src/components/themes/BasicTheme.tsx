import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { SessionMode } from '@shared/types'

interface Props {
  fillRatio: number       // 1.0 (full) → 0.0 (empty)
  sessionMode: SessionMode
  remaining: number       // ms
}

const SIZE = 280
const STROKE = 12
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const MODE_COLORS: Record<SessionMode, string> = {
  focus: '#c5584a',
  break: '#8fb888',
}

export function BasicTheme({ fillRatio, sessionMode, remaining }: Props): React.ReactElement {
  const color = MODE_COLORS[sessionMode]
  const dashOffset = CIRCUMFERENCE * (1 - fillRatio)

  return (
    <div className="basic-theme">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {/* Track ring */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeOpacity={0.15}
          strokeWidth={STROKE}
        />
        {/* Progress ring */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease' }}
        />
      </svg>

      {/* Centered time text */}
      <div className="basic-theme-text">
        <AnimatePresence mode="wait">
          <motion.span
            key={sessionMode}
            className="basic-theme-mode"
            style={{ color }}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
          >
            {sessionMode === 'focus' ? 'FOCUS' : 'REST'}
          </motion.span>
        </AnimatePresence>
        <span className="basic-theme-time">{formatTime(remaining)}</span>
      </div>
    </div>
  )
}
