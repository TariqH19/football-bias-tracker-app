import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useLeaderboard
 * Fetches the latest injustice scores from the `v_latest_injustice_scores` view.
 *
 * @param {object} filters
 * @param {string} [filters.league]   – league slug to filter by
 * @param {string} [filters.search]   – partial player name search
 * @param {number} [filters.limit=50] – max rows
 */
export function useLeaderboard({ league = null, search = '', limit = 50 } = {}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('v_latest_injustice_scores')
        .select('*')
        .order('injustice_score', { ascending: false })
        .limit(limit);

      if (league) query = query.eq('league', league);
      if (search) query = query.ilike('player_name', `%${search}%`);

      const { data: rows, error: err } = await query;
      if (err) throw err;
      setData(rows ?? []);
    } catch (err) {
      setError(err.message ?? 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [league, search, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
