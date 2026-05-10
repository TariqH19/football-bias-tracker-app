-- ============================================================
-- Football Bias Tracker — Database Schema
-- Run this in Supabase SQL Editor (Database > SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------
-- 1. players
-- ------------------------------------------------------------
create table if not exists public.players (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,          -- e.g. "marcus-rashford"
  name        text not null,
  club        text not null,
  league      text not null,                 -- e.g. "Premier League"
  position    text not null,                 -- "FW", "MF", "DF", "GK"
  nationality text,
  age         int,
  photo_url   text,
  created_at  timestamptz default now()
);

-- ------------------------------------------------------------
-- 2. player_season_stats
-- One row per player per season.
-- All stats are role-normalised per 90 minutes.
-- ------------------------------------------------------------
create table if not exists public.player_season_stats (
  id                  uuid primary key default uuid_generate_v4(),
  player_id           uuid not null references public.players(id) on delete cascade,
  season              text not null,          -- e.g. "2024-25"
  league              text not null,
  appearances         int,
  goals               numeric(5,2),
  assists             numeric(5,2),
  np_xg_per90         numeric(5,3),           -- non-penalty expected goals per 90
  xa_per90            numeric(5,3),           -- expected assists per 90
  progressive_carries numeric(5,2),
  progressive_passes  numeric(5,2),
  sca_per90           numeric(5,3),           -- shot-creating actions per 90
  gca_per90           numeric(5,3),           -- goal-creating actions per 90
  tackles_per90       numeric(5,3),
  interceptions_per90 numeric(5,3),
  pressures_per90     numeric(5,3),
  save_pct            numeric(5,2),           -- GK only
  performance_pctile  numeric(5,2),           -- computed peer percentile 0-100
  peer_group_size     int,
  created_at          timestamptz default now(),
  unique(player_id, season)
);

-- ------------------------------------------------------------
-- 3. social_mentions_daily
-- One row per player per day.
-- Populated by the ingestion pipeline (Python / Edge Function).
-- ------------------------------------------------------------
create table if not exists public.social_mentions_daily (
  id              uuid primary key default uuid_generate_v4(),
  player_id       uuid not null references public.players(id) on delete cascade,
  mention_date    date not null,
  total_mentions  int default 0,
  negative_count  int default 0,
  positive_count  int default 0,
  neutral_count   int default 0,
  negative_ratio  numeric(5,4) generated always as (
    case when total_mentions = 0 then 0
         else negative_count::numeric / total_mentions
    end
  ) stored,
  hate_score      numeric(8,4) default 0,    -- weighted negativity score
  sources         text[] default array[]::text[],
  created_at      timestamptz default now(),
  unique(player_id, mention_date)
);

-- ------------------------------------------------------------
-- 4. injustice_scores
-- One row per player per scoring run (daily).
-- ------------------------------------------------------------
create table if not exists public.injustice_scores (
  id                  uuid primary key default uuid_generate_v4(),
  player_id           uuid not null references public.players(id) on delete cascade,
  scored_at           timestamptz default now(),
  hate_score          numeric(8,4) not null,
  performance_pctile  numeric(5,2) not null,
  expectation_score   numeric(8,4) not null,
  injustice_score     numeric(8,4) not null,   -- hate_score - expectation_score
  bias_gap            numeric(8,4) not null,   -- injustice normalised -100 to +100
  sample_days         int default 7
);

-- ------------------------------------------------------------
-- 5. evidence_posts
-- Sample negative posts linked to a player for display.
-- ------------------------------------------------------------
create table if not exists public.evidence_posts (
  id          uuid primary key default uuid_generate_v4(),
  player_id   uuid not null references public.players(id) on delete cascade,
  source      text not null,                  -- "twitter", "reddit", "youtube"
  post_text   text not null,
  sentiment   text not null,                  -- "negative", "positive", "neutral"
  abuse_score numeric(5,4) default 0,
  posted_at   timestamptz,
  collected_at timestamptz default now()
);

-- ------------------------------------------------------------
-- Indexes for common query patterns
-- ------------------------------------------------------------
create index if not exists idx_social_player_date   on public.social_mentions_daily(player_id, mention_date desc);
create index if not exists idx_injustice_player_at  on public.injustice_scores(player_id, scored_at desc);
create index if not exists idx_injustice_score_desc on public.injustice_scores(injustice_score desc);
create index if not exists idx_players_league       on public.players(league);
create index if not exists idx_players_slug         on public.players(slug);
create index if not exists idx_evidence_player      on public.evidence_posts(player_id, posted_at desc);

-- ------------------------------------------------------------
-- Row Level Security (RLS) — public read, no anonymous writes
-- ------------------------------------------------------------
alter table public.players               enable row level security;
alter table public.player_season_stats   enable row level security;
alter table public.social_mentions_daily enable row level security;
alter table public.injustice_scores      enable row level security;
alter table public.evidence_posts        enable row level security;

create policy "Public read players"
  on public.players for select using (true);

create policy "Public read stats"
  on public.player_season_stats for select using (true);

create policy "Public read social"
  on public.social_mentions_daily for select using (true);

create policy "Public read injustice"
  on public.injustice_scores for select using (true);

create policy "Public read evidence"
  on public.evidence_posts for select using (true);
