import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * usePlayer
 * Fetches full player profile, latest season stats, last 14 days of social
 * snapshots, and a sample of negative evidence posts.
 *
 * @param {string} slug – player URL slug (e.g. "marcus-rashford")
 */
export function usePlayer(slug) {
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState(null);
  const [social, setSocial] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // 1. Player profile
        const { data: playerData, error: playerErr } = await supabase
          .from('players')
          .select('*')
          .eq('slug', slug)
          .single();
        if (playerErr) throw playerErr;
        if (!playerData) throw new Error('Player not found');

        const playerId = playerData.id;

        // 2. Season stats + injustice score + social (parallel)
        const [statsRes, scoreRes, socialRes, evidenceRes] = await Promise.all([
          supabase
            .from('player_season_stats')
            .select('*')
            .eq('player_id', playerId)
            .order('season', { ascending: false })
            .limit(1)
            .single(),

          supabase
            .from('player_injustice_scores')
            .select('*')
            .eq('player_id', playerId)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .single(),

          supabase
            .from('social_mentions_daily')
            .select('snapshot_date, mention_count, negative_ratio, abuse_count')
            .eq('player_id', playerId)
            .order('snapshot_date', { ascending: false })
            .limit(14),

          supabase
            .from('evidence_posts')
            .select('id, platform, text, posted_at, engagement_score, is_abuse')
            .eq('player_id', playerId)
            .order('engagement_score', { ascending: false })
            .limit(5),
        ]);

        if (!cancelled) {
          setPlayer(playerData);
          setStats(statsRes.data ?? null);
          setScore(scoreRes.data ?? null);
          setSocial(socialRes.data ?? []);
          setEvidence(evidenceRes.data ?? []);
        }
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load player');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  return { player, stats, social, evidence, score, loading, error };
}
