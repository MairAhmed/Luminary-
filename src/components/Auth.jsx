import { useState } from 'react'

export function Login({ onLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  function handleSubmit() {
    if (!name.trim()) return
    const id = 'user_' + btoa(name.toLowerCase().replace(/\s+/g, '_')).replace(/=/g, '')
    onLogin({ id, name: name.trim(), email: email.trim() || name.toLowerCase().replace(/\s+/g, '_') + '@luminary.local' })
  }

  return (
    <div className="auth-overlay">
      <div className="auth-box">
        <div className="auth-logo">Luminary<em>✦</em></div>
        <span className="auth-ornament">✦ ✦ ✦</span>
        <p className="auth-tagline">Your private space to write, reflect,<br />and understand yourself better.</p>
        <input
          className="auth-input"
          type="text"
          placeholder="What should we call you?"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          autoFocus
          maxLength={40}
        />
        <input
          className="auth-input"
          type="email"
          placeholder="Your email (optional)"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          maxLength={80}
        />
        <button className="auth-btn" onClick={handleSubmit}>Begin Journaling →</button>
        <p className="auth-privacy">🔒 Everything stays on your device — no account needed</p>
      </div>
    </div>
  )
}

const FAITHS = [
  { id: 'islam',        icon: '☪️',  label: 'Islam' },
  { id: 'christianity', icon: '✝️',  label: 'Christianity' },
  { id: 'judaism',      icon: '✡️',  label: 'Judaism' },
  { id: 'hinduism',     icon: '🕉️', label: 'Hinduism' },
  { id: 'buddhism',     icon: '☸️',  label: 'Buddhism' },
  { id: 'secular',      icon: '🌿',  label: 'Secular / None' },
  { id: 'spiritual',    icon: '✨',  label: 'Spiritual' },
  { id: 'other',        icon: '🌍',  label: 'Other' },
]

export function FaithOnboarding({ onSave }) {
  const [selected, setSelected] = useState('')

  return (
    <div className="auth-overlay">
      <div className="auth-box" style={{ maxWidth: 520 }}>
        <div className="auth-logo" style={{ marginBottom: 8 }}>One more thing…</div>
        <p className="auth-tagline">Your AI companion can reflect through the lens of your faith. Optional — change anytime.</p>
        <div className="faith-grid">
          {FAITHS.map(f => (
            <div
              key={f.id}
              className={`faith-option${selected === f.id ? ' selected' : ''}`}
              onClick={() => setSelected(f.id)}
            >
              <span className="faith-icon">{f.icon}</span>
              <span className="faith-label">{f.label}</span>
            </div>
          ))}
        </div>
        <button className="auth-btn" onClick={() => onSave(selected || 'secular')}>Continue to My Journal →</button>
        <button className="faith-skip" onClick={() => onSave('secular')}>Skip — keep reflections universal</button>
      </div>
    </div>
  )
}
