-- ============================================================
-- Football Bias Tracker — Seed Data (demo / development)
-- Run AFTER schema.sql and views.sql
-- This gives you 10 real Premier League + La Liga players
-- with plausible stats so the app renders without needing
-- a live ingestion pipeline.
-- ============================================================

-- Clear existing seed data cleanly
truncate public.evidence_posts,
         public.injustice_scores,
         public.social_mentions_daily,
         public.player_season_stats,
         public.players
cascade;

-- ------------------------------------------------------------
-- Players
-- ------------------------------------------------------------
insert into public.players (id, slug, name, club, league, position, nationality, age) values
  ('00000001-0000-0000-0000-000000000001', 'marcus-rashford',  'Marcus Rashford',  'Man United',  'Premier League', 'FW', 'England',   26),
  ('00000001-0000-0000-0000-000000000002', 'gabriel-jesus',    'Gabriel Jesus',    'Arsenal',     'Premier League', 'FW', 'Brazil',    27),
  ('00000001-0000-0000-0000-000000000003', 'mason-mount',      'Mason Mount',      'Man United',  'Premier League', 'MF', 'England',   25),
  ('00000001-0000-0000-0000-000000000004', 'kalvin-phillips',  'Kalvin Phillips',  'West Ham',    'Premier League', 'MF', 'England',   28),
  ('00000001-0000-0000-0000-000000000005', 'raheem-sterling',  'Raheem Sterling',  'Chelsea',     'Premier League', 'FW', 'England',   29),
  ('00000001-0000-0000-0000-000000000006', 'jadon-sancho',     'Jadon Sancho',     'Chelsea',     'Premier League', 'FW', 'England',   24),
  ('00000001-0000-0000-0000-000000000007', 'ansu-fati',        'Ansu Fati',        'Barcelona',   'La Liga',        'FW', 'Spain',     21),
  ('00000001-0000-0000-0000-000000000008', 'ferran-torres',    'Ferran Torres',    'Barcelona',   'La Liga',        'FW', 'Spain',     24),
  ('00000001-0000-0000-0000-000000000009', 'dani-ceballos',    'Dani Ceballos',    'Real Madrid', 'La Liga',        'MF', 'Spain',     27),
  ('00000001-0000-0000-0000-000000000010', 'eden-hazard',      'Eden Hazard',      'Real Madrid', 'La Liga',        'FW', 'Belgium',   32);

-- ------------------------------------------------------------
-- Season Stats (2024-25)
-- ------------------------------------------------------------
insert into public.player_season_stats
  (player_id, season, league, appearances, goals, assists,
   np_xg_per90, xa_per90, progressive_carries, progressive_passes,
   sca_per90, gca_per90, tackles_per90, interceptions_per90, pressures_per90,
   performance_pctile, peer_group_size)
values
  -- Rashford: strong underlying numbers, heavy hate ratio -> high injustice
  ('00000001-0000-0000-0000-000000000001', '2024-25', 'Premier League', 28, 8, 5, 0.38, 0.18, 72, 41, 3.12, 0.54, 0.82, 0.45, 9.4,  72, 48),
  -- Jesus: clinical when fit, often scapegoated for Arsenal misfires
  ('00000001-0000-0000-0000-000000000002', '2024-25', 'Premier League', 22, 6, 7, 0.42, 0.31, 58, 29, 3.45, 0.71, 1.12, 0.62, 14.1, 68, 48),
  -- Mount: low appearances due to injury, unfairly trolled
  ('00000001-0000-0000-0000-000000000003', '2024-25', 'Premier League', 14, 2, 3, 0.21, 0.24, 34, 52, 2.88, 0.41, 1.34, 0.78, 11.2, 55, 48),
  -- Phillips: rotational, very high hate vs. contribution
  ('00000001-0000-0000-0000-000000000004', '2024-25', 'Premier League', 12, 0, 1, 0.08, 0.11, 18, 38, 1.65, 0.18, 2.21, 1.14, 15.6, 38, 48),
  -- Sterling: consistent output, frequently racially targeted
  ('00000001-0000-0000-0000-000000000005', '2024-25', 'Premier League', 25, 7, 4, 0.31, 0.19, 81, 35, 3.22, 0.58, 0.71, 0.38, 8.9,  65, 48),
  -- Sancho: good creative numbers, toxic press narrative
  ('00000001-0000-0000-0000-000000000006', '2024-25', 'Premier League', 20, 5, 6, 0.28, 0.29, 67, 44, 3.54, 0.63, 0.88, 0.52, 9.7,  70, 48),
  -- Ansu Fati: injury-affected, high expectations unfairly maintained
  ('00000001-0000-0000-0000-000000000007', '2024-25', 'La Liga',        18, 3, 2, 0.24, 0.14, 42, 22, 2.91, 0.42, 0.61, 0.31, 7.2,  51, 44),
  -- Ferran Torres: streaky, disproportionate criticism after droughts
  ('00000001-0000-0000-0000-000000000008', '2024-25', 'La Liga',        26, 9, 3, 0.41, 0.16, 55, 31, 3.08, 0.55, 0.74, 0.39, 8.8,  74, 44),
  -- Ceballos: solid holding mid, consistently underwhelmed expectations narrative
  ('00000001-0000-0000-0000-000000000009', '2024-25', 'La Liga',        22, 1, 4, 0.09, 0.21, 27, 71, 2.44, 0.31, 2.54, 1.21, 18.3, 62, 44),
  -- Hazard: retirement-era, still mockery overload
  ('00000001-0000-0000-0000-000000000010', '2024-25', 'La Liga',         8, 0, 0, 0.06, 0.05,  9, 12, 0.88, 0.09, 0.44, 0.22, 4.1,  18, 44);

-- ------------------------------------------------------------
-- Social Mentions (last 7 days, one row per player per day)
-- Generated with plausible but illustrative numbers
-- ------------------------------------------------------------
do $$
declare
  d date;
  pid uuid;
  base_hate numeric;
  base_total int;
  pids uuid[] := array[
    '00000001-0000-0000-0000-000000000001',
    '00000001-0000-0000-0000-000000000002',
    '00000001-0000-0000-0000-000000000003',
    '00000001-0000-0000-0000-000000000004',
    '00000001-0000-0000-0000-000000000005',
    '00000001-0000-0000-0000-000000000006',
    '00000001-0000-0000-0000-000000000007',
    '00000001-0000-0000-0000-000000000008',
    '00000001-0000-0000-0000-000000000009',
    '00000001-0000-0000-0000-000000000010'
  ];
  base_hates numeric[] := array[0.42, 0.28, 0.31, 0.55, 0.35, 0.29, 0.24, 0.19, 0.21, 0.61];
  base_totals int[]    := array[12400, 4200, 3800, 2100, 5600, 4900, 2800, 3100, 1400, 3300];
begin
  foreach pid in array pids loop
    base_hate  := base_hates[array_position(pids, pid)];
    base_total := base_totals[array_position(pids, pid)];
    for i in 0..6 loop
      d := current_date - i;
      insert into public.social_mentions_daily
        (player_id, mention_date, total_mentions, negative_count, positive_count, neutral_count, hate_score, sources)
      values (
        pid,
        d,
        base_total + (random() * 800 - 400)::int,
        ((base_total + (random() * 800 - 400)::int) * (base_hate + (random() * 0.06 - 0.03)))::int,
        ((base_total + (random() * 800 - 400)::int) * 0.25)::int,
        ((base_total + (random() * 800 - 400)::int) * 0.35)::int,
        base_hate * base_total / 1000.0 + (random() * 0.5 - 0.25),
        array['twitter', 'reddit']
      );
    end loop;
  end loop;
end $$;

-- ------------------------------------------------------------
-- Injustice Scores (one per player, today)
-- formula: injustice = hate_score - (100 - performance_pctile) / 10
-- bias_gap = clamp((injustice_score / 5) * 100, -100, 100)
-- ------------------------------------------------------------
insert into public.injustice_scores
  (player_id, hate_score, performance_pctile, expectation_score, injustice_score, bias_gap, sample_days)
select
  s.player_id,
  avg(m.hate_score)                                             as hate_score,
  s.performance_pctile,
  (100 - s.performance_pctile) / 10.0                          as expectation_score,
  avg(m.hate_score) - (100 - s.performance_pctile) / 10.0     as injustice_score,
  least(100, greatest(-100,
    ((avg(m.hate_score) - (100 - s.performance_pctile) / 10.0) / 5.0) * 100
  ))                                                            as bias_gap,
  7                                                             as sample_days
from public.player_season_stats s
join public.social_mentions_daily m on m.player_id = s.player_id
where m.mention_date >= current_date - 6
group by s.player_id, s.performance_pctile;

-- ------------------------------------------------------------
-- Evidence Posts (2 negative examples per player)
-- ------------------------------------------------------------
insert into public.evidence_posts (player_id, source, post_text, sentiment, abuse_score, posted_at)
values
  ('00000001-0000-0000-0000-000000000001', 'twitter', 'Rashford is absolutely useless, should never play for England again', 'negative', 0.82, now() - interval '1 day'),
  ('00000001-0000-0000-0000-000000000001', 'reddit',  'How is Rashford still starting? Comfortably the worst performer this season', 'negative', 0.61, now() - interval '2 days'),
  ('00000001-0000-0000-0000-000000000002', 'twitter', 'Jesus is a fraud, Arsenal wasted millions on him', 'negative', 0.74, now() - interval '1 day'),
  ('00000001-0000-0000-0000-000000000002', 'reddit',  'Every big game Jesus disappears, totally unreliable', 'negative', 0.58, now() - interval '3 days'),
  ('00000001-0000-0000-0000-000000000003', 'twitter', 'Mount has been a complete disaster since joining United, massive flop', 'negative', 0.79, now() - interval '1 day'),
  ('00000001-0000-0000-0000-000000000003', 'reddit',  'Mason Mount is not a top 6 midfielder, never was never will be', 'negative', 0.55, now() - interval '4 days'),
  ('00000001-0000-0000-0000-000000000004', 'twitter', 'Kalvin Phillips is the worst signing in Premier League history', 'negative', 0.88, now() - interval '1 day'),
  ('00000001-0000-0000-0000-000000000004', 'reddit',  'How is he still at the club, completely useless in possession', 'negative', 0.71, now() - interval '2 days'),
  ('00000001-0000-0000-0000-000000000005', 'twitter', 'Sterling should retire, finished at the highest level', 'negative', 0.66, now() - interval '1 day'),
  ('00000001-0000-0000-0000-000000000005', 'reddit',  'Can''t believe Chelsea paid that much for him', 'negative', 0.49, now() - interval '3 days'),
  ('00000001-0000-0000-0000-000000000006', 'twitter', 'Sancho has been invisible all season, bring someone else in', 'negative', 0.61, now() - interval '1 day'),
  ('00000001-0000-0000-0000-000000000006', 'reddit',  'Sancho is only good in glimpses but consistently disappoints', 'negative', 0.52, now() - interval '2 days'),
  ('00000001-0000-0000-0000-000000000007', 'twitter', 'Ansu Fati is a one-season wonder, Barcelona should cut losses', 'negative', 0.59, now() - interval '1 day'),
  ('00000001-0000-0000-0000-000000000007', 'reddit',  'Hype around Fati was nonsense, just another average La Liga winger', 'negative', 0.47, now() - interval '2 days'),
  ('00000001-0000-0000-0000-000000000008', 'twitter', 'Ferran Torres is inconsistent and shouldn''t start for Barca', 'negative', 0.54, now() - interval '1 day'),
  ('00000001-0000-0000-0000-000000000008', 'reddit',  'When Torres misses an easy one it''s so painful, not good enough', 'negative', 0.44, now() - interval '3 days'),
  ('00000001-0000-0000-0000-000000000009', 'twitter', 'Ceballos is average at best, Real Madrid should have moved him on years ago', 'negative', 0.48, now() - interval '1 day'),
  ('00000001-0000-0000-0000-000000000009', 'reddit',  'Never understood the praise for Ceballos, solid but not special', 'negative', 0.38, now() - interval '4 days'),
  ('00000001-0000-0000-0000-000000000010', 'twitter', 'Hazard has been the worst signing in football history no debate', 'negative', 0.91, now() - interval '1 day'),
  ('00000001-0000-0000-0000-000000000010', 'reddit',  'Hazard''s career is an absolute tragedy, fat and lazy', 'negative', 0.85, now() - interval '2 days');
