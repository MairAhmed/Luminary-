import { useMemo } from 'react'

const MOOD_SCORES = {
  '🌟': 5, '😊': 4, '😌': 3.5,
  '😔': 2, '😤': 1.5, '😰': 1,
}
const MOOD_COLORS = {
  '🌟': '#d4a017', '😊': '#5a7a5a', '😌': '#7a8a9a',
  '😔': '#6a7a8a', '😤': '#8b3a2a', '😰': '#7a5a8a',
}

function entryDate(e) {
  const ts = parseInt(e.id)
  return new Date(isNaN(ts) ? (e.savedAt || Date.now()) : ts)
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate()
}

function daysBetween(a, b) {
  const ms = Math.abs(a.setHours(0,0,0,0) - b.setHours(0,0,0,0))
  return Math.round(ms / (1000 * 60 * 60 * 24))
}

export default function Stats({ entries, onYearReflect, onMonthReflect }) {
  const stats = useMemo(() => {
    const active = entries.filter(e => !e.archived)
    if (active.length === 0) {
      return { total: 0, words: 0, avg: 0, streak: 0, longestStreak: 0, moodAvg: null, moodCounts: {}, byDay: new Map(), last30: [] }
    }

    const total = active.length
    const words = active.reduce((sum, e) => sum + (e.body || '').trim().split(/\s+/).filter(Boolean).length, 0)
    const avg = Math.round(words / total)

    // Streak calculation — consecutive days with at least one entry, ending today
    const uniqueDayStrs = new Set()
    active.forEach(e => {
      const d = entryDate(e)
      uniqueDayStrs.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`)
    })

    let streak = 0
    const probe = new Date()
    while (true) {
      const k = `${probe.getFullYear()}-${probe.getMonth()}-${probe.getDate()}`
      if (uniqueDayStrs.has(k)) { streak++; probe.setDate(probe.getDate() - 1) }
      else break
    }
    // Allow "today wasn't written yet" — grace: if today missing but yesterday exists, start from yesterday
    if (streak === 0) {
      const y = new Date(); y.setDate(y.getDate() - 1)
      const probe2 = y
      while (true) {
        const k = `${probe2.getFullYear()}-${probe2.getMonth()}-${probe2.getDate()}`
        if (uniqueDayStrs.has(k)) { streak++; probe2.setDate(probe2.getDate() - 1) }
        else break
      }
    }

    // Longest streak — scan sorted unique dates
    const sortedDays = [...uniqueDayStrs]
      .map(s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m, d).getTime() })
      .sort((a, b) => a - b)
    let longest = 0, cur = 1
    for (let i = 1; i < sortedDays.length; i++) {
      const diff = (sortedDays[i] - sortedDays[i-1]) / 86400000
      if (diff === 1) { cur++; longest = Math.max(longest, cur) }
      else { cur = 1 }
    }
    longest = Math.max(longest, cur, sortedDays.length ? 1 : 0)

    // Mood distribution
    const moodCounts = {}
    let moodSum = 0, moodN = 0
    active.forEach(e => {
      if (e.mood) {
        moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1
        if (MOOD_SCORES[e.mood]) { moodSum += MOOD_SCORES[e.mood]; moodN++ }
      }
    })
    const moodAvg = moodN ? (moodSum / moodN) : null

    // Last 30 days mood trend
    const last30 = []
    const todayD = new Date()
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayD); d.setDate(d.getDate() - i)
      const dayEntries = active.filter(e => sameDay(entryDate(e), d))
      const scores = dayEntries.map(e => MOOD_SCORES[e.mood]).filter(Boolean)
      const score = scores.length ? scores.reduce((a,b)=>a+b,0) / scores.length : null
      last30.push({ date: new Date(d), score, count: dayEntries.length })
    }

    return { total, words, avg, streak, longestStreak: longest, moodAvg, moodCounts, last30 }
  }, [entries])

  const thisMonthEntries = useMemo(() => {
    const now = new Date()
    return entries.filter(e => {
      const d = entryDate(e)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && !e.archived
    })
  }, [entries])

  const thisYearEntries = useMemo(() => {
    const y = new Date().getFullYear()
    return entries.filter(e => entryDate(e).getFullYear() === y && !e.archived)
  }, [entries])

  const maxLast30 = Math.max(...stats.last30.map(p => p.count || 0), 1)

  return (
    <div className="stats-view">
      <div className="stats-header">
        <h2 className="stats-title">Your Writing Life</h2>
        <p className="stats-sub">A look at the shape of your reflection.</p>
      </div>

      <div className="stat-cards">
        <StatCard label="Entries" value={stats.total} />
        <StatCard label="Words" value={stats.words.toLocaleString()} />
        <StatCard label="Avg Words" value={stats.avg} />
        <StatCard label="Current Streak" value={`${stats.streak} day${stats.streak === 1 ? '' : 's'}`} highlight={stats.streak >= 3} />
        <StatCard label="Longest Streak" value={`${stats.longestStreak} day${stats.longestStreak === 1 ? '' : 's'}`} />
        <StatCard label="Avg Mood" value={stats.moodAvg ? stats.moodAvg.toFixed(1) + ' / 5' : '—'} />
      </div>

      <div className="stats-section">
        <div className="stats-section-label">Mood Trend — Last 30 Days</div>
        <div className="mood-trend">
          {stats.last30.map((p, i) => {
            const score = p.score || 0
            const h = p.count ? Math.max(6, (score / 5) * 100) : 2
            return (
              <div key={i} className="trend-col" title={`${p.date.toLocaleDateString()} · ${p.count ? score.toFixed(1) + '/5' : 'no entry'}`}>
                <div className="trend-bar-wrap">
                  <div
                    className="trend-bar"
                    style={{
                      height: h + '%',
                      background: p.count ? scoreColor(score) : 'transparent',
                      borderTop: p.count ? 'none' : '1px dashed #3a2a1a',
                    }}
                  />
                </div>
                {i % 5 === 0 && (
                  <div className="trend-label">{p.date.getDate()}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-section-label">Mood Distribution</div>
        {Object.keys(stats.moodCounts).length === 0 ? (
          <div className="stats-empty">No moods logged yet.</div>
        ) : (
          <div className="mood-dist">
            {Object.entries(stats.moodCounts)
              .sort(([,a],[,b]) => b - a)
              .map(([m, n]) => {
                const pct = Math.round((n / stats.total) * 100)
                return (
                  <div key={m} className="mood-dist-row">
                    <div className="mood-dist-icon">{m}</div>
                    <div className="mood-dist-track">
                      <div className="mood-dist-fill" style={{ width: pct + '%', background: MOOD_COLORS[m] }} />
                    </div>
                    <div className="mood-dist-val">{n} · {pct}%</div>
                  </div>
                )
              })}
          </div>
        )}
      </div>

      <div className="stats-section">
        <div className="stats-section-label">Writing Frequency — Last 30 Days</div>
        <div className="freq-heatmap">
          {stats.last30.map((p, i) => (
            <div
              key={i}
              className="freq-cell"
              style={{
                opacity: p.count ? Math.min(1, 0.3 + p.count / maxLast30 * 0.7) : 0.15,
                background: p.count ? '#c9960c' : '#2a1f14',
              }}
              title={`${p.date.toLocaleDateString()} — ${p.count} entr${p.count === 1 ? 'y' : 'ies'}`}
            />
          ))}
        </div>
      </div>

      <div className="stats-reflect-row">
        {thisMonthEntries.length >= 2 && (
          <button className="btn-insight" onClick={() => onMonthReflect(thisMonthEntries)}>
            ✦ Reflect on this month
          </button>
        )}
        {thisYearEntries.length >= 5 && (
          <button className="btn-insight btn-pattern" onClick={() => onYearReflect(thisYearEntries)}>
            ✦ Reflect on this year
          </button>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`stat-card${highlight ? ' highlight' : ''}`}>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value">{value}</div>
    </div>
  )
}

function scoreColor(score) {
  // 1 (low) → rust, 5 (high) → gold
  if (score >= 4) return '#d4a017'
  if (score >= 3) return '#5a7a5a'
  if (score >= 2) return '#7a5a8a'
  return '#8b3a2a'
}
