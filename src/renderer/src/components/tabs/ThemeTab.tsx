import React from 'react'
import type { AppSettings, Theme } from '@shared/types'

interface Props {
  settings: AppSettings
  onUpdate: (patch: Partial<AppSettings>) => void
}

const THEMES: { id: Theme; label: string; description: string }[] = [
  {
    id: 'basic',
    label: 'Basic',
    description: 'Clean circular progress ring',
  },
  {
    id: 'tomato',
    label: 'Tomato Timer',
    description: 'Skeuomorphic tomato kitchen timer',
  },
]

export function ThemeTab({ settings, onUpdate }: Props): React.ReactElement {
  return (
    <div className="theme-tab">
      {THEMES.map((t) => (
        <button
          key={t.id}
          className={`theme-option ${settings.theme === t.id ? 'selected' : ''}`}
          onClick={() => onUpdate({ theme: t.id })}
        >
          <span className="theme-checkbox">
            {settings.theme === t.id && (
              <svg viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1 5L4.5 8.5L11 1.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span className="theme-label">{t.label}</span>
        </button>
      ))}
    </div>
  )
}
