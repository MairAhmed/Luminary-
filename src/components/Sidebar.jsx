import { useMemo, useState } from 'react'

const FAITH_LABELS = {
  islam: '☪️ Islam',
  christianity: '✝️ Christianity',
  judaism: '✡️ Judaism',
  hinduism: '🕉️ Hinduism',
  buddhism: '☸️ Buddhism',
  spiritual: '✨ Spiritual',
  secular: '🌿 Secular',
  other: '🌍 Other',
}

const MOOD_COLORS = {
  '🌟': '#d4a017', '😊': '#5a7a5a', '😌': '#7a8a9a',
  '😔': '#6a7a8a', '😤': '#8b3a2a', '😰': '#7a5a8a',
}

export default function Sidebar({
  user, entries, currentId, apiKey, faith, view,
  onNewEntry, onSelectEntry, onApiKeySave, onSignOut, onFaithClick,
  onDeleteEntry, onPinEntry, onNavigate, onOpenSettings,
}) {
  const [keyInput, setKeyInput] = useState('')
  const [search, setSearch] = useState('')
  const [filterMood, setFilterMood] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  function handleSaveKey() {
    if (!keyInput.trim() || keyInput.startsWith('•')) return
    if (!keyInput.startsWith('sk-ant-')) {
      onApiKeySave({ error: 'Key should start with sk-ant-' })
      return
    }
    onApiKeySave({ key: keyInput.trim() })
    setKeyInput('')
  }

  function formatDate(entry) {
    const ts = parseInt(entry.id)
    const d = isNaN(ts) ? new Date(entry.savedAt || Date.now()) : new Date(ts)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries
      .filter(e => showArchived ? e.archived : !e.archived)
      .filter(e => !filterMood || e.mood === filterMood)
      .filter(e => {
        if (!q) return true
        const haystack = `${e.title || ''} ${e.body || ''} ${(e.tags || []).join(' ')}`.toLowerCase()
        return haystack.includes(q)
      })
      .sort((a, b) => {
        // pinned first, then newest
        if ((a.pinned ? 1 : 0) !== (b.pinned ? 1 : 0)) return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
        return (b.savedAt || parseInt(b.id) || 0) - (a.savedAt || parseInt(a.id) || 0)
      })
  }, [entries, search, filterMood, showArchived])

  const moodOptions = ['🌟', '😊', '😌', '😔', '😤', '😰']
  const faithLabel = FAITH_LABELS[faith] || null

  const navItems = [
    { id: 'editor',   label: 'Write',    icon: '✎' },
    { id: 'calendar', label: 'Calendar', icon: '◰' },
    { id: 'stats',    label: 'Stats',    icon: '◎' },
    { id: 'chat',     label: 'Ask',      icon: '✦' },
  ]

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
              {faithLabel && (
                <div className="faith-badge" onClick={onFaithClick} title="Change faith preference">
                  {faithLabel} <span className="faith-edit">✎</span>
                </div>
              )}
            </div>
            <button
              className="icon-btn"
              onClick={onOpenSettings}
              title="Settings"
              aria-label="Open settings"
            >⚙</button>
            <button
              className="signout-btn"
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
            >↩</button>
          </div>

          <div className={`api-key-section${apiKey ? '' : ' missing'}`}>
            <div className="api-key-label">
              <span>Anthropic API Key</span>
              <span aria-hidden="true">{apiKey ? '✅' : '❌'}</span>
            </div>
            <div className="api-key-row">
              <input
                className="api-key-input"
                type="password"
                placeholder={apiKey ? '••••••••' : 'sk-ant-...'}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
                aria-label="Anthropic API key"
              />
              <button className="api-key-save" onClick={handleSaveKey}>Save</button>
            </div>
          </div>
        </>
      )}

      <div className="sidebar-nav" role="tablist">
        {navItems.map(n => (
          <button
            key={n.id}
            role="tab"
            className={`sidebar-nav-btn${view === n.id ? ' active' : ''}`}
            onClick={() => onNavigate(n.id)}
            aria-selected={view === n.id}
          >
            <span className="nav-icon" aria-hidden="true">{n.icon}</span>
            <span>{n.label}</span>
          </button>
        ))}
      </div>

      <button className="new-entry-btn" onClick={onNewEntry}>+ New Entry</button>

      <div className="sidebar-search">
        <input
          className="search-input"
          type="search"
          placeholder="Search entries…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search entries"
        />
        <div className="filter-row">
          <select
            className="filter-select"
            value={filterMood}
            onChange={e => setFilterMood(e.target.value)}
            aria-label="Filter by mood"
          >
            <option value="">All moods</option>
            {moodOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button
            className={`filter-toggle${showArchived ? ' active' : ''}`}
            onClick={() => setShowArchived(a => !a)}
            title={showArchived ? 'Showing archive' : 'Showing active entries'}
          >
            {showArchived ? 'Archive' : 'Active'}
          </button>
        </div>
      </div>

      <div className="nav-label">
        {showArchived ? 'Archived' : 'Past Entries'} · {filtered.length}
      </div>
      <div className="entry-list">
        {filtered.length === 0 && (
          <div className="empty-list">
            {search ? 'No matches…' : showArchived ? 'Nothing archived yet…' : 'No entries yet…'}
          </div>
        )}
        {filtered.map(e => (
          <div
            key={e.id}
            className={`entry-item${e.id === currentId ? ' active' : ''}${e.pinned ? ' pinned' : ''}`}
            onClick={() => onSelectEntry(e.id)}
          >
            <div className="entry-item-top">
              <div className="entry-item-date">
                {e.mood && <span className="mood-dot" style={{ background: MOOD_COLORS[e.mood] || '#5a4a35' }} />}
                {formatDate(e)}
                {e.pinned && <span className="pin-icon" title="Pinned">📌</span>}
              </div>
              <div className="entry-actions" onClick={ev => ev.stopPropagation()}>
                <button
                  className="entry-action"
                  onClick={() => onPinEntry(e.id, { pinned: !e.pinned })}
                  title={e.pinned ? 'Unpin' : 'Pin'}
                  aria-label={e.pinned ? 'Unpin entry' : 'Pin entry'}
                >📌</button>
                <button
                  className="entry-action"
                  onClick={() => onPinEntry(e.id, { archived: !e.archived })}
                  title={e.archived ? 'Unarchive' : 'Archive'}
                  aria-label={e.archived ? 'Unarchive entry' : 'Archive entry'}
                >🗃</button>
                <button
                  className="entry-action danger"
                  onClick={() => onDeleteEntry(e.id)}
                  title="Delete"
                  aria-label="Delete entry"
                >✕</button>
              </div>
            </div>
            <div className="entry-item-preview">
              {e.title ? truncate(e.title, 48) : truncate(e.body || '', 48)}
            </div>
            {e.tags && e.tags.length > 0 && (
              <div className="entry-item-tags">
                {e.tags.slice(0, 3).map(t => <span key={t} className="tag-mini">#{t}</span>)}
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}

// Word-boundary safe truncate
function truncate(s, n) {
  if (!s) return ''
  if (s.length <= n) return s
  const cut = s.slice(0, n)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > n * 0.6 ? cut.slice(0, lastSpace) : cut) + '…'
}
