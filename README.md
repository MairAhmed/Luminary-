# Luminary Journal ✦

A private, local-first journaling app with an AI companion that reads between the lines. Built with React + Vite, powered by the Anthropic API, and designed to feel like writing in a quiet parchment notebook under a star-filled sky.

Everything lives on your device — entries, settings, drafts, and chat history are stored in `localStorage`. The only thing that leaves your browser is what you send to Claude when you ask for a reflection.

---

## Features

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

---

## Project Structure

```
luminary-journal/
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
```

---

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

---

## License

Personal / educational use.
