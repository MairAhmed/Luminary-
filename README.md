# ✦ Luminary Journal

> An AI-powered smart journaling web app built with React, Vite, and the Anthropic Claude API.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite) ![Anthropic](https://img.shields.io/badge/Claude-Sonnet_4-D97757?logo=anthropic) ![License](https://img.shields.io/badge/license-MIT-gold)

**Live demo:** [MairAhmed.github.io/luminary](https://MairAhmed.github.io/luminary/)

---

## Overview

Luminary Journal is a private, AI-powered journaling app that helps users write freely and understand themselves more deeply. It uses a **multi-agent AI system** built on Anthropic's Claude API, where specialized agents analyze journal entries, find patterns over time, and surface meaningful wisdom from the user's own faith tradition using real-time tool calls.

---

## Features

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
```

---

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

---

## License

MIT — free to use, fork, and build on.

---

*Built with Claude by Mair Ahmed*
