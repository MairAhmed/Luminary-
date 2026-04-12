const BAR_COLORS = { joy: '#d4a017', peace: '#5a7a5a', energy: '#b8860b', tension: '#8b3a2a' }

function InsightSection({ label, children, delay = 0 }) {
  return (
    <div className="insight-section" style={{ animationDelay: `${delay}s` }}>
      <div className="insight-label">{label}</div>
      {children}
    </div>
  )
}

function EntryInsight({ insight, quote, quoteLoading }) {
  return (
    <>
      <InsightSection label="Essence" delay={0}>
        <div className="insight-text">{insight.summary}</div>
      </InsightSection>

      <InsightSection label="Themes" delay={0.1}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(insight.themes || []).map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      </InsightSection>

      <InsightSection label="Emotional Landscape" delay={0.2}>
        <div className="mood-bar-container">
          {Object.entries(insight.emotionScore || {}).map(([label, val]) => (
            <div key={label} className="mood-bar-row">
              <div className="mood-bar-label">{label}</div>
              <div className="mood-bar-track">
                <div className="mood-bar-fill" style={{ width: `${val}%`, background: BAR_COLORS[label] || '#5a4a35' }} />
              </div>
              <div className="mood-bar-val">{val}</div>
            </div>
          ))}
        </div>
      </InsightSection>

      <InsightSection label="Reflection" delay={0.3}>
        <div className="insight-text">{insight.reflection}</div>
      </InsightSection>

      {/* Quote Tool Result */}
      <InsightSection label={quoteLoading ? '✦ Wisdom (searching…)' : quote ? `✦ ${quote.source || 'Wisdom'}` : null} delay={0.4}>
        {quoteLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="spinner" style={{ width: 14, height: 14, borderWidth: 1.5 }} />
            <div className="insight-text" style={{ fontSize: 12 }}>Finding a relevant passage…</div>
          </div>
        )}
        {!quoteLoading && quote && (
          <>
            <div className="tool-badge">⚙ find_quote tool called · {quote.apiUsed || 'API'}</div>
            <div className="quote-block">
              <div className="quote-text">"{quote.quote}"</div>
              <div className="quote-source">— {quote.source}</div>
              {quote.relevance && <div className="quote-relevance">{quote.relevance}</div>}
            </div>
          </>
        )}
      </InsightSection>

      <InsightSection label="Go Deeper" delay={0.5}>
        <div className="insight-text" style={{ color: '#d4a017' }}>{insight.prompt}</div>
      </InsightSection>
    </>
  )
}

function WeeklyInsight({ data }) {
  return (
    <>
      <InsightSection label="Your Week" delay={0}><div className="insight-text">{data.weekSummary}</div></InsightSection>
      <InsightSection label="Recurring Themes" delay={0.1}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(data.dominantThemes || []).map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      </InsightSection>
      <InsightSection label="Mood Arc" delay={0.2}><div className="insight-text">{data.moodArc}</div></InsightSection>
      <InsightSection label="Growth Observed" delay={0.3}><div className="insight-text" style={{ color: '#5a7a5a' }}>{data.growthObservation}</div></InsightSection>
      <InsightSection label="This Week's Prompt" delay={0.4}><div className="insight-text" style={{ color: '#d4a017' }}>{data.weeklyPrompt}</div></InsightSection>
    </>
  )
}

function AgentDot({ state }) {
  return <div className={`agent-dot ${state}`} />
}

function PatternAgentPanel({ agent1State, agent2State, analystData, patternData }) {
  const stateLabel = { waiting: 'Waiting…', running: 'Analysing…', done: 'Complete', error: 'Error' }

  return (
    <div>
      {/* Agent 1 */}
      <div className="agent-card">
        <div className="agent-header">
          <AgentDot state={agent1State} />
          <div className="agent-name">Agent 1 — Analyst</div>
          <div className="agent-status">{stateLabel[agent1State]}</div>
        </div>
        <div className="agent-body">
          {agent1State === 'running' && (
            <div className="loading-state" style={{ height: 80 }}>
              <div className="spinner" /><div className="loading-text" style={{ fontSize: 12 }}>Reading all entries…</div>
            </div>
          )}
          {analystData && (
            <>
              {analystData.recurringWords?.length > 0 && (
                <div className="pattern-finding">
                  <div className="pattern-label">Recurring Words</div>
                  <div>{analystData.recurringWords.map(w => <span key={w} className="tag">{w}</span>)}</div>
                </div>
              )}
              {analystData.recurringPeople?.length > 0 && (
                <div className="pattern-finding">
                  <div className="pattern-label">People in Your World</div>
                  <div>{analystData.recurringPeople.map(w => <span key={w} className="tag gold">{w}</span>)}</div>
                </div>
              )}
              {analystData.timePatterns && (
                <div className="pattern-finding">
                  <div className="pattern-label">Writing Patterns</div>
                  <div className="pattern-text">{analystData.timePatterns}</div>
                </div>
              )}
              {analystData.avoidedTopics && (
                <div className="pattern-finding">
                  <div className="pattern-label">Avoided Topics</div>
                  <div className="pattern-text">{analystData.avoidedTopics}</div>
                </div>
              )}
            </>
          )}
          {agent1State === 'waiting' && !analystData && (
            <div style={{ padding: '8px 0', fontFamily: 'Lora,serif', fontSize: 12, color: '#3a2a1a', fontStyle: 'italic' }}>
              Ready to analyse…
            </div>
          )}
        </div>
      </div>

      <div className="handoff">↓ signals passed to Agent 2</div>

      {/* Agent 2 */}
      <div className="agent-card">
        <div className="agent-header">
          <AgentDot state={agent2State} />
          <div className="agent-name">Agent 2 — Pattern Agent</div>
          <div className="agent-status">{stateLabel[agent2State]}</div>
        </div>
        <div className="agent-body">
          {agent2State === 'running' && (
            <div className="loading-state" style={{ height: 80 }}>
              <div className="spinner" /><div className="loading-text" style={{ fontSize: 12 }}>Finding deep patterns…</div>
            </div>
          )}
          {agent2State === 'waiting' && (
            <div style={{ fontFamily: 'Lora,serif', fontSize: 12, color: '#2a1f14', fontStyle: 'italic' }}>
              Waiting for Analyst…
            </div>
          )}
          {patternData && (
            <>
              {[
                { label: 'Core Pattern', key: 'corePattern', style: { color: '#c9960c' } },
                { label: 'Hidden Trigger', key: 'hiddenTrigger', style: {} },
                { label: 'Blind Spot', key: 'blindspot', style: {} },
                { label: 'Strength Signal', key: 'strengthSignal', style: { color: '#5a7a5a' } },
                { label: 'Growth Edge', key: 'growthEdge', style: {} },
                { label: 'Wisdom', key: 'faithInsight', style: { color: '#c9960c', fontStyle: 'italic' } },
              ].map(({ label, key, style }) => patternData[key] && (
                <div key={key} className="pattern-finding">
                  <div className="pattern-label">{label}</div>
                  <div className="pattern-text" style={style}>{patternData[key]}</div>
                </div>
              ))}
              {patternData.nudge && (
                <div style={{ background: '#0d0905', borderRadius: 6, padding: 12, marginTop: 8 }}>
                  <div className="pattern-label">This Week's Nudge</div>
                  <div className="pattern-text">{patternData.nudge}</div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InsightPanel({ open, title, mode, onClose, loading, insightData, quoteData, quoteLoading, weeklyData, patternState }) {
  return (
    <div className={`insight-panel${open ? ' open' : ''}`}>
      <div className="insight-header">
        <div className="insight-title">{title || 'AI Reflection'}</div>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="insight-body">
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <div className="loading-text">Reading between the lines…</div>
          </div>
        )}
        {!loading && mode === 'entry' && insightData && (
          <EntryInsight insight={insightData} quote={quoteData} quoteLoading={quoteLoading} />
        )}
        {!loading && mode === 'weekly' && weeklyData && (
          <WeeklyInsight data={weeklyData} />
        )}
        {!loading && mode === 'pattern' && patternState && (
          <PatternAgentPanel {...patternState} />
        )}
        {!loading && !insightData && !weeklyData && !patternState && (
          <div className="loading-state">
            <div className="loading-text">Something went wrong. Check your API key and try again.</div>
          </div>
        )}
      </div>
    </div>
  )
}
