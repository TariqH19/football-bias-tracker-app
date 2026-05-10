-- ============================================================
-- Football Bias Tracker — Views
-- Run AFTER schema.sql
-- ============================================================

-- ------------------------------------------------------------
-- v_latest_injustice_scores
-- Most recent injustice score per player, joined to player info.
-- Used by LeaderboardPage.jsx
-- ------------------------------------------------------------
create or replace view public.v_latest_injustice_scores as
select
  p.id            as player_id,
  p.slug,
  p.name,
  p.club,
  p.league,
  p.position,
  p.photo_url,
  i.hate_score,
  i.performance_pctile,
  i.expectation_score,
  i.injustice_score,
  i.bias_gap,
  i.scored_at
from public.players p
join lateral (
  select *
  from public.injustice_scores
  where player_id = p.id
  order by scored_at desc
  limit 1
) i on true;

-- ------------------------------------------------------------
-- v_player_social_7d
-- Last 7 days of social mentions per player, for sparklines.
-- Used by PlayerPage.jsx
-- ------------------------------------------------------------
create or replace view public.v_player_social_7d as
select
  player_id,
  mention_date,
  total_mentions,
  negative_count,
  positive_count,
  negative_ratio,
  hate_score
from public.social_mentions_daily
where mention_date >= current_date - interval '7 days'
order by player_id, mention_date asc;

-- ------------------------------------------------------------
-- v_player_full
-- Player info + latest season stats + latest injustice score.
-- Used by PlayerPage.jsx and ComparePage.jsx
-- ------------------------------------------------------------
create or replace view public.v_player_full as
select
  p.id            as player_id,
  p.slug,
  p.name,
  p.club,
  p.league,
  p.position,
  p.nationality,
  p.age,
  p.photo_url,
  s.season,
  s.appearances,
  s.goals,
  s.assists,
  s.np_xg_per90,
  s.xa_per90,
  s.progressive_carries,
  s.progressive_passes,
  s.sca_per90,
  s.gca_per90,
  s.tackles_per90,
  s.interceptions_per90,
  s.pressures_per90,
  s.save_pct,
  s.performance_pctile,
  s.peer_group_size,
  i.hate_score,
  i.injustice_score,
  i.bias_gap,
  i.scored_at
from public.players p
left join lateral (
  select * from public.player_season_stats
  where player_id = p.id
  order by season desc limit 1
) s on true
left join lateral (
  select * from public.injustice_scores
  where player_id = p.id
  order by scored_at desc limit 1
) i on true;
