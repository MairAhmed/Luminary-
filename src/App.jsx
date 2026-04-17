import { useState, useEffect, useCallback, useMemo } from 'react'
import Landing from './components/Landing.jsx'
import { Login, FaithOnboarding } from './components/Auth.jsx'
import Sidebar from './components/Sidebar.jsx'
import Editor from './components/Editor.jsx'
import InsightPanel from './components/InsightPanel.jsx'
import Calendar from './components/Calendar.jsx'
import Stats from './components/Stats.jsx'
import JournalChat from './components/JournalChat.jsx'
import Settings, { ConfirmModal } from './components/Settings.jsx'
import { storage, DEFAULTS } from './lib/storage.js'
import {
  runEntryReflection, runWeeklyReflection, runAnalystAgent, runPatternAgent,
  runPeriodReflection, runFollowUp, runJournalChat,
} from './lib/anthropic.js'

// Rotating daily prompts
const DAILY_PROMPTS = [
  "What is something you've been avoiding thinking about?",
  "Describe a small moment of beauty from the last 24 hours.",
  "What would you say to yourself from a year ago?",
  "What is one thing you're quietly proud of right now?",
  "Who has been on your mind lately, and why?",
  "Where did you feel most yourself this week?",
  "What belief about yourself is worth questioning?",
  "If today had a soundtrack, what would it be?",
  "What's a worry you can set down for now?",
  "What did you need today that you didn't ask for?",
  "Describe the weather inside your chest.",
  "What are you carrying that isn't yours?",
  "What would rest look like right now?",
  "What did someone do recently that touched you?",
  "Where are you pretending to be okay?",
]

function promptForToday() {
  const d = new Date()
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000)
  return DAILY_PROMPTS[dayOfYear % DAILY_PROMPTS.length]
}

function useToast() {
  const [msg, setMsg] = useState('')
  const [show, setShow] = useState(false)
  const toast = useCallback((m) => {
    setMsg(m); setShow(true)
    setTimeout(() => setShow(false), 2800)
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
  const [settings, setSettings] = useState(DEFAULTS)

  // ── Journal state
  const [entries, setEntries] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [draft, setDraft] = useState(null)
  const [chats, setChats] = useState([])

  // ── Main view (Write / Calendar / Stats / Chat)
  const [view, setView] = useState('editor')

  // ── Insight panel state
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelTitle, setPanelTitle] = useState('')
  const [panelMode, setPanelMode] = useState(null)
  const [panelLoading, setPanelLoading] = useState(false)
  const [panelError, setPanelError] = useState(null)
  const [insightData, setInsightData] = useState(null)
  const [quoteData, setQuoteData] = useState(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [weeklyData, setWeeklyData] = useState(null)
  const [periodData, setPeriodData] = useState(null)
  const [periodLabel, setPeriodLabel] = useState(null)
  const [patternState, setPatternState] = useState(null)
  const [followUpHistory, setFollowUpHistory] = useState([])
  const [followUpSending, setFollowUpSending] = useState(false)

  // Cache last "reflect" context for retries + follow-up
  const [lastReflectCtx, setLastReflectCtx] = useState(null)

  const [reflectLoading, setReflectLoading] = useState(false)
  const [showFaithChange, setShowFaithChange] = useState(false)
  const [isNewEntry, setIsNewEntry] = useState(false)

  // Settings + confirm modals
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState(null)
  // { title, message, confirmLabel, danger, onConfirm }

  // Chat state
  const [chatSending, setChatSending] = useState(false)
  const [chatError, setChatError] = useState(null)

  const { msg: toastMsg, show: toastShow, toast } = useToast()

  const dailyPrompt = useMemo(() => promptForToday(), [])

  // ── Load user on mount
  useEffect(() => {
    const saved = storage.getUser()
    if (saved) {
      setUser(saved)
      setApiKey(storage.getApiKey(saved.id))
      setFaith(storage.getFaith(saved.id))
      setEntries(storage.getEntries(saved.id))
      setSettings(storage.getSettings(saved.id))
      setDraft(storage.getDraft(saved.id))
      setChats(storage.getChats(saved.id))
      if (storage.getFaithAsked(saved.id)) setScreen('app')
      else setScreen('faith')
    }
  }, [])

  // ── Apply theme + font settings to <html>
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', settings.theme)
    root.setAttribute('data-font', settings.font)
    root.setAttribute('data-font-size', settings.fontSize)
    root.setAttribute('data-reduced-motion', settings.reducedMotion ? 'on' : 'off')
  }, [settings.theme, settings.font, settings.fontSize, settings.reducedMotion])

  // ── App-wide keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (screen !== 'app') return
      const meta = e.metaKey || e.ctrlKey
      if (!meta) return
      // ⌘K — open chat
      if (e.key.toLowerCase() === 'k') { e.preventDefault(); setView('chat') }
      // ⌘N — new entry
      else if (e.key.toLowerCase() === 'n') { e.preventDefault(); handleNewEntry() }
      // ⌘/ — settings
      else if (e.key === '/') { e.preventDefault(); setSettingsOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen])

  // ── Handlers
  function handleLandingEnter() { setScreen('login') }

  function handleLogin(userData) {
    storage.saveUser(userData)
    setUser(userData)
    setApiKey(storage.getApiKey(userData.id))
    setFaith(storage.getFaith(userData.id))
    setEntries(storage.getEntries(userData.id))
    setSettings(storage.getSettings(userData.id))
    setDraft(storage.getDraft(userData.id))
    setChats(storage.getChats(userData.id))
    if (storage.getFaithAsked(userData.id)) {
      setScreen('app')
      toast('Welcome back, ' + userData.name.split(' ')[0] + ' ✦')
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

  function handleApiKeySave({ key, error }) {
    if (error) { toast(error); return }
    storage.saveApiKey(user.id, key)
    setApiKey(key)
    toast('API key saved ✦')
  }

  function handleSignOut() {
    setConfirmDialog({
      title: 'Sign out of Luminary?',
      message: 'Your entries remain on this device.',
      confirmLabel: 'Sign out',
      danger: false,
      onConfirm: () => {
        storage.clearUser()
        setUser(null); setEntries([]); setApiKey(''); setFaith('')
        setCurrentId(null); setPanelOpen(false); setDraft(null); setChats([])
        setScreen('login')
        setConfirmDialog(null)
        toast('Signed out')
      },
    })
  }

  function handleNewEntry(dateHint) {
    setCurrentId(null)
    setIsNewEntry(true)
    setPanelOpen(false)
    setView('editor')
    // Draft is preserved and loaded by Editor automatically
    void dateHint // future: pre-fill date
  }

  function handleSelectEntry(id) {
    setCurrentId(id)
    setIsNewEntry(false)
    setView('editor')
  }

  function handleSaveEntry({ title, body, mood, tags }) {
    if (!body.trim()) { toast('Write something first…'); return }
    const isNew = !currentId
    const id = currentId || String(Date.now())
    const existing = entries.find(e => e.id === id)
    const entry = {
      id,
      title: title || 'Untitled',
      body,
      mood,
      tags: tags || [],
      pinned: existing?.pinned || false,
      archived: existing?.archived || false,
      createdAt: existing?.createdAt || parseInt(id) || Date.now(),
      savedAt: Date.now(),
    }
    const idx = entries.findIndex(e => e.id === id)
    const updated = idx >= 0
      ? entries.map((e, i) => i === idx ? entry : e)
      : [entry, ...entries]
    setEntries(updated)
    storage.saveEntries(user.id, updated)
    setCurrentId(id)
    setIsNewEntry(false)
    if (isNew) {
      storage.clearDraft(user.id)
      setDraft(null)
    }
    toast('Entry saved ✦')
  }

  function handleDraftChange(d) {
    setDraft(d)
    storage.saveDraft(user.id, d)
  }

  function handleDeleteEntry(id) {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    setConfirmDialog({
      title: 'Delete this entry?',
      message: `"${(entry.title || entry.body || '').slice(0, 80)}" — this can't be undone.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        const updated = entries.filter(e => e.id !== id)
        setEntries(updated)
        storage.saveEntries(user.id, updated)
        if (currentId === id) { setCurrentId(null); setIsNewEntry(false) }
        setConfirmDialog(null)
        toast('Entry deleted')
      },
    })
  }

  function handlePinOrArchive(id, patch) {
    const updated = entries.map(e => e.id === id ? { ...e, ...patch } : e)
    setEntries(updated)
    storage.saveEntries(user.id, updated)
    if (patch.pinned !== undefined) toast(patch.pinned ? 'Pinned' : 'Unpinned')
    if (patch.archived !== undefined) toast(patch.archived ? 'Archived' : 'Unarchived')
  }

  function handleSaveSettings(newSettings) {
    setSettings(newSettings)
    storage.saveSettings(user.id, newSettings)
    setSettingsOpen(false)
    toast('Settings saved ✦')
  }

  // ── Insight / reflection flows
  async function handleReflect({ title, body, mood, tags }) {
    if (!apiKey) { toast('Add your Anthropic API key first'); return }
    const ctx = { title, body, mood, tags }
    setLastReflectCtx(ctx)
    setReflectLoading(true)
    setPanelTitle('Entry Reflection')
    setPanelMode('entry')
    setPanelOpen(true)
    setPanelLoading(true)
    setPanelError(null)
    setInsightData(null); setQuoteData(null); setQuoteLoading(false)
    setFollowUpHistory([])

    try {
      const { insight, quote } = await runEntryReflection(apiKey, { entryText: body, faith })
      setInsightData(insight)
      setPanelLoading(false)
      setQuoteLoading(!quote)
      if (quote) setQuoteData(quote)
    } catch (err) {
      setPanelLoading(false)
      setPanelError(err.message || 'Something went wrong')
    } finally {
      setReflectLoading(false)
      setQuoteLoading(false)
    }
  }

  async function handleFollowUp(message) {
    if (!apiKey) return
    setFollowUpSending(true)
    try {
      const answer = await runFollowUp(apiKey, {
        entryText: lastReflectCtx?.body || '',
        faith,
        insight: insightData,
        history: followUpHistory,
        userMessage: message,
      })
      setFollowUpHistory(h => [...h, { user: message, assistant: answer }])
    } catch (err) {
      toast('Error: ' + err.message)
    } finally {
      setFollowUpSending(false)
    }
  }

  function handleRetryReflect() {
    if (lastReflectCtx) handleReflect(lastReflectCtx)
  }

  async function handleWeeklyInsight() {
    if (!apiKey) { toast('Add your Anthropic API key first'); return }
    const activeEntries = entries.filter(e => !e.archived)
    if (activeEntries.length === 0) { toast('Write some entries first…'); return }
    setPanelTitle('Weekly Reflection')
    setPanelMode('weekly')
    setPanelOpen(true)
    setPanelLoading(true)
    setPanelError(null)
    setWeeklyData(null)
    try {
      const data = await runWeeklyReflection(apiKey, { entries: activeEntries.slice(0, 7), faith })
      setWeeklyData(data)
    } catch (err) {
      setPanelError(err.message || 'Something went wrong')
    } finally {
      setPanelLoading(false)
    }
  }

  async function handlePeriodReflect(period, periodEntries) {
    if (!apiKey) { toast('Add your Anthropic API key first'); return }
    if (!periodEntries || periodEntries.length < 2) { toast('Need at least 2 entries…'); return }
    const labelMap = { month: 'Monthly Reflection', year: 'Yearly Reflection' }
    setPanelTitle(labelMap[period] || 'Reflection')
    setPanelMode(period === 'year' ? 'yearly' : 'monthly')
    setPeriodLabel(period)
    setPanelOpen(true)
    setPanelLoading(true)
    setPanelError(null)
    setPeriodData(null)
    try {
      const data = await runPeriodReflection(apiKey, { entries: periodEntries, faith, period })
      setPeriodData(data)
    } catch (err) {
      setPanelError(err.message || 'Something went wrong')
    } finally {
      setPanelLoading(false)
    }
  }

  async function handlePatternAgent() {
    if (!apiKey) { toast('Add your Anthropic API key first'); return }
    const activeEntries = entries.filter(e => !e.archived)
    if (activeEntries.length < 2) { toast('Write at least 2 entries first'); return }
    setPanelTitle('Pattern Agent')
    setPanelMode('pattern')
    setPanelOpen(true)
    setPanelLoading(false)
    setPanelError(null)
    setPatternState({ agent1State: 'running', agent2State: 'waiting', analystData: null, patternData: null })

    try {
      const analystOutput = await runAnalystAgent(apiKey, { entries: activeEntries })
      setPatternState(s => ({ ...s, agent1State: 'done', agent2State: 'running', analystData: analystOutput }))
      const patternOutput = await runPatternAgent(apiKey, { analystOutput, faith })
      setPatternState(s => ({ ...s, agent2State: 'done', patternData: patternOutput }))
    } catch (err) {
      setPatternState(s => ({ ...s, agent1State: s?.analystData ? 'done' : 'error', agent2State: 'error' }))
      setPanelError(err.message || 'Something went wrong')
    }
  }

  // ── Journal chat
  async function handleChatSend(message) {
    if (!apiKey) return
    setChatSending(true)
    setChatError(null)
    try {
      const active = entries.filter(e => !e.archived)
      const answer = await runJournalChat(apiKey, {
        entries: active,
        faith,
        history: chats,
        userMessage: message,
      })
      const next = [...chats, { user: message, assistant: answer, at: Date.now() }]
      setChats(next)
      storage.saveChats(user.id, next)
    } catch (err) {
      setChatError(err.message || 'Something went wrong')
    } finally {
      setChatSending(false)
    }
  }

  function handleClearChat() {
    setChats([])
    storage.saveChats(user.id, [])
  }

  const currentEntry = entries.find(e => e.id === currentId) || null

  return (
    <>
      {/* Landing */}
      {screen === 'landing' && (
        <Landing onEnter={handleLandingEnter} reducedMotion={settings.reducedMotion} />
      )}

      {/* Login */}
      {screen === 'login' && <Login onLogin={handleLogin} />}

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
            view={view}
            onNewEntry={handleNewEntry}
            onSelectEntry={handleSelectEntry}
            onApiKeySave={handleApiKeySave}
            onSignOut={handleSignOut}
            onFaithClick={() => setShowFaithChange(true)}
            onDeleteEntry={handleDeleteEntry}
            onPinEntry={handlePinOrArchive}
            onNavigate={setView}
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <main className="main">
            <header className="main-header">
              <div className="header-date">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div className="header-actions">
                {view === 'editor' && (
                  <>
                    <button className="btn-insight" onClick={handleWeeklyInsight}>✦ Weekly Insight</button>
                    <button className="btn-insight btn-pattern" onClick={handlePatternAgent}>⬡ Pattern Agent</button>
                  </>
                )}
              </div>
            </header>

            {view === 'editor' && (
              !isNewEntry && !currentEntry ? (
                <div className="empty-state">
                  <div className="empty-icon" aria-hidden="true">📖</div>
                  <div className="empty-title">Begin your story</div>
                  <p className="empty-sub">Each entry is a page in the book of you. Start writing — your AI companion will reflect patterns and insights as you go.</p>
                  <div className="empty-actions">
                    <button className="btn-save" onClick={() => handleNewEntry()}>+ Start Writing</button>
                    <button className="btn-insight" onClick={() => setView('calendar')}>Open Calendar</button>
                  </div>
                  {dailyPrompt && (
                    <div className="daily-prompt">
                      <div className="daily-prompt-label">Today's Prompt</div>
                      <div className="daily-prompt-text">{dailyPrompt}</div>
                    </div>
                  )}
                </div>
              ) : (
                <Editor
                  key={currentId || 'new'}
                  entry={currentEntry}
                  onSave={handleSaveEntry}
                  onReflect={handleReflect}
                  loading={reflectLoading}
                  wordGoal={settings.wordGoal}
                  draft={currentEntry ? null : draft}
                  onDraftChange={currentEntry ? null : handleDraftChange}
                  promptOfDay={dailyPrompt}
                />
              )
            )}

            {view === 'calendar' && (
              <Calendar
                entries={entries}
                onSelectEntry={handleSelectEntry}
                onNewEntry={handleNewEntry}
                onPeriodReflect={(period, monthEntries) => handlePeriodReflect('month', monthEntries)}
              />
            )}

            {view === 'stats' && (
              <Stats
                entries={entries}
                onMonthReflect={(monthEntries) => handlePeriodReflect('month', monthEntries)}
                onYearReflect={(yearEntries) => handlePeriodReflect('year', yearEntries)}
              />
            )}

            {view === 'chat' && (
              <JournalChat
                apiKey={apiKey}
                entries={entries}
                history={chats}
                onSend={handleChatSend}
                onClear={handleClearChat}
                sending={chatSending}
                error={chatError}
              />
            )}
          </main>

          <InsightPanel
            open={panelOpen}
            title={panelTitle}
            mode={panelMode}
            onClose={() => setPanelOpen(false)}
            loading={panelLoading}
            error={panelError}
            insightData={insightData}
            quoteData={quoteData}
            quoteLoading={quoteLoading}
            weeklyData={weeklyData}
            periodData={periodData}
            periodLabel={periodLabel}
            patternState={patternState}
            followUpHistory={followUpHistory}
            onFollowUp={lastReflectCtx ? handleFollowUp : null}
            followUpSending={followUpSending}
            onRetry={panelMode === 'entry' ? handleRetryReflect : null}
            showDebug={settings.showDebug}
          />

          {settingsOpen && (
            <Settings
              settings={settings}
              onSave={handleSaveSettings}
              onClose={() => setSettingsOpen(false)}
            />
          )}

          <ConfirmModal
            open={!!confirmDialog}
            {...(confirmDialog || {})}
            onCancel={() => setConfirmDialog(null)}
          />
        </div>
      )}

      {/* Toast */}
      <div className={`toast${toastShow ? ' show' : ''}`} role="status" aria-live="polite">{toastMsg}</div>
    </>
  )
}
