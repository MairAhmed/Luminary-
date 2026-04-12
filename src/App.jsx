import { useState, useEffect, useCallback } from 'react'
import Landing from './components/Landing.jsx'
import { Login, FaithOnboarding } from './components/Auth.jsx'
import Sidebar from './components/Sidebar.jsx'
import Editor from './components/Editor.jsx'
import InsightPanel from './components/InsightPanel.jsx'
import { storage } from './lib/storage.js'
import { runEntryReflection, runWeeklyReflection, runAnalystAgent, runPatternAgent } from './lib/anthropic.js'

// Simple toast hook
function useToast() {
  const [msg, setMsg] = useState('')
  const [show, setShow] = useState(false)
  const toast = useCallback((m) => {
    setMsg(m); setShow(true)
    setTimeout(() => setShow(false), 2500)
  }, [])
  return { msg, show, toast }
}

export default function App() {
  // ── Screen state
  const [screen, setScreen] = useState('landing') // landing | login | faith | app

  // ── User state
  const [user, setUser] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [faith, setFaith] = useState('')

  // ── Journal state
  const [entries, setEntries] = useState([])
  const [currentId, setCurrentId] = useState(null)

  // ── Insight panel state
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTitle, setPanelTitle] = useState('')
  const [panelMode, setPanelMode] = useState(null) // entry | weekly | pattern
  const [panelLoading, setPanelLoading] = useState(false)
  const [insightData, setInsightData] = useState(null)
  const [quoteData, setQuoteData] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [weeklyData, setWeeklyData] = useState(null)
  const [patternState, setPatternState] = useState(null)

  // ── Reflect loading
  const [reflectLoading, setReflectLoading] = useState(false)

  // ── Faith re-open
  const [showFaithChange, setShowFaithChange] = useState(false)

  // ── New entry flag — true when user clicked New Entry (blank editor, no saved ID yet)
  const [isNewEntry, setIsNewEntry] = useState(false)

  const { msg: toastMsg, show: toastShow, toast } = useToast()

  // ── Load user on mount
  useEffect(() => {
    const saved = storage.getUser()
    if (saved) {
      setUser(saved)
      const k = storage.getApiKey(saved.id)
      const f = storage.getFaith(saved.id)
      const e = storage.getEntries(saved.id)
      setApiKey(k); setFaith(f); setEntries(e)
      // Skip to app directly if faith already set
      if (storage.getFaithAsked(saved.id)) {
        setScreen('app')
      } else {
        setScreen('faith')
      }
    }
  }, [])

  // ── Handlers
  function handleLandingEnter() { setScreen('login') }

  function handleLogin(userData) {
    storage.saveUser(userData)
    setUser(userData)
    const k = storage.getApiKey(userData.id)
    const f = storage.getFaith(userData.id)
    const e = storage.getEntries(userData.id)
    setApiKey(k); setFaith(f); setEntries(e)
    if (storage.getFaithAsked(userData.id)) {
      setScreen('app'); toast('Welcome back, ' + userData.name.split(' ')[0] + ' ✦')
    } else {
      setScreen('faith')
    }
  }

  function handleFaithSave(f) {
    storage.saveFaith(user.id, f)
    storage.setFaithAsked(user.id)
    setFaith(f)
    setShowFaithChange(false)
    setScreen('app')
    toast('Welcome, ' + user.name.split(' ')[0] + ' ✦')
  }

  function handleApiKeySave(key) {
    storage.saveApiKey(user.id, key)
    setApiKey(key)
    toast('API key saved ✦')
  }

  function handleSignOut() {
    if (!confirm('Sign out of Luminary?')) return
    storage.clearUser()
    setUser(null); setEntries([]); setApiKey(''); setFaith('')
    setCurrentId(null); setPanelOpen(false)
    setScreen('login')
    toast('Signed out')
  }

  function handleNewEntry() {
    setCurrentId(null)
    setIsNewEntry(true)
    setPanelOpen(false)
  }

  function handleSelectEntry(id) {
    setCurrentId(id)
    setIsNewEntry(false)
  }

  function handleSaveEntry({ title, body, mood }) {
    if (!body.trim()) { toast('Write something first…'); return }
    const id = currentId || String(Date.now())
    const entry = { id, title: title || 'Untitled', body, mood, savedAt: Date.now() }
    const existing = entries.findIndex(e => e.id === id)
    const updated = existing >= 0
      ? entries.map((e, i) => i === existing ? entry : e)
      : [entry, ...entries]
    setEntries(updated)
    storage.saveEntries(user.id, updated)
    setCurrentId(id)
    setIsNewEntry(false)
    toast('Entry saved ✦')
  }

  async function handleReflect({ title, body, mood }) {
    if (!apiKey) { toast('Add your Anthropic API key first'); return }
    setReflectLoading(true)
    setPanelTitle('Entry Reflection')
    setPanelMode('entry')
    setPanelOpen(true)
    setPanelLoading(true)
    setInsightData(null); setQuoteData(null); setQuoteLoading(false)

    try {
      const { insight, quote } = await runEntryReflection(apiKey, { entryText: body, faith })
      setInsightData(insight)
      setPanelLoading(false)
      setQuoteLoading(!quote)
      if (quote) setQuoteData(quote)
    } catch (err) {
      setPanelLoading(false)
      toast('Error: ' + err.message)
    } finally {
      setReflectLoading(false)
      setQuoteLoading(false)
    }
  }

  async function handleWeeklyInsight() {
    if (!apiKey) { toast('Add your Anthropic API key first'); return }
    if (entries.length === 0) { toast('Write some entries first…'); return }
    setPanelTitle('Weekly Reflection')
    setPanelMode('weekly')
    setPanelOpen(true)
    setPanelLoading(true)
    setWeeklyData(null)
    try {
      const data = await runWeeklyReflection(apiKey, { entries: entries.slice(0, 7), faith })
      setWeeklyData(data)
    } catch (err) {
      toast('Error: ' + err.message)
    } finally {
      setPanelLoading(false)
    }
  }

  async function handlePatternAgent() {
    if (!apiKey) { toast('Add your Anthropic API key first'); return }
    if (entries.length < 2) { toast('Write at least 2 entries first'); return }
    setPanelTitle('Pattern Agent')
    setPanelMode('pattern')
    setPanelOpen(true)
    setPanelLoading(false)
    setPatternState({ agent1State: 'running', agent2State: 'waiting', analystData: null, patternData: null })

    try {
      const analystOutput = await runAnalystAgent(apiKey, { entries })
      setPatternState(s => ({ ...s, agent1State: 'done', agent2State: 'running', analystData: analystOutput }))
      const patternOutput = await runPatternAgent(apiKey, { analystOutput, faith })
      setPatternState(s => ({ ...s, agent2State: 'done', patternData: patternOutput }))
    } catch (err) {
      setPatternState(s => ({ ...s, agent1State: s.analystData ? 'done' : 'error', agent2State: 'error' }))
      toast('Error: ' + err.message)
    }
  }

  const currentEntry = entries.find(e => e.id === currentId) || null

  return (
    <>
      {/* Landing */}
      {screen === 'landing' && <Landing onEnter={handleLandingEnter} />}

      {/* Login */}
      {(screen === 'login') && <Login onLogin={handleLogin} />}

      {/* Faith onboarding */}
      {(screen === 'faith' || showFaithChange) && (
        <FaithOnboarding onSave={handleFaithSave} />
      )}

      {/* Main app */}
      {screen === 'app' && (
        <div className="app">
          <Sidebar
            user={user}
            entries={entries}
            currentId={currentId}
            apiKey={apiKey}
            faith={faith}
            onNewEntry={handleNewEntry}
            onSelectEntry={handleSelectEntry}
            onApiKeySave={handleApiKeySave}
            onSignOut={handleSignOut}
            onFaithClick={() => setShowFaithChange(true)}
          />

          <main className="main">
            <header className="main-header">
              <div className="header-date">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="header-actions">
                <button className="btn-insight" onClick={handleWeeklyInsight}>✦ Weekly Insight</button>
                <button className="btn-insight btn-pattern" onClick={handlePatternAgent}>⬡ Pattern Agent</button>
              </div>
            </header>

            {!isNewEntry && !currentEntry ? (
              <div className="empty-state">
                <div className="empty-icon">📖</div>
                <div className="empty-title">Begin your story</div>
                <p className="empty-sub">Each entry is a page in the book of you. Start writing — your AI companion will reflect patterns and insights as you go.</p>
              </div>
            ) : (
              <Editor
                key={currentId || 'new'}
                entry={currentEntry}
                onSave={handleSaveEntry}
                onReflect={handleReflect}
                loading={reflectLoading}
              />
            )}
          </main>

          <InsightPanel
            open={panelOpen}
            title={panelTitle}
            mode={panelMode}
            onClose={() => setPanelOpen(false)}
            loading={panelLoading}
            insightData={insightData}
            quoteData={quoteData}
            quoteLoading={quoteLoading}
            weeklyData={weeklyData}
            patternState={patternState}
          />
        </div>
      )}

      {/* Toast */}
      <div className={`toast${toastShow ? ' show' : ''}`}>{toastMsg}</div>
    </>
  )
}
