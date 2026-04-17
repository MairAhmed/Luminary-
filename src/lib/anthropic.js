import { QUOTE_TOOL, executeQuoteTool } from './quotes.js'

const CLAUDE_MODEL = 'claude-sonnet-4-20250514'

async function callAnthropic(apiKey, { system, messages, tools, maxTokens = 1000 }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      system,
      messages,
      ...(tools ? { tools } : {}),
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data
}

// FAITH SYSTEM PROMPTS
export function getFaithContext(faith) {
  const map = {
    islam: "The user follows Islam. Where natural and appropriate, gently weave in Islamic wisdom — concepts like sabr (patience), tawakkul (trust in Allah), shukr (gratitude), and Quranic themes of mercy. Never impose, always invite.",
    christianity: "The user follows Christianity. Where appropriate, gently reference themes of grace, forgiveness, hope, and God's love.",
    judaism: "The user follows Judaism. Where appropriate, gently reference teshuvah, chesed, and Jewish traditions of reflection.",
    hinduism: "The user follows Hinduism. Where appropriate, reference dharma, karma, and inner peace.",
    buddhism: "The user follows Buddhism. Where appropriate, reference impermanence, mindfulness, and karuna.",
    spiritual: "The user is spiritually inclined. Reference themes of inner wisdom, interconnectedness, and mindfulness.",
  }
  return map[faith] || ''
}

// AGENT 1: Entry Reflection with Quote Tool
export async function runEntryReflection(apiKey, { entryText, faith }) {
  const faithContext = getFaithContext(faith)
  const system = [
    'You are a compassionate journal companion.',
    faithContext,
    'Analyze the journal entry and reflect warmly.',
    'You have access to the find_quote tool — USE IT to find one meaningful quote that resonates with this entry.',
    'Respond in JSON (no markdown fences):',
    '{ "summary": "...", "themes": [...], "emotion": "...", "emotionScore": { "joy": 0-100, "peace": 0-100, "energy": 0-100, "tension": 0-100 }, "reflection": "...", "prompt": "..." }',
  ].filter(Boolean).join(' ')

  const response1 = await callAnthropic(apiKey, {
    system,
    messages: [{ role: 'user', content: `Journal entry:\n\n${entryText}` }],
    tools: [QUOTE_TOOL],
    maxTokens: 1500,
  })

  let quoteResult = null
  let finalText = ''

  if (response1.stop_reason === 'tool_use') {
    const toolUseBlock = response1.content.find(b => b.type === 'tool_use')
    if (toolUseBlock && toolUseBlock.name === 'find_quote') {
      quoteResult = await executeQuoteTool(toolUseBlock.input)
      const response2 = await callAnthropic(apiKey, {
        system,
        messages: [
          { role: 'user', content: `Journal entry:\n\n${entryText}` },
          { role: 'assistant', content: response1.content },
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: toolUseBlock.id,
              content: JSON.stringify(quoteResult),
            }],
          },
        ],
        tools: [QUOTE_TOOL],
        maxTokens: 1000,
      })
      finalText = response2.content.find(b => b.type === 'text')?.text || ''
    }
  } else {
    finalText = response1.content.find(b => b.type === 'text')?.text || ''
  }

  let parsed
  try {
    parsed = JSON.parse(finalText.replace(/```json|```/g, '').trim())
  } catch {
    parsed = { summary: finalText, themes: [], emotion: 'unknown', emotionScore: {}, reflection: finalText, prompt: '' }
  }

  return { insight: parsed, quote: quoteResult }
}

// AGENT 2: Weekly Reflection
export async function runWeeklyReflection(apiKey, { entries, faith }) {
  const faithContext = getFaithContext(faith)
  const system = [
    'You are a wise journal analyst. Analyze multiple entries for patterns, growth, and themes.',
    faithContext,
    'Respond in JSON (no markdown fences):',
    '{ "weekSummary": "...", "dominantThemes": [...], "moodArc": "...", "growthObservation": "...", "weeklyPrompt": "..." }',
  ].filter(Boolean).join(' ')

  const text = entries
    .map((e, i) => `[Entry ${i + 1} — ${new Date(parseInt(e.id) || e.savedAt).toLocaleDateString()}]\n${e.title}\n${e.body}`)
    .join('\n\n---\n\n')

  const response = await callAnthropic(apiKey, {
    system,
    messages: [{ role: 'user', content: `Recent journal entries:\n\n${text}` }],
  })

  const raw = response.content[0].text
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return { weekSummary: raw, dominantThemes: [], moodArc: '', growthObservation: '', weeklyPrompt: '' }
  }
}

// NEW: Monthly / Yearly reflection (same shape as weekly)
export async function runPeriodReflection(apiKey, { entries, faith, period }) {
  const faithContext = getFaithContext(faith)
  const system = [
    `You are a wise journal analyst. Analyze journal entries over a ${period} for themes, arcs, and growth.`,
    faithContext,
    'Your tone should match the timescale — wider, more reflective, and less immediate than a weekly view.',
    'Respond in JSON (no markdown fences):',
    '{ "summary": "...", "dominantThemes": [...], "moodArc": "...", "growthObservation": "...", "risingPattern": "...", "closingPrompt": "..." }',
  ].filter(Boolean).join(' ')

  const text = entries
    .map((e, i) => `[Entry ${i + 1} — ${new Date(parseInt(e.id) || e.savedAt).toLocaleDateString()}]\n${e.title}\n${e.body}`)
    .join('\n\n---\n\n')

  const response = await callAnthropic(apiKey, {
    system,
    messages: [{ role: 'user', content: `Entries from this ${period}:\n\n${text}` }],
    maxTokens: 1400,
  })

  const raw = response.content[0].text
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch {
    return { summary: raw, dominantThemes: [], moodArc: '', growthObservation: '', risingPattern: '', closingPrompt: '' }
  }
}

// AGENT 3: Analyst
export async function runAnalystAgent(apiKey, { entries }) {
  const system = 'You are a clinical journal analyst. Extract raw signals only — no warmth, just data. Respond in JSON (no markdown): { "entryCount": number, "recurringWords": [...], "recurringPeople": [...], "recurringPlaces": [...], "emotionalSpikes": [...], "timePatterns": "...", "avoidedTopics": "...", "writingLengthTrend": "..." }'
  const text = entries.map((e, i) => `[Entry ${i + 1}] ${e.title}\n${e.body}`).join('\n\n---\n\n')
  const response = await callAnthropic(apiKey, {
    system,
    messages: [{ role: 'user', content: text }],
  })
  const raw = response.content[0].text
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()) }
  catch { return {} }
}

// AGENT 4: Pattern Agent
export async function runPatternAgent(apiKey, { analystOutput, faith }) {
  const faithContext = getFaithContext(faith)
  const system = [
    'You are a deeply perceptive pattern recognition agent — part psychologist, part life coach.',
    'You receive structured signals from an Analyst agent and find deep human patterns.',
    faithContext,
    'Be warm but honest. Respond in JSON (no markdown):',
    '{ "corePattern": "...", "hiddenTrigger": "...", "growthEdge": "...", "blindspot": "...", "strengthSignal": "...", "faithInsight": "...", "nudge": "..." }',
  ].filter(Boolean).join(' ')

  const response = await callAnthropic(apiKey, {
    system,
    messages: [{ role: 'user', content: `Analyst signals:\n${JSON.stringify(analystOutput, null, 2)}` }],
  })
  const raw = response.content[0].text
  try { return JSON.parse(raw.replace(/```json|```/g, '').trim()) }
  catch { return {} }
}

// NEW: Follow-up conversation for a single entry reflection
export async function runFollowUp(apiKey, { entryText, faith, insight, history, userMessage }) {
  const faithContext = getFaithContext(faith)
  const system = [
    'You are a compassionate journal companion continuing a reflection with the user.',
    faithContext,
    'You already gave them an initial reflection. Now they are asking a follow-up. Answer warmly, briefly (2-4 sentences), and with emotional attunement. No JSON — just prose.',
  ].filter(Boolean).join(' ')

  const context = `Original entry:\n${entryText}\n\nYour initial reflection summary: ${insight?.summary || ''}\nPrompt you gave: ${insight?.prompt || ''}`
  const messages = [
    { role: 'user', content: context },
    { role: 'assistant', content: 'I have your original reflection in mind. What would you like to explore?' },
    ...(history || []).flatMap(h => [
      { role: 'user', content: h.user },
      { role: 'assistant', content: h.assistant },
    ]),
    { role: 'user', content: userMessage },
  ]

  const response = await callAnthropic(apiKey, { system, messages, maxTokens: 600 })
  return response.content[0]?.text || ''
}

// NEW: Ask-my-journal chat — grounded in entries
export async function runJournalChat(apiKey, { entries, faith, history, userMessage }) {
  const faithContext = getFaithContext(faith)
  const system = [
    'You are "Luminary" — a warm, insightful companion who has read the user\'s journal entries.',
    faithContext,
    'Answer the user\'s question grounded in what they\'ve written. Reference entries by date when useful. If you truly have no data on something, say so honestly. Keep replies conversational (2-5 sentences). No JSON.',
  ].filter(Boolean).join(' ')

  // Keep context tight — last 30 entries, truncated
  const recent = (entries || []).slice(0, 30)
  const corpus = recent
    .map(e => {
      const date = new Date(parseInt(e.id) || e.savedAt).toLocaleDateString()
      const body = (e.body || '').slice(0, 800)
      const moodStr = e.mood ? ` [mood: ${e.mood}]` : ''
      return `[${date}]${moodStr} ${e.title || 'Untitled'}\n${body}`
    })
    .join('\n\n---\n\n')

  const messages = [
    { role: 'user', content: `Here are my recent journal entries:\n\n${corpus}` },
    { role: 'assistant', content: "I've read them. What would you like to explore?" },
    ...(history || []).flatMap(h => [
      { role: 'user', content: h.user },
      { role: 'assistant', content: h.assistant },
    ]),
    { role: 'user', content: userMessage },
  ]

  const response = await callAnthropic(apiKey, { system, messages, maxTokens: 700 })
  return response.content[0]?.text || ''
}
