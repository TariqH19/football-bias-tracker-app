import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

const LEAGUES = ['All leagues', 'Premier League', 'La Liga', 'Bundesliga', 'Serie A', 'Ligue 1']

function InjusticeBar({ score }) {
  const pct = Math.min(100, Math.round((score / 10) * 100))
  const color = score >= 7 ? 'var(--color-notification)' : score >= 4 ? 'var(--color-warning)' : 'var(--color-success)'
  return (
    <div className="injustice-bar-wrap" aria-label={`Injustice score ${score.toFixed(1)}`}>
      <div className="injustice-bar" style={{ width: `${pct}%`, background: color }} />
      <span className="injustice-bar-label" style={{ color }}>{score.toFixed(1)}</span>
    </div>
  )
}

function SkeletonRow() {
  return (
    <tr className="skeleton-row">
      <td><div className="skeleton skeleton-text" style={{ width: '1.5rem' }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: '8rem' }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: '5rem' }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: '4rem' }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: '4rem' }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: '4rem' }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: '7rem' }} /></td>
    </tr>
  )
}

export default function LeaderboardPage({ onNavigate }) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [league, setLeague] = useState('All leagues')
  const [search, setSearch] = useState('')

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('v_latest_injustice_scores')
        .select('*')
        .order('injustice_score', { ascending: false })
        .limit(50)

      if (league !== 'All leagues') query = query.eq('league', league)

      const { data, error: sbError } = await query
      if (sbError) throw sbError
      setPlayers(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [league])

  useEffect(() => { fetchPlayers() }, [fetchPlayers])

  const filtered = players.filter(p =>
    p.player_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.club?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <section className="page leaderboard-page" aria-labelledby="leaderboard-title">
      <div className="page-header">
        <div>
          <h1 id="leaderboard-title" className="page-title">Injustice Rankings</h1>
          <p className="page-subtitle">Players receiving the most disproportionate online hate relative to their actual performance</p>
        </div>
        <a href="#methodology" className="btn btn-ghost" onClick={e => { e.preventDefault(); onNavigate('methodology') }}>How scores work</a>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <label htmlFor="player-search" className="sr-only">Search players</label>
          <input
            id="player-search"
            type="search"
            className="search-input"
            placeholder="Search player or club…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="league-filters" role="group" aria-label="Filter by league">
          {LEAGUES.map(l => (
            <button
              key={l}
              className={`filter-btn${league === l ? ' active' : ''}`}
              onClick={() => setLeague(l)}
              aria-pressed={league === l}
            >{l}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <strong>Could not load rankings.</strong> {error}
          <button className="btn btn-ghost" onClick={fetchPlayers} style={{ marginLeft: 'var(--space-4)' }}>Retry</button>
        </div>
      )}

      <div className="table-wrap">
        <table className="leaderboard-table" aria-label="Injustice leaderboard">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Player</th>
              <th scope="col">Club</th>
              <th scope="col">Hate score</th>
              <th scope="col">Perf. %ile</th>
              <th scope="col">Bias gap</th>
              <th scope="col">Injustice score</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : filtered.length === 0
              ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <p>No players found{search ? ` matching "${search}"` : ''}.</p>
                    </div>
                  </td>
                </tr>
              )
              : filtered.map((p, i) => (
                <tr
                  key={p.player_id}
                  className="leaderboard-row"
                  tabIndex={0}
                  onClick={() => onNavigate(`player/${p.slug}`)}
                  onKeyDown={e => e.key === 'Enter' && onNavigate(`player/${p.slug}`)}
                  aria-label={`View ${p.player_name} detail`}
                >
                  <td className="rank-cell">{i + 1}</td>
                  <td className="name-cell">
                    <span className="player-name">{p.player_name}</span>
                    <span className="player-meta">{p.position} · {p.nationality}</span>
                  </td>
                  <td>{p.club}</td>
                  <td className="num">{p.hate_score?.toFixed(1)}</td>
                  <td className="num">{p.performance_percentile}th</td>
                  <td className="num">{p.bias_gap?.toFixed(1)}</td>
                  <td><InjusticeBar score={p.injustice_score ?? 0} /></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </section>
  )
}
