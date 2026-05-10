import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useCompare
 * Fetches season stats + injustice scores for two players simultaneously
 * for side-by-side comparison.
 *
 * @param {string|null} slugA
 * @param {string|null} slugB
 */
export function useCompare(slugA, slugB) {
  const [playerA, setPlayerA] = useState(null);
  const [playerB, setPlayerB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slugA || !slugB) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      async function fetchOne(slug) {
        const { data: p, error: pErr } = await supabase
          .from('players')
          .select('*')
          .eq('slug', slug)
          .single();
        if (pErr) throw pErr;

        const [statsRes, scoreRes] = await Promise.all([
          supabase
            .from('player_season_stats')
            .select('*')
            .eq('player_id', p.id)
            .order('season', { ascending: false })
            .limit(1)
            .single(),
          supabase
            .from('player_injustice_scores')
            .select('*')
            .eq('player_id', p.id)
            .order('calculated_at', { ascending: false })
            .limit(1)
            .single(),
        ]);

        return { ...p, stats: statsRes.data, score: scoreRes.data };
      }

      try {
        const [a, b] = await Promise.all([fetchOne(slugA), fetchOne(slugB)]);
        if (!cancelled) {
          setPlayerA(a);
          setPlayerB(b);
        }
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Comparison failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slugA, slugB]);

  return { playerA, playerB, loading, error };
}
