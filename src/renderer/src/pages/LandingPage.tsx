import React, { useState } from 'react'
import type { AppSettings, ChainSession } from '@shared/types'
import { SessionTab } from '../components/tabs/SessionTab'
import { ThemeTab } from '../components/tabs/ThemeTab'
import { WebsiteBlockerTab } from '../components/tabs/WebsiteBlockerTab'

type Tab = 'session' | 'theme' | 'blocker'

interface Props {
  settings: AppSettings
  onUpdate: (patch: Partial<AppSettings>) => void
  onStart: () => void
  sessionChain: ChainSession[]
  onAddToChain: (session: ChainSession) => void
  onClearChain: () => void
}

export function LandingPage({ settings, onUpdate, onStart, sessionChain, onAddToChain, onClearChain }: Props): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>('session')

  const isChainFull = sessionChain.length >= 10

  return (
    <div className="landing-page">
      {/* Draggable titlebar area */}
      <div className="titlebar" />

      {/* Minimize button */}
      <button
        className="fullscreen-btn"
        onClick={() => window.api.minimize()}
        aria-label="Minimize"
      />

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
            <SessionTab
              settings={settings}
              onUpdate={onUpdate}
              sessionChain={sessionChain}
              onAddToChain={onAddToChain}
              onClearChain={onClearChain}
            />
          )}
          {activeTab === 'theme' && (
            <ThemeTab settings={settings} onUpdate={onUpdate} />
          )}
          {activeTab === 'blocker' && (
            <WebsiteBlockerTab settings={settings} onUpdate={onUpdate} />
          )}
        </div>
      </div>

      {/* Bottom button row */}
      <div className="bottom-btn-row">
        {activeTab === 'session' && (
          <button
            className="add-chain-btn"
            onClick={() => onAddToChain({ focusDuration: settings.focusDuration, restDuration: settings.breakDuration })}
            disabled={isChainFull}
          >
            {isChainFull ? 'Chain full' : 'Add to chain'}
          </button>
        )}
        <button
          className="start-btn"
          onClick={onStart}
        >
          Start
        </button>
      </div>
    </div>
  )
}
