import React, { useState } from 'react'
import type { AppSettings } from '@shared/types'

interface Props {
  settings: AppSettings
  onUpdate: (patch: Partial<AppSettings>) => void
}

function isValidDomain(domain: string): boolean {
  return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(
    domain.trim()
  )
}

export function WebsiteBlockerTab({ settings, onUpdate }: Props): React.ReactElement {
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')

  const toggleBlocker = (): void => {
    onUpdate({ blockerEnabled: !settings.blockerEnabled })
  }

  const addDomain = (): void => {
    const domain = inputValue.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '')
    if (!isValidDomain(domain)) {
      setInputError('Enter a valid domain (e.g. example.com)')
      return
    }
    if (settings.blockedDomains.includes(domain)) {
      setInputError('Domain already in list')
      return
    }
    onUpdate({ blockedDomains: [...settings.blockedDomains, domain] })
    setInputValue('')
    setInputError('')
  }

  const removeDomain = (domain: string): void => {
    onUpdate({ blockedDomains: settings.blockedDomains.filter((d) => d !== domain) })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') addDomain()
  }

  return (
    <div className="blocker-tab">
      <div className="blocker-toggle-row">
        <span className="blocker-toggle-label">Block distracting websites during Focus</span>
        <button
          className={`toggle-switch ${settings.blockerEnabled ? 'on' : 'off'}`}
          onClick={toggleBlocker}
          aria-pressed={settings.blockerEnabled}
          aria-label="Toggle website blocker"
        >
          <span className="toggle-knob" />
        </button>
      </div>

      {settings.blockerEnabled && (
        <>
          <p className="blocker-note">
            Requires administrator permission. Editing the system hosts file.
          </p>

          <div className="domain-input-row">
            <input
              className="domain-input"
              type="text"
              placeholder="e.g. example.com"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setInputError('')
              }}
              onKeyDown={handleKeyDown}
            />
            <button className="add-domain-btn" onClick={addDomain}>
              Add
            </button>
          </div>
          {inputError && <p className="input-error">{inputError}</p>}

          <ul className="domain-list">
            {settings.blockedDomains.map((domain) => (
              <li key={domain} className="domain-item">
                <span className="domain-name">{domain}</span>
                <button
                  className="remove-domain-btn"
                  onClick={() => removeDomain(domain)}
                  aria-label={`Remove ${domain}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
