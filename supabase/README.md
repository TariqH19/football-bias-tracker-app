# Supabase Setup

## Quick Start

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Database → SQL Editor** in your Supabase dashboard
3. Run the files in this order:

```
1. schema.sql   — creates all tables, indexes, RLS policies
2. views.sql    — creates v_latest_injustice_scores, v_player_full, v_player_social_7d
3. seed.sql     — inserts 10 demo players with stats, social data, and injustice scores
```

4. Copy your **Project URL** and **anon key** from **Project Settings → API**
5. In the repo root, copy `.env.example` to `.env` and fill in both values:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

6. Run the app:

```bash
npm install
npm run dev
```

---

## Schema Overview

| Table | Purpose |
|---|---|
| `players` | Player identity — name, club, league, position |
| `player_season_stats` | Per-season FBref-style stats, performance percentile vs peers |
| `social_mentions_daily` | Daily mention counts, negative ratio, hate score per player |
| `injustice_scores` | Computed bias score: hate_score minus expected criticism |
| `evidence_posts` | Sample negative posts shown on the player detail page |

## Views

| View | Used By |
|---|---|
| `v_latest_injustice_scores` | LeaderboardPage — ranked list |
| `v_player_full` | PlayerPage, ComparePage — full player detail |
| `v_player_social_7d` | PlayerPage — sparkline trend |

## Injustice Score Formula

```
hate_score         = weighted negative mentions per 1000 total mentions (7-day avg)
expectation_score  = (100 - performance_pctile) / 10
                     → top performer (pctile=90) has low expected criticism (1.0)
                     → bottom performer (pctile=10) has high expected criticism (9.0)
injustice_score    = hate_score - expectation_score
bias_gap           = clamp((injustice_score / 5) × 100, -100, +100)
```

A **positive bias_gap** means the player receives more hate than their performance warrants.
A **negative bias_gap** means they receive less criticism than expected.

---

## Adding Real Data

Once you have a live ingestion pipeline:
- Insert rows into `social_mentions_daily` daily via a cron job or Supabase Edge Function
- Re-compute `injustice_scores` nightly with the same formula
- Add real players via the `players` and `player_season_stats` tables
- The views update automatically — no migration needed
