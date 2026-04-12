const key = (userId, suffix) =>
  userId ? `luminary-${userId}-${suffix}` : `luminary-anon-${suffix}`

export const storage = {
  getEntries: (userId) =>
    JSON.parse(localStorage.getItem(key(userId, 'entries')) || '[]'),
  saveEntries: (userId, entries) =>
    localStorage.setItem(key(userId, 'entries'), JSON.stringify(entries)),
  getApiKey: (userId) =>
    localStorage.getItem(key(userId, 'anthropic-key')) || '',
  saveApiKey: (userId, k) =>
    localStorage.setItem(key(userId, 'anthropic-key'), k),
  getFaith: (userId) =>
    localStorage.getItem(key(userId, 'faith')) || '',
  saveFaith: (userId, faith) =>
    localStorage.setItem(key(userId, 'faith'), faith),
  getFaithAsked: (userId) =>
    !!localStorage.getItem(key(userId, 'faith-asked')),
  setFaithAsked: (userId) =>
    localStorage.setItem(key(userId, 'faith-asked'), '1'),
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('luminary-current-user') || 'null') }
    catch { return null }
  },
  saveUser: (user) =>
    localStorage.setItem('luminary-current-user', JSON.stringify(user)),
  clearUser: () =>
    localStorage.removeItem('luminary-current-user'),
}
