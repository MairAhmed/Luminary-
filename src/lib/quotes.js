// Quote finder tool definition — passed to Claude as a tool
// Claude decides when to call it and what to search for
export const QUOTE_TOOL = {
  name: 'find_quote',
  description:
    'Search for a meaningful quote, verse, hadith, or philosophical saying that resonates with the emotional themes of a journal entry. Use this tool to ground your reflection in real wisdom from the appropriate tradition.',
  input_schema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query — e.g. "patience hardship Islam" or "grief stoicism Marcus Aurelius"',
      },
      tradition: {
        type: 'string',
        enum: ['islam', 'christianity', 'judaism', 'hinduism', 'buddhism', 'secular', 'universal'],
        description: 'Which tradition to search within',
      },
      emotion: {
        type: 'string',
        description: 'The primary emotion in the journal entry e.g. "anxiety", "gratitude", "grief"',
      },
    },
    required: ['query', 'tradition', 'emotion'],
  },
}

// Execute the quote tool — fetches from Quotable API + DuckDuckGo fallback
export async function executeQuoteTool({ query, tradition, emotion }) {
  const results = { query, tradition, emotion, quote: null, source: null, relevance: null, searched: true }

  // Map tradition to search keywords
  const traditionKeywords = {
    islam: 'Quran hadith Islamic',
    christianity: 'Bible verse Christian scripture',
    judaism: 'Torah Talmud Jewish wisdom',
    hinduism: 'Bhagavad Gita Hindu Sanskrit',
    buddhism: 'Buddha Buddhist dharma',
    secular: 'philosophy stoicism',
    universal: 'wisdom philosophy',
  }

  const keyword = traditionKeywords[tradition] || 'wisdom'

  try {
    // Try Quotable API first — free, no key needed
    const tag = emotion === 'anxiety' ? 'inspirational' :
                emotion === 'grief' ? 'sympathy' :
                emotion === 'gratitude' ? 'gratitude' :
                emotion === 'hope' ? 'inspirational' : 'wisdom'

    const res = await fetch(`https://api.quotable.io/random?tags=${tag}&maxLength=200`)
    if (res.ok) {
      const data = await res.json()
      if (data.content) {
        results.quote = data.content
        results.source = data.author
        results.relevance = `This quote on ${emotion} speaks to what you wrote`
        results.apiUsed = 'Quotable API'
        return results
      }
    }
  } catch (e) { /* fall through */ }

  try {
    // Fallback — DuckDuckGo instant answers
    const ddQuery = encodeURIComponent(`${keyword} quote ${emotion} ${query}`)
    const res = await fetch(`https://api.duckduckgo.com/?q=${ddQuery}&format=json&no_html=1&skip_disambig=1`)
    if (res.ok) {
      const data = await res.json()
      if (data.AbstractText) {
        results.quote = data.AbstractText.substring(0, 300)
        results.source = data.AbstractSource || 'Web'
        results.relevance = `Found via web search for "${query}"`
        results.apiUsed = 'DuckDuckGo'
        return results
      }
    }
  } catch (e) { /* fall through */ }

  // Final fallback — curated quotes per tradition
  const fallbacks = {
    islam: { quote: 'Indeed, with hardship comes ease.', source: 'Quran 94:5', relevance: 'A reminder that difficulty is always accompanied by relief.' },
    christianity: { quote: 'I can do all things through Christ who strengthens me.', source: 'Philippians 4:13', relevance: 'A reminder of strength found in faith.' },
    judaism: { quote: 'This too shall pass.', source: 'Jewish proverb', relevance: 'A reminder of the transience of all things.' },
    hinduism: { quote: 'You have the right to perform your actions, but you are not entitled to the fruits of the actions.', source: 'Bhagavad Gita 2:47', relevance: 'On releasing attachment to outcomes.' },
    buddhism: { quote: 'Peace comes from within. Do not seek it without.', source: 'The Buddha', relevance: 'On finding stillness in the present moment.' },
    secular: { quote: 'You have power over your mind, not outside events. Realize this, and you will find strength.', source: 'Marcus Aurelius', relevance: 'A Stoic perspective on inner resilience.' },
    universal: { quote: 'The only way out is through.', source: 'Robert Frost', relevance: 'On facing difficulty with courage.' },
  }

  const fb = fallbacks[tradition] || fallbacks.universal
  return { ...results, ...fb, apiUsed: 'curated' }
}
