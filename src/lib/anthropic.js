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

  // First call — Claude may call the quote tool
  const response1 = await callAnthropic(apiKey, {
    system,
    messages: [{ role: 'user', content: `Journal entry:\n\n${entryText}` }],
    tools: [QUOTE_TOOL],
    maxTokens: 1500,
  })

  let quoteResult = null
  let finalText = ''

  // Handle tool use in the response
  if (response1.stop_reason === 'tool_use') {
    const toolUseBlock = response1.content.find(b => b.type === 'tool_use')
    if (toolUseBlock && toolUseBlock.name === 'find_quote') {
      // Execute the tool
      quoteResult = await executeQuoteTool(toolUseBlock.input)

      // Second call — give Claude the tool result
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

// AGENT 3 (Analyst) + AGENT 4 (Pattern Agent) — two-agent pipeline
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
