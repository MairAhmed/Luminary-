import { useEffect, useRef, useState } from 'react'

const SUGGESTIONS = [
  'What themes have kept coming up lately?',
  'When do I seem happiest?',
  'What am I avoiding?',
  'What pattern should I pay attention to?',
  'Summarize my emotional week in one sentence.',
]

export default function JournalChat({ apiKey, entries, history, onSend, onClear, sending, error }) {
  const [draft, setDraft] = useState('')
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, sending])

  function submit() {
    const m = draft.trim()
    if (!m || sending) return
    if (!apiKey) return
    if (entries.length === 0) return
    onSend(m)
    setDraft('')
  }

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div>
          <h2 className="chat-title">Ask Your Journal</h2>
          <p className="chat-sub">Luminary reads your entries and answers grounded in what you've written.</p>
        </div>
        {history.length > 0 && (
          <button className="btn-insight" onClick={onClear}>↻ Clear conversation</button>
        )}
      </div>

      {!apiKey && (
        <div className="chat-warn">Add your Anthropic API key in the sidebar to start chatting.</div>
      )}
      {apiKey && entries.length === 0 && (
        <div className="chat-warn">Write at least one entry first — there's nothing to ground answers in yet.</div>
      )}

      <div className="chat-body">
        {history.length === 0 && !sending && (
          <div className="chat-suggestions">
            <div className="chat-suggestions-label">Try asking…</div>
            <div className="chat-suggestion-list">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  className="chat-suggestion"
                  onClick={() => onSend(s)}
                  disabled={!apiKey || entries.length === 0}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((h, i) => (
          <div key={i} className="chat-pair">
            <div className="chat-msg user">
              <span className="chat-role">You</span>
              <div className="chat-body-text">{h.user}</div>
            </div>
            <div className="chat-msg assistant">
              <span className="chat-role">Luminary</span>
              <div className="chat-body-text">{h.assistant}</div>
            </div>
          </div>
        ))}

        {sending && (
          <div className="chat-msg assistant pending">
            <span className="chat-role">Luminary</span>
            <div className="chat-body-text">
              <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
              <span style={{ marginLeft: 8, fontStyle: 'italic' }}>reading your entries…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="chat-msg error">
            <span className="chat-role">Error</span>
            <div className="chat-body-text">{error}</div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div className="chat-input-row">
        <input
          className="chat-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder={
            !apiKey ? 'Add your API key to chat…' :
            entries.length === 0 ? 'Write an entry first…' :
            'Ask about your entries…'
          }
          disabled={sending || !apiKey || entries.length === 0}
          aria-label="Message"
        />
        <button
          className="chat-send"
          onClick={submit}
          disabled={!draft.trim() || sending || !apiKey || entries.length === 0}
          aria-label="Send"
        >→</button>
      </div>
    </div>
  )
}
