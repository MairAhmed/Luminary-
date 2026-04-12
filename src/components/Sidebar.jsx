import { useState } from 'react'
import { storage } from '../lib/storage.js'

const FAITH_LABELS = {
  islam: '☪️ Islam', christianity: '✝️ Christianity', judaism: '✡️ Judaism',
  hinduism: '🕉️ Hinduism', buddhism: '☸️ Buddhism', spiritual: '✨ Spiritual',
}

const MOOD_COLORS = {
  '🌟': '#d4a017', '😊': '#5a7a5a', '😌': '#7a8a9a',
  '😔': '#6a7a8a', '😤': '#8b3a2a', '😰': '#7a5a8a',
}

export default function Sidebar({ user, entries, currentId, apiKey, faith, onNewEntry, onSelectEntry, onApiKeySave, onSignOut, onFaithClick }) {
  const [keyInput, setKeyInput] = useState('')
  const [keyVisible, setKeyVisible] = useState(false)

  function handleSaveKey() {
    if (!keyInput.trim() || keyInput.startsWith('•')) return
    if (!keyInput.startsWith('sk-ant-')) {
      alert('Key should start with sk-ant-')
      return
    }
    onApiKeySave(keyInput.trim())
    setKeyInput('')
  }

  function formatDate(entry) {
    const ts = parseInt(entry.id)
    const d = isNaN(ts) ? new Date(entry.savedAt || Date.now()) : new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">✦</div>
          Luminary
        </div>
        <div className="logo-sub">Smart Journal</div>
      </div>

      {user && (
        <>
          <div className="user-profile">
            <div className="user-avatar">{user.name[0].toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
              {faith && FAITH_LABELS[faith] && (
                <div className="faith-badge" onClick={onFaithClick} title="Change faith preference">
                  {FAITH_LABELS[faith]}
                </div>
              )}
            </div>
            <button className="signout-btn" onClick={onSignOut} title="Sign out">↩</button>
          </div>

          <div className={`api-key-section${apiKey ? '' : ' missing'}`}>
            <div className="api-key-label">
              <span>Anthropic API Key</span>
              <span>{apiKey ? '✅' : '❌'}</span>
            </div>
            <div className="api-key-row">
              <input
                className="api-key-input"
                type={keyVisible ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
              />
              <button className="api-key-save" onClick={handleSaveKey}>Save</button>
            </div>
          </div>
        </>
      )}

      <button className="new-entry-btn" onClick={onNewEntry}>+ New Entry</button>

      <div className="nav-label">Past Entries</div>
      <div className="entry-list">
        {entries.length === 0 && (
          <div style={{ padding: '16px', fontFamily: 'Lora,serif', fontSize: 12, color: '#3a2a1a', fontStyle: 'italic' }}>
            No entries yet…
          </div>
        )}
        {entries.map(e => (
          <div
            key={e.id}
            className={`entry-item${e.id === currentId ? ' active' : ''}`}
            onClick={() => onSelectEntry(e.id)}
          >
            <div className="entry-item-date">
              {e.mood && <span className="mood-dot" style={{ background: MOOD_COLORS[e.mood] || '#5a4a35' }} />}
              {formatDate(e)}
            </div>
            <div className="entry-item-preview">{e.title || (e.body || '').substring(0, 50)}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}
