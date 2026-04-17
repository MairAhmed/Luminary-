const key = (userId, suffix) =>
  userId ? `luminary-${userId}-${suffix}` : `luminary-anon-${suffix}`

const DEFAULT_SETTINGS = {
  theme: 'dark',          // 'dark' | 'light'
  font: 'serif',          // 'serif' | 'sans'
  fontSize: 'medium',     // 'small' | 'medium' | 'large'
  reducedMotion: false,
  soundOn: true,
  wordGoal: 250,
  showDebug: false,
}

function safeParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback } catch { return fallback }
}

export const storage = {
  // ── Entries
  getEntries: (userId) =>
    safeParse(localStorage.getItem(key(userId, 'entries')), []),
  saveEntries: (userId, entries) =>
    localStorage.setItem(key(userId, 'entries'), JSON.stringify(entries)),

  // ── API Key
  getApiKey: (userId) =>
    localStorage.getItem(key(userId, 'anthropic-key')) || '',
  saveApiKey: (userId, k) =>
    localStorage.setItem(key(userId, 'anthropic-key'), k),

  // ── Faith
  getFaith: (userId) =>
    localStorage.getItem(key(userId, 'faith')) || '',
  saveFaith: (userId, faith) =>
    localStorage.setItem(key(userId, 'faith'), faith),
  getFaithAsked: (userId) =>
    !!localStorage.getItem(key(userId, 'faith-asked')),
  setFaithAsked: (userId) =>
    localStorage.setItem(key(userId, 'faith-asked'), '1'),

  // ── Current user session
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('luminary-current-user') || 'null') }
    catch { return null }
  },
  saveUser: (user) =>
    localStorage.setItem('luminary-current-user', JSON.stringify(user)),
  clearUser: () =>
    localStorage.removeItem('luminary-current-user'),

  // ── Settings (theme, font, motion, etc.)
  getSettings: (userId) => ({
    ...DEFAULT_SETTINGS,
    ...safeParse(localStorage.getItem(key(userId, 'settings')), {}),
  }),
  saveSettings: (userId, settings) =>
    localStorage.setItem(key(userId, 'settings'), JSON.stringify(settings)),

  // ── Draft (autosave while composing)
  getDraft: (userId) =>
    safeParse(localStorage.getItem(key(userId, 'draft')), null),
  saveDraft: (userId, draft) =>
    localStorage.setItem(key(userId, 'draft'), JSON.stringify(draft)),
  clearDraft: (userId) =>
    localStorage.removeItem(key(userId, 'draft')),

  // ── Chat history ("Ask my journal")
  getChats: (userId) =>
    safeParse(localStorage.getItem(key(userId, 'chats')), []),
  saveChats: (userId, chats) =>
    localStorage.setItem(key(userId, 'chats'), JSON.stringify(chats)),
}

export const DEFAULTS = DEFAULT_SETTINGS
