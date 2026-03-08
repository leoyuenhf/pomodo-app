import React, { useState } from 'react'
import { motion } from 'framer-motion'
import type { AppSettings } from '@shared/types'
import { SessionTab } from '../components/tabs/SessionTab'
import { ThemeTab } from '../components/tabs/ThemeTab'
import { WebsiteBlockerTab } from '../components/tabs/WebsiteBlockerTab'

type Tab = 'session' | 'theme' | 'blocker'

interface Props {
  settings: AppSettings
  onUpdate: (patch: Partial<AppSettings>) => void
  onStart: () => void
}

export function LandingPage({ settings, onUpdate, onStart }: Props): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>('session')

  return (
    <div className="landing-page">
      {/* Draggable titlebar area */}
      <div className="titlebar" />

      {/* Red dot close button */}
      <button
        className="close-btn"
        onClick={() => window.close()}
        aria-label="Close"
      />

      <div className="landing-content">
        {/* Header */}
        <h1 className="landing-title">
          Welcome back to{' '}
          <span className="landing-title-accent"><strong>Pomodoro</strong></span>.
        </h1>

        {/* Tab bar */}
        <nav className="tab-bar">
          {(['session', 'theme', 'blocker'] as Tab[]).map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'session' ? 'Session' : tab === 'theme' ? 'Theme' : 'Website Blocker'}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="tab-content">
          {activeTab === 'session' && (
            <SessionTab settings={settings} onUpdate={onUpdate} />
          )}
          {activeTab === 'theme' && (
            <ThemeTab settings={settings} onUpdate={onUpdate} />
          )}
          {activeTab === 'blocker' && (
            <WebsiteBlockerTab settings={settings} onUpdate={onUpdate} />
          )}
        </div>
      </div>

      {/* Start button */}
      <button className="start-btn" onClick={onStart}>
        Start
      </button>
    </div>
  )
}
