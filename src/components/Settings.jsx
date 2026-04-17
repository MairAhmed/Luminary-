import { useState } from 'react'

export default function Settings({ settings, onSave, onClose }) {
  const [local, setLocal] = useState(settings)

  function set(k, v) { setLocal({ ...local, [k]: v }) }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} role="dialog" aria-labelledby="settings-title">
        <div className="modal-header">
          <h2 id="settings-title" className="modal-title">Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close settings">×</button>
        </div>
        <div className="modal-body">

          <SettingGroup label="Theme">
            <div className="seg-group" role="radiogroup" aria-label="Theme">
              {['dark', 'light'].map(t => (
                <button
                  key={t}
                  role="radio"
                  aria-checked={local.theme === t}
                  className={`seg-btn${local.theme === t ? ' active' : ''}`}
                  onClick={() => set('theme', t)}
                >{t}</button>
              ))}
            </div>
          </SettingGroup>

          <SettingGroup label="Font">
            <div className="seg-group" role="radiogroup" aria-label="Font">
              {['serif', 'sans'].map(f => (
                <button
                  key={f}
                  role="radio"
                  aria-checked={local.font === f}
                  className={`seg-btn${local.font === f ? ' active' : ''}`}
                  onClick={() => set('font', f)}
                >{f}</button>
              ))}
            </div>
          </SettingGroup>

          <SettingGroup label="Font Size">
            <div className="seg-group" role="radiogroup" aria-label="Font size">
              {['small', 'medium', 'large'].map(s => (
                <button
                  key={s}
                  role="radio"
                  aria-checked={local.fontSize === s}
                  className={`seg-btn${local.fontSize === s ? ' active' : ''}`}
                  onClick={() => set('fontSize', s)}
                >{s}</button>
              ))}
            </div>
          </SettingGroup>

          <SettingGroup label="Word Goal">
            <input
              type="number"
              className="setting-input"
              value={local.wordGoal}
              min={0}
              max={5000}
              onChange={e => set('wordGoal', Math.max(0, parseInt(e.target.value) || 0))}
              aria-label="Word goal per entry"
            />
            <div className="setting-help">A gentle target for each entry (0 to disable)</div>
          </SettingGroup>

          <SettingGroup label="Reduced Motion">
            <Toggle
              checked={local.reducedMotion}
              onChange={v => set('reducedMotion', v)}
              label={local.reducedMotion ? 'On — animations disabled' : 'Off'}
            />
          </SettingGroup>

          <SettingGroup label="Ambient Sound (Landing)">
            <Toggle
              checked={local.soundOn}
              onChange={v => set('soundOn', v)}
              label={local.soundOn ? 'On' : 'Off'}
            />
          </SettingGroup>

          <SettingGroup label="Developer Debug Info">
            <Toggle
              checked={local.showDebug}
              onChange={v => set('showDebug', v)}
              label={local.showDebug ? 'Show tool-call badges' : 'Hide technical details'}
            />
          </SettingGroup>

        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={() => onSave(local)}>Save</button>
        </div>
      </div>
    </div>
  )
}

function SettingGroup({ label, children }) {
  return (
    <div className="setting-group">
      <div className="setting-label">{label}</div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={`toggle${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-track"><span className="toggle-thumb" /></span>
      <span className="toggle-label">{label}</span>
    </button>
  )
}

// Confirm modal (used for destructive actions)
export function ConfirmModal({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal modal-sm" onClick={e => e.stopPropagation()} role="alertdialog">
        <div className="modal-body">
          <h3 className="confirm-title">{title}</h3>
          {message && <p className="confirm-message">{message}</p>}
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className={danger ? 'btn-danger' : 'btn-save'} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}
