<<<<<<< HEAD
# Luminary Journal ✦

A private, local-first journaling app with an AI companion that reads between the lines. Built with React + Vite, powered by the Anthropic API, and designed to feel like writing in a quiet parchment notebook under a star-filled sky.

Everything lives on your device — entries, settings, drafts, and chat history are stored in `localStorage`. The only thing that leaves your browser is what you send to Claude when you ask for a reflection.
=======
# ✦ Luminary Journal

> An AI-powered smart journaling web app built with React, Vite, and the Anthropic Claude API.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite) ![Anthropic](https://img.shields.io/badge/Claude-Sonnet_4-D97757?logo=anthropic) ![License](https://img.shields.io/badge/license-MIT-gold)

**Live demo:** [MairAhmed.github.io/luminary](https://MairAhmed.github.io/luminary/)

---

## Overview

Luminary Journal is a private, AI-powered journaling app that helps users write freely and understand themselves more deeply. It uses a **multi-agent AI system** built on Anthropic's Claude API, where specialized agents analyze journal entries, find patterns over time, and surface meaningful wisdom from the user's own faith tradition using real-time tool calls.
>>>>>>> b3b4b91d1b66d639abaf7e7287dbfe6980ae283f

---

## Features

<<<<<<< HEAD
### Writing
- **Rich editor** with title, body, mood picker, and tag chips
- **Templates** — Morning Pages, Gratitude, Worry Dump, Evening Review
- **Voice dictation** via the Web Speech API (where supported)
- **Autosave drafts** — nothing is lost if you close the tab mid-entry
- **Word count, reading time, and word-goal progress bar**
- **Dirty-state indicator** + `beforeunload` warning if you have unsaved work
- **Daily rotating prompt** — 15 curated prompts, one per day of year
- **Keyboard shortcuts**: ⌘S save · ⌘Enter reflect · ⌘N new entry · ⌘K chat · ⌘/ settings

### Organizing
- **Search** across title, body, and tags
- **Filter by mood** and toggle between active / archived entries
- **Pin, archive, delete** individual entries from the sidebar
- **Pinned entries float to the top** of your list

### Calendar
- Month grid with **mood-colored dots** on each day
- Click a day with entries to open; click an empty day to start a new one
- "Reflect on this month" — AI summary of your month's arc

### Stats
- **Current streak** + **longest streak** of consecutive writing days
- Total entries, total words, average words per entry
- **30-day mood trend** bar chart and **writing-frequency heatmap**
- **Mood distribution** with percentage breakdown
- "Reflect on this month / year" buttons when you have enough entries

### AI Companion (Claude)
- **Entry Reflection** — summary, themes, emotion scores, a personal reflection, a relevant quote (via a `find_quote` tool call), and a go-deeper prompt
- **Follow-up chat** — continue the conversation about any reflection
- **Weekly Reflection** — patterns, mood arc, growth observations across recent entries
- **Monthly + Yearly Reflection** — wider, more contemplative summaries
- **Pattern Agent** — two-agent pipeline (Analyst extracts signals → Pattern Agent surfaces hidden triggers, blind spots, strength signals, and a weekly nudge)
- **Ask Your Journal** — grounded chat that reads your entries and answers questions honestly, referencing dates when useful
- **Faith-aware tone** — optionally weaves wisdom from Islam, Christianity, Judaism, Hinduism, Buddhism, or a universal spiritual frame

### Settings
- **Theme** — dark (default) or light
- **Font** — serif or sans · **Size** — small / medium / large
- **Word goal** per entry (set to 0 to disable)
- **Reduced motion** toggle (also respects system preference)
- **Ambient sound** toggle for the landing screen
- **Developer debug info** — show tool-call badges in the insight panel

### Landing
- Animated star field with twinkling gold specks
- Optional ambient drone + randomized wind-chime tones
- Ink-drop sound and ink-blot fade transition when entering the app
- Respects `prefers-reduced-motion` automatically

---

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- An Anthropic API key (starts with `sk-ant-`) — get one at [console.anthropic.com](https://console.anthropic.com)

### Install and run

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### Build for production

```bash
npm run build
npm run preview
```

---

## First Run

1. From the landing page, click **Open Your Journal**
2. Enter a name (and optional email) — no account is created on any server
3. Pick a faith preference (or skip for universal reflections)
4. Paste your Anthropic API key into the sidebar
5. Click **+ New Entry** or press ⌘N and start writing
=======
### Core Journaling
- Rich text journal editor with title, mood selector, and word count
- Entries stored locally per user — no backend, no data leaving your device
- Sidebar with full entry history and mood-colored indicators

### AI Agents
The app implements a **4-agent pipeline** powered by Claude Sonnet:

| Agent | Role |
|---|---|
| **Reflection Agent** | Analyzes each entry for themes, emotions, and mood scores. Delivers a warm, personalized reflection. |
| **Quote Finder Agent** | Uses Claude's tool-use capability to call the `find_quote` tool — fetches a real quote, hadith, verse, or philosophical saying matching the entry's themes via external API. |
| **Weekly Reflection Agent** | Reviews the last 7 entries and identifies emotional arcs, recurring themes, and growth patterns. |
| **Pattern Agent (2-step pipeline)** | Agent 1 (Analyst) extracts raw signals across all entries. Agent 2 (Pattern Agent) receives those signals and surfaces deep patterns — hidden triggers, blind spots, strength signals — that the writer may not see themselves. |

### Tool Use (MCP-style)
The Quote Finder is implemented as a **proper Claude tool call**:
- Tool schema defined with `name`, `description`, and `input_schema`
- Claude decides when to invoke `find_quote` and what parameters to pass
- App executes the tool against **Quotable API** → **DuckDuckGo** fallback → curated fallback
- Tool result returned to Claude as `tool_result` block
- Claude incorporates the quote into its final reflection
- The insight panel shows which API was used and the search query

### Faith-Aware Reflections
Users select their faith tradition during onboarding (Islam, Christianity, Judaism, Hinduism, Buddhism, Spiritual, or Secular). The AI adapts its tone and references accordingly — weaving in relevant concepts without imposing.

### UX
- Cinematic landing page with animated star field (Web Audio API ambient drone + star chimes)
- Ink-drop transition animation into the app
- Sliding insight panel with staggered fade-in animations
- Fully responsive — works on desktop and mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5 |
| Styling | Plain CSS with CSS variables |
| AI | Anthropic Claude Sonnet (`claude-sonnet-4-20250514`) |
| Tool Use | Quotable API, DuckDuckGo Instant Answers API |
| Storage | Browser localStorage (per-user, no backend) |
| Deployment | GitHub Pages via GitHub Actions |
>>>>>>> b3b4b91d1b66d639abaf7e7287dbfe6980ae283f

---

## Project Structure

```
luminary-journal/
<<<<<<< HEAD
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    ├── App.jsx              # top-level state, routing, handlers
    ├── index.css            # all styles (themes, components, animations)
    ├── components/
    │   ├── Auth.jsx         # Login + FaithOnboarding
    │   ├── Landing.jsx      # animated landing screen
    │   ├── Sidebar.jsx      # user, API key, nav, search, entry list
    │   ├── Editor.jsx       # writing surface with templates, voice, tags
    │   ├── Calendar.jsx     # month grid
    │   ├── Stats.jsx        # streaks, charts, heatmap
    │   ├── JournalChat.jsx  # Ask Your Journal
    │   ├── InsightPanel.jsx # right-side AI reflection drawer
    │   └── Settings.jsx     # settings modal + ConfirmModal
    └── lib/
        ├── storage.js       # localStorage wrapper + DEFAULTS
        ├── anthropic.js     # all Claude API calls (6 flows)
        └── quotes.js        # find_quote tool definition + executor
=======
├── .github/
│   └── workflows/
│       └── deploy.yml          # Auto-deploy to GitHub Pages on push
├── src/
│   ├── components/
│   │   ├── Landing.jsx         # Animated landing page with star field + sound
│   │   ├── Auth.jsx            # Login + Faith onboarding screens
│   │   ├── Sidebar.jsx         # Entry list, user profile, API key input
│   │   ├── Editor.jsx          # Journal entry editor
│   │   └── InsightPanel.jsx    # AI reflection panel (all 4 agents)
│   ├── lib/
│   │   ├── anthropic.js        # All Claude API calls + tool-use logic
│   │   ├── quotes.js           # Quote finder tool definition + execution
│   │   └── storage.js          # localStorage helpers (per-user)
│   ├── App.jsx                 # Root component — all state and routing
│   ├── main.jsx                # React entry point
│   └── index.css               # Global styles
├── index.html
├── vite.config.js
└── package.json
>>>>>>> b3b4b91d1b66d639abaf7e7287dbfe6980ae283f
```

---

<<<<<<< HEAD
## Privacy

- No backend. No database. No analytics.
- Your API key is stored in `localStorage` on this device only.
- Journal entries never leave your browser unless you click **Reflect with AI**, at which point only the relevant entry (or recent entries for weekly/monthly/pattern flows) is sent directly to `api.anthropic.com`.
- Clearing your browser storage erases everything. Back up by copying entries out manually if that matters to you.

---

## Tech Stack

- **React 18** + **Vite 5**
- **Anthropic Messages API** with tool use (`find_quote`)
- **Web Speech API** for voice dictation
- **Web Audio API** for landing-screen ambience
- Pure CSS — no UI library, no Tailwind, no runtime theming engine

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
=======
## Getting Started

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Run locally

```bash
# Clone the repo
git clone https://github.com/MairAhmed/luminary.git
cd luminary

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Enter your API key
On first launch, enter your Anthropic API key (`sk-ant-...`) in the sidebar. It is stored only in your browser's localStorage and never sent anywhere other than `api.anthropic.com`.

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

## Privacy

- All journal entries are stored in your browser's `localStorage` only
- Your Anthropic API key is stored locally and sent only to `api.anthropic.com`
- No user data is collected, stored on any server, or shared with any third party
- Clearing your browser data will delete your entries
>>>>>>> b3b4b91d1b66d639abaf7e7287dbfe6980ae283f

---

## License

<<<<<<< HEAD
Personal / educational use.
=======
MIT — free to use, fork, and build on.

---

*Built with Claude by Mair Ahmed*
>>>>>>> b3b4b91d1b66d639abaf7e7287dbfe6980ae283f
