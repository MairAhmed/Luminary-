import { useState, useEffect, useRef, useCallback } from 'react'

const MOODS = ['🌟', '😊', '😌', '😔', '😤', '😰']
const MOOD_LABELS = {
  '🌟': 'great', '😊': 'happy', '😌': 'content',
  '😔': 'sad', '😤': 'frustrated', '😰': 'anxious',
}

const TEMPLATES = [
  {
    id: 'morning',
    name: 'Morning Pages',
    icon: '☀',
    body: `Good morning.\n\nThree things on my mind:\n1. \n2. \n3. \n\nOne intention for today:\n\n`,
  },
  {
    id: 'gratitude',
    name: 'Gratitude',
    icon: '✦',
    body: `Today I'm grateful for:\n\n1. \n2. \n3. \n\nOne small thing that made me smile:\n\n`,
  },
  {
    id: 'worry',
    name: 'Worry Dump',
    icon: '❋',
    body: `What's weighing on me right now:\n\n\nWhich parts are in my control?\n\n\nWhich parts aren't?\n\n`,
  },
  {
    id: 'evening',
    name: 'Evening Review',
    icon: '☽',
    body: `What happened today:\n\n\nHow I felt:\n\n\nOne thing I learned:\n\n`,
  },
]

export default function Editor({
  entry, onSave, onReflect, loading, wordGoal = 250,
  draft, onDraftChange, promptOfDay, memory, onOpenMemory,
}) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [mood, setMood] = useState(null)
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [dirty, setDirty] = useState(false)
  const [voiceOn, setVoiceOn] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef(null)
  const textareaRef = useRef(null)
  const savedSnapshotRef = useRef('')

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setVoiceSupported(!!SR)
  }, [])

  // Load entry, or draft if this is a new entry
  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '')
      setBody(entry.body || '')
      setMood(entry.mood || null)
      setTags(entry.tags || [])
      savedSnapshotRef.current = hash(entry.title, entry.body, entry.mood, entry.tags)
      setDirty(false)
    } else if (draft) {
      setTitle(draft.title || '')
      setBody(draft.body || '')
      setMood(draft.mood || null)
      setTags(draft.tags || [])
      savedSnapshotRef.current = ''
      setDirty(!!(draft.title || draft.body))
    } else {
      setTitle(''); setBody(''); setMood(null); setTags([])
      savedSnapshotRef.current = ''
      setDirty(false)
    }
  }, [entry?.id])

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.max(ta.scrollHeight, 400) + 'px'
  }, [body])

  // Autosave draft (only for new, unsaved entries)
  useEffect(() => {
    if (entry) return // only draft new entries
    if (!onDraftChange) return
    const t = setTimeout(() => {
      if (title || body || mood || tags.length) {
        onDraftChange({ title, body, mood, tags, updatedAt: Date.now() })
      }
    }, 800)
    return () => clearTimeout(t)
  }, [title, body, mood, tags, entry, onDraftChange])

  // Track dirty state
  useEffect(() => {
    const current = hash(title, body, mood, tags)
    setDirty(current !== savedSnapshotRef.current)
  }, [title, body, mood, tags])

  // Warn on unload if dirty
  useEffect(() => {
    const handler = e => {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0
  const readingMinutes = Math.max(1, Math.round(wordCount / 200))
  const goalPct = wordGoal > 0 ? Math.min(100, Math.round((wordCount / wordGoal) * 100)) : 0

  const handleSave = useCallback(() => {
    onSave({ title, body, mood, tags })
    savedSnapshotRef.current = hash(title, body, mood, tags)
    setDirty(false)
  }, [title, body, mood, tags, onSave])

  function handleReflect() {
    if (!body.trim()) return
    onReflect({ title, body, mood, tags })
  }

  // Keyboard shortcut ⌘S / Ctrl-S to save, ⌘Enter to reflect
  useEffect(() => {
    const onKey = e => {
      const meta = e.metaKey || e.ctrlKey
      if (!meta) return
      if (e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleReflect()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave, title, body, mood, tags])

  // Entry date shown is the original savedAt / id, not "now"
  const dateStr = entry
    ? new Date(parseInt(entry.id) || entry.savedAt || Date.now())
        .toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  // ── Voice input (Web Speech API)
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    if (voiceOn) {
      recognitionRef.current?.stop()
      setVoiceOn(false)
      return
    }
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'
    rec.onresult = (ev) => {
      let chunk = ''
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        if (ev.results[i].isFinal) chunk += ev.results[i][0].transcript + ' '
      }
      if (chunk) setBody(b => (b + (b && !b.endsWith(' ') ? ' ' : '') + chunk).trim() + ' ')
    }
    rec.onend = () => setVoiceOn(false)
    rec.onerror = () => setVoiceOn(false)
    rec.start()
    recognitionRef.current = rec
    setVoiceOn(true)
  }

  // ── Tag input
  function addTag(raw) {
    const t = raw.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-').slice(0, 24)
    if (!t) return
    if (tags.includes(t)) return
    setTags([...tags, t])
    setTagInput('')
  }
  function removeTag(t) { setTags(tags.filter(x => x !== t)) }

  function applyTemplate(tmpl) {
    if (body.trim() && !confirmReplace()) return
    setBody(tmpl.body)
    setTitle(tmpl.name)
    setShowTemplates(false)
    // Focus the body at end
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(tmpl.body.length, tmpl.body.length)
      }
    }, 50)
  }
  function confirmReplace() {
    return window.confirm('Replace current draft with this template?')
  }

  return (
    <div className="editor-wrap">
      <div className="editor-area">
        {!entry && memory && onOpenMemory && (
          <button
            className={`memory-card inline ${memory.kind}`}
            onClick={() => onOpenMemory(memory.entry.id)}
            aria-label={`Open memory from ${memory.label}`}
          >
            <div className="memory-header">
              <span className="memory-icon" aria-hidden="true">{memory.kind === 'onThisDay' ? '✦' : '◈'}</span>
              <span className="memory-label">
                {memory.kind === 'onThisDay' ? memory.label : `From the archive · ${memory.label}`}
              </span>
              <span className="memory-cta-mini">Open →</span>
            </div>
            {memory.entry.title && (
              <div className="memory-title-mini">{memory.entry.title}</div>
            )}
            <div className="memory-preview-mini">
              {(memory.entry.body || '').slice(0, 140).trim()}
              {(memory.entry.body || '').length > 140 ? '…' : ''}
            </div>
          </button>
        )}

        <input
          className="entry-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Give this moment a title…"
          aria-label="Entry title"
        />
        <div className="entry-meta">
          <span>{dateStr}</span>
          <span>·</span>
          <span>Mood:</span>
          <div className="mood-selector" role="group" aria-label="Select mood">
            {MOODS.map(m => (
              <button
                key={m}
                className={`mood-btn${mood === m ? ' selected' : ''}`}
                onClick={() => setMood(mood === m ? null : m)}
                aria-label={`Mood: ${MOOD_LABELS[m]}`}
                aria-pressed={mood === m}
              >
                {m}
              </button>
            ))}
          </div>
          {dirty && (
            <span className="dirty-indicator" title="Unsaved changes">
              <span className="dirty-dot" /> unsaved
            </span>
          )}
        </div>

        {/* Tag row */}
        <div className="tag-row">
          {tags.map(t => (
            <span key={t} className="tag-chip">
              #{t}
              <button
                className="tag-chip-x"
                onClick={() => removeTag(t)}
                aria-label={`Remove tag ${t}`}
              >×</button>
            </span>
          ))}
          <input
            className="tag-input"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
              else if (e.key === 'Backspace' && !tagInput && tags.length) { removeTag(tags[tags.length - 1]) }
            }}
            onBlur={() => tagInput && addTag(tagInput)}
            placeholder={tags.length ? '+ add tag' : '+ tag (e.g. work, gratitude)'}
            aria-label="Add tag"
          />
        </div>

        {/* Templates row + daily prompt */}
        {!entry && (
          <div className="editor-tools">
            <button
              className="tool-chip"
              onClick={() => setShowTemplates(v => !v)}
              aria-expanded={showTemplates}
            >
              ❋ Templates
            </button>
            {promptOfDay && (
              <button
                className="tool-chip prompt"
                onClick={() => setBody(b => (b ? b + '\n\n' : '') + promptOfDay + '\n')}
                title="Insert today's prompt into your entry"
              >
                ✦ Prompt: {truncateInline(promptOfDay, 60)}
              </button>
            )}
          </div>
        )}
        {showTemplates && (
          <div className="template-grid">
            {TEMPLATES.map(t => (
              <button key={t.id} className="template-card" onClick={() => applyTemplate(t)}>
                <span className="template-icon" aria-hidden="true">{t.icon}</span>
                <span className="template-name">{t.name}</span>
              </button>
            ))}
          </div>
        )}

        <div className="divider" />
        <textarea
          ref={textareaRef}
          className="entry-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="What's on your mind today? Write freely — this is your space…"
          aria-label="Entry body"
        />
      </div>

      <div className="save-bar">
        <div className="save-bar-meta">
          <span className="word-count">
            {wordCount} word{wordCount !== 1 ? 's' : ''} · {readingMinutes} min read
          </span>
          {wordGoal > 0 && (
            <div className="goal-track" title={`Word goal: ${wordGoal}`}>
              <div className="goal-fill" style={{ width: goalPct + '%' }} />
            </div>
          )}
        </div>
        <div className="save-bar-actions">
          {voiceSupported && (
            <button
              className={`btn-voice${voiceOn ? ' active' : ''}`}
              onClick={toggleVoice}
              title={voiceOn ? 'Stop dictation' : 'Start dictation'}
              aria-pressed={voiceOn}
            >
              {voiceOn ? '● Listening' : '🎙 Dictate'}
            </button>
          )}
          <button className="btn-ai" onClick={handleReflect} disabled={loading || !body.trim()}>
            {loading ? '✦ Reflecting…' : '✦ Reflect with AI'}
          </button>
          <button
            className="btn-save"
            onClick={handleSave}
            disabled={!dirty && !!entry}
          >
            Save Entry
          </button>
        </div>
      </div>
    </div>
  )
}

function hash(title, body, mood, tags) {
  return `${title}|${body}|${mood || ''}|${(tags || []).join(',')}`
}

function truncateInline(s, n) {
  if (!s || s.length <= n) return s || ''
  return s.slice(0, n).trim() + '…'
}
