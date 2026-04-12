import { useState, useEffect } from 'react'

const MOODS = ['🌟', '😊', '😌', '😔', '😤', '😰']

export default function Editor({ entry, onSave, onReflect, loading }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mood, setMood] = useState(null)

  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '')
      setBody(entry.body || '')
      setMood(entry.mood || null)
    } else {
      setTitle(''); setBody(''); setMood(null)
    }
  }, [entry?.id])

  const wordCount = body.trim().split(/\s+/).filter(Boolean).length

  function handleSave() {
    onSave({ title, body, mood })
  }

  function handleReflect() {
    if (!body.trim()) return
    onReflect({ title, body, mood })
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })

  return (
    <div className="editor-wrap">
      <div className="editor-area">
        <input
          className="entry-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Give this moment a title…"
        />
        <div className="entry-meta">
          <span>{dateStr}</span>
          <span>·</span>
          <span>Mood:</span>
          <div className="mood-selector">
            {MOODS.map(m => (
              <button
                key={m}
                className={`mood-btn${mood === m ? ' selected' : ''}`}
                onClick={() => setMood(mood === m ? null : m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="divider" />
        <textarea
          className="entry-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="What's on your mind today? Write freely — this is your space…"
        />
      </div>

      <div className="save-bar">
        <span className="word-count">{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-ai" onClick={handleReflect} disabled={loading || !body.trim()}>
            {loading ? '✦ Reflecting…' : '✦ Reflect with AI'}
          </button>
          <button className="btn-save" onClick={handleSave}>Save Entry</button>
        </div>
      </div>
    </div>
  )
}
