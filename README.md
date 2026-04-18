# ✦ Luminary Journal

> An AI-powered smart journaling web app built with React, Vite, and the Anthropic Claude API.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite) ![Anthropic](https://img.shields.io/badge/Claude-Sonnet_4-D97757?logo=anthropic) ![License](https://img.shields.io/badge/license-MIT-gold)

---

## Overview

Luminary Journal is a private, local-first journaling app that helps users write freely and understand themselves more deeply. It uses a **multi-agent AI system** built on Anthropic's Claude API, where specialized agents analyze journal entries, find patterns over time, and surface meaningful wisdom from the user's own faith tradition using real-time tool calls.

Everything lives on your device — entries, settings, drafts, and chat history are stored in `localStorage`. The only thing that leaves your browser is what you send to Claude when you ask for a reflection.

---

## Features

### Writing
- Rich editor with title, body, **mood picker**, and **tag chips**
- **Templates** — Morning Pages, Gratitude, Worry Dump, Evening Review
- **Voice dictation** via the Web Speech API (where supported)
- **Autosave drafts** — nothing is lost if you close the tab mid-entry
- **Word count, reading time, and word-goal progress bar**
- **Dirty-state indicator** + `beforeunload` warning if you have unsaved work
- **Daily rotating prompt** — 15 curated prompts, one per day of year
- Keyboard shortcuts: ⌘S save · ⌘Enter reflect · ⌘N new · ⌘K chat · ⌘/ settings

### Organizing
- **Search** across title, body, and tags
- **Filter by mood** and toggle between active / archived entries
- **Pin, archive, delete** individual entries from the sidebar
- Pinned entries float to the top of your list

### Calendar
- Month grid with **mood-colored dots** on each day
- Click a day with entries to open; click an empty day to start a new one
- "Reflect on this month" — AI summary of your month's arc

### Memory Surfacing
- **On This Day** — if you have an entry from the same date in a prior year, a gold card surfaces above the editor and in the empty state
- **From the Archive** — fallback flashback to a randomly-chosen entry from 30+ days ago (deterministic per day, sage accent)
- Click either card to open the original entry — designed to reward long-term use without feeling intrusive

### Stats
- **Current streak** + **longest streak** of consecutive writing days
- Total entries, total words, average words per entry
- **30-day mood trend** chart and **writing-frequency heatmap**
- **Mood distribution** with percentage breakdown
- Monthly / yearly reflection buttons when you have enough entries

### Settings
- **Theme** — dark (default) or light
- **Font** — serif or sans · **Size** — small / medium / large
- **Word goal** per entry (set to 0 to disable)
- **Reduced motion** toggle (also respects system preference)
- **Ambient sound** toggle for the landing screen
- **Developer debug info** — show tool-call badges in the insight panel

### AI Agents

The app implements a **multi-agent pipeline** powered by Claude Sonnet:

| Agent | Role |
|---|---|
| **Reflection Agent** | Analyzes each entry for themes, emotions, and mood scores. Delivers a warm, personalized reflection. |
| **Quote Finder Agent** | Uses Claude's tool-use capability to call the `find_quote` tool — fetches a real quote, hadith, verse, or philosophical saying matching the entry's themes via external API. |
| **Follow-up Companion** | Continues the conversation about a reflection — brief, warm, emotionally attuned. |
| **Weekly Reflection Agent** | Reviews the last 7 entries and identifies emotional arcs, recurring themes, and growth patterns. |
| **Period Reflection Agent** | Produces monthly and yearly summaries with a wider, more contemplative tone. |
| **Pattern Agent (2-step pipeline)** | Agent 1 (Analyst) extracts raw signals across all entries. Agent 2 (Pattern Agent) receives those signals and surfaces hidden triggers, blind spots, and strength signals the writer may not see themselves. |
| **Future Self Letter** | Reads your recent entries and writes a letter back to you as your future self, 5 years ahead. Warm, grounded, references real themes from your entries — never predicts specific events. Rendered with a wax-seal design, drop cap, and handwritten-style signature. |
| **Ask Your Journal** | Grounded chat that reads your entries and answers questions honestly, referencing dates when useful. |

### Tool Use (MCP-style)

The Quote Finder is implemented as a **proper Claude tool call**:

- Tool schema defined with `name`, `description`, and `input_schema`
- Claude decides when to invoke `find_quote` and what parameters to pass
- App executes the tool against **Quotable API** → **DuckDuckGo** fallback → curated fallback
- Tool result returned to Claude as a `tool_result` block
- Claude incorporates the quote into its final reflection
- The insight panel shows which API was used and the search query

### Faith-Aware Reflections

Users select their faith tradition during onboarding (Islam, Christianity, Judaism, Hinduism, Buddhism, Spiritual, or Secular). The AI adapts its tone and references accordingly — weaving in relevant concepts without imposing.

### UX
- Cinematic landing page with animated star field (Web Audio API ambient drone + randomized wind-chime tones)
- Ink-drop transition animation into the app
- Sliding insight panel with staggered fade-in animations
- Light + dark themes, serif + sans fonts, three font sizes
- Fully keyboard-navigable with ARIA roles

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5 |
| Styling | Plain CSS with CSS variables |
| AI | Anthropic Claude Sonnet (`claude-sonnet-4-20250514`) |
| Tool Use | Quotable API, DuckDuckGo Instant Answers API |
| Voice | Web Speech API (`SpeechRecognition`) |
| Audio | Web Audio API (landing ambience) |
| Storage | Browser `localStorage` (per-user, no backend) |
| Deployment | GitHub Pages via GitHub Actions |

---

## Project Structure

```
luminary-journal/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-deploy to GitHub Pages on push
├── src/
│   ├── components/
│   │   ├── Landing.jsx         # Animated landing page with star field + sound
│   │   ├── Auth.jsx            # Login + Faith onboarding screens
│   │   ├── Sidebar.jsx         # Entry list, search, filters, nav, API key
│   │   ├── Editor.jsx          # Writing surface with templates, voice, tags
│   │   ├── Calendar.jsx        # Month grid with mood dots
│   │   ├── Stats.jsx           # Streaks, trends, heatmap, distribution
│   │   ├── JournalChat.jsx     # Ask Your Journal grounded chat
│   │   ├── InsightPanel.jsx    # Sliding AI reflection drawer
│   │   └── Settings.jsx        # Settings modal + ConfirmModal
│   ├── lib/
│   │   ├── anthropic.js        # All Claude API calls + tool-use logic
│   │   ├── quotes.js           # find_quote tool definition + execution
│   │   └── storage.js          # localStorage helpers + DEFAULTS
│   ├── App.jsx                 # Root — state, routing, handlers, shortcuts
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles + themes
├── index.html
├── vite.config.js
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com) (starts with `sk-ant-`)

### Run locally

```bash
git clone https://github.com/MairAhmed/luminary.git
cd luminary
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for production

```bash
npm run build
npm run preview
```

### First run

1. From the landing page, click **Open Your Journal**
2. Enter a name (and optional email) — no account is created on any server
3. Pick a faith preference (or skip for universal reflections)
4. Paste your Anthropic API key into the sidebar
5. Click **+ New Entry** or press ⌘N and start writing

---

## Deployment

The app auto-deploys to GitHub Pages on every push to `main` via the included GitHub Actions workflow.

```bash
git add .
git commit -m "your message"
git push origin main
```

Live at: `https://MairAhmed.github.io/luminary/`

To deploy to a custom domain, add a `CNAME` file to the repo root with your domain name and update the DNS settings with your provider.

---

## How the Tool Call Works

When you click **✦ Reflect with AI**, the following happens:

1. Your entry text is sent to Claude with the `find_quote` tool definition attached
2. Claude reads the entry, determines a quote is appropriate, and returns a `tool_use` block with parameters like `{ query: "patience hardship", tradition: "islam", emotion: "anxiety" }`
3. The app intercepts the `tool_use` block and calls the Quotable API with those parameters
4. The API result is returned to Claude as a `tool_result` message
5. Claude incorporates the real quote into its final reflection
6. The insight panel displays the quote with a `⚙ find_quote tool called` badge showing the API used

This is a real agentic tool-use pattern — Claude is deciding when to search and what to search for, not the app.

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| ⌘ / Ctrl + N | New entry |
| ⌘ / Ctrl + S | Save entry |
| ⌘ / Ctrl + Enter | Reflect on current entry |
| ⌘ / Ctrl + K | Open Ask Your Journal |
| ⌘ / Ctrl + / | Open Settings |
| Esc | Close insight panel / modal |

---

## Privacy

- All journal entries are stored in your browser's `localStorage` only
- Your Anthropic API key is stored locally and sent only to `api.anthropic.com`
- No user data is collected, stored on any server, or shared with any third party
- Clearing your b