-- rpc.sql
-- Stored function used by score_calculator.py to join social + stats data
-- Run this in your Supabase SQL editor after schema.sql and views.sql

CREATE OR REPLACE FUNCTION get_scoring_inputs()
RETURNS TABLE (
  player_id      uuid,
  name           text,
  position       text,
  league         text,
  mention_count  int,
  negative_ratio numeric,
  goals          int,
  assists        int,
  minutes_played int,
  rating         numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    p.id            AS player_id,
    p.name,
    p.position,
    p.league,
    COALESCE(s.mention_count, 0)   AS mention_count,
    COALESCE(s.negative_ratio, 0)  AS negative_ratio,
    COALESCE(st.goals, 0)          AS goals,
    COALESCE(st.assists, 0)        AS assists,
    COALESCE(st.minutes_played, 0) AS minutes_played,
    COALESCE(st.rating, 6.0)       AS rating
  FROM players p
  -- Latest social snapshot per player
  LEFT JOIN LATERAL (
    SELECT mention_count, negative_ratio
    FROM social_mentions_daily
    WHERE player_id = p.id
    ORDER BY snapshot_date DESC
    LIMIT 1
  ) s ON true
  -- Latest season stats per player
  LEFT JOIN LATERAL (
    SELECT goals, assists, minutes_played, rating
    FROM player_season_stats
    WHERE player_id = p.id
    ORDER BY season DESC
    LIMIT 1
  ) st ON true;
$$;
