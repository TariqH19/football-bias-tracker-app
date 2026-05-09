# ⚽ Football Bias Tracker

A heuristics web app that detects disproportionate social media hate directed at footballers and benchmarks it against real on-pitch performance data — exposing bias in football discourse.

## What it does

- Pulls daily social mentions and calculates a **hate score** (negative post ratio per 10k mentions)
- Benchmarks each player's stats against **position-matched peers** in the same league and season
- Computes a **bias gap** — the delta between how much hate they receive vs how poor their form actually is
- Ranks players by an **injustice score** so the most unfairly criticised players surface at the top

## Stack

- **Frontend**: React 18 + Vite
- **Backend/DB**: Supabase (Postgres)
- **Styling**: CSS custom properties (Nexus design system, light + dark mode)
- **Charts**: Inline SVG sparklines
- **Routing**: Hash-based SPA (`#`, `#player/<slug>`, `#methodology`)

## Project structure

```
src/
  lib/
    supabase.js          # Supabase client
  components/
    Nav.jsx              # Top nav with logo + theme toggle
    LeaderboardPage.jsx  # Ranked injustice table with filters
    PlayerPage.jsx       # Player detail — stats, sentiment trend, evidence
    MethodologyPage.jsx  # How the score is calculated + caveats
  App.jsx                # Hash router
  main.jsx               # React entry point
  dashboard.css          # Full design system + component styles
index.html
vite.config.js
.env.example
```

## Setup

```bash
npm install
cp .env.example .env          # add your Supabase URL + anon key
npm run dev
```

## Environment variables

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Database views required

- `v_latest_injustice_scores` — joined view of players + latest score snapshot
- `players` — player metadata (name, club, league, position, nationality, slug)
- `player_season_stats` — season stats per player (npxg, xa, prog_carries, etc.)
- `social_mentions_daily` — daily mention + negative_ratio snapshots
- `evidence_posts` — individual flagged posts with sentiment labels

## Deployment

Deploy to **Cloudflare Pages** or **Vercel**. Set env vars in the dashboard. Build command: `npm run build`. Output dir: `dist`.
