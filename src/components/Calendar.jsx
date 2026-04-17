import { useMemo, useState } from 'react'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES = ['S','M','T','W','T','F','S']

const MOOD_COLORS = {
  '🌟': '#d4a017', '😊': '#5a7a5a', '😌': '#7a8a9a',
  '😔': '#6a7a8a', '😤': '#8b3a2a', '😰': '#7a5a8a',
}

function entryDate(e) {
  const ts = parseInt(e.id)
  return new Date(isNaN(ts) ? (e.savedAt || Date.now()) : ts)
}

export default function Calendar({ entries, onSelectEntry, onNewEntry, onPeriodReflect }) {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))

  const byDay = useMemo(() => {
    const map = new Map()
    entries.forEach(e => {
      if (e.archived) return
      const d = entryDate(e)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      const arr = map.get(key) || []
      arr.push(e)
      map.set(key, arr)
    })
    return map
  }, [entries])

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const startWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build grid — pad leading and trailing to a full weeks × 7 grid
  const cells = []
  for (let i = 0; i < startWeekday; i++) {
    const d = new Date(year, month, i - startWeekday + 1)
    cells.push({ date: d, outside: true })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    cells.push({ date: new Date(year, month, i), outside: false })
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date
    const d = new Date(last); d.setDate(d.getDate() + 1)
    cells.push({ date: d, outside: true })
  }

  function shift(months) {
    setCursor(new Date(year, month + months, 1))
  }

  function goToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  const monthEntries = entries.filter(e => {
    const d = entryDate(e)
    return d.getFullYear() === year && d.getMonth() === month
  })

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button className="cal-nav" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
        <div className="cal-title">
          <div className="cal-month">{MONTH_NAMES[month]} <em>{year}</em></div>
          <div className="cal-sub">{monthEntries.length} entr{monthEntries.length === 1 ? 'y' : 'ies'} this month</div>
        </div>
        <button className="cal-nav" onClick={() => shift(1)} aria-label="Next month">›</button>
      </div>

      <div className="calendar-tools">
        <button className="btn-insight" onClick={goToday}>Today</button>
        {monthEntries.length >= 2 && (
          <button
            className="btn-insight btn-pattern"
            onClick={() => onPeriodReflect('month', monthEntries)}
          >
            ✦ Reflect on this month
          </button>
        )}
      </div>

      <div className="calendar-weekdays">
        {DAY_NAMES.map((d, i) => <div key={i} className="cal-weekday">{d}</div>)}
      </div>

      <div className="calendar-grid">
        {cells.map((c, i) => {
          const key = `${c.date.getFullYear()}-${c.date.getMonth()}-${c.date.getDate()}`
          const dayEntries = byDay.get(key) || []
          const isToday = c.date.toDateString() === today.toDateString()
          return (
            <div
              key={i}
              className={`cal-cell${c.outside ? ' outside' : ''}${isToday ? ' today' : ''}${dayEntries.length ? ' has-entry' : ''}`}
              onClick={() => {
                if (dayEntries.length === 1) onSelectEntry(dayEntries[0].id)
                else if (dayEntries.length > 1) onSelectEntry(dayEntries[0].id)
                else if (!c.outside) onNewEntry(c.date)
              }}
              role="button"
              tabIndex={0}
              aria-label={`${c.date.toDateString()} — ${dayEntries.length} entries`}
            >
              <div className="cal-day-num">{c.date.getDate()}</div>
              {dayEntries.length > 0 && (
                <div className="cal-dots">
                  {dayEntries.slice(0, 4).map(e => (
                    <span
                      key={e.id}
                      className="cal-dot"
                      style={{ background: MOOD_COLORS[e.mood] || '#b8860b' }}
                    />
                  ))}
                  {dayEntries.length > 4 && <span className="cal-more">+{dayEntries.length - 4}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="calendar-legend">
        {Object.entries(MOOD_COLORS).map(([m, c]) => (
          <span key={m} className="legend-item">
            <span className="legend-dot" style={{ background: c }} />
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}
