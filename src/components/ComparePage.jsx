import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'

// ─── Stat categories shown in comparison ────────────────────────────────────────────
const STAT_GROUPS = [
  {
    label: 'Attacking',
    stats: [
      { key: 'goals',           label: 'Goals' },
      { key: 'assists',         label: 'Assists' },
      { key: 'xg',              label: 'xG' },
      { key: 'xa',              label: 'xA' },
      { key: 'shots_on_target', label: 'Shots on target' },
    ],
  },
  {
    label: 'Possession',
    stats: [
      { key: 'key_passes',      label: 'Key passes' },
      { key: 'dribbles',        label: 'Dribbles completed' },
      { key: 'pass_accuracy',   label: 'Pass accuracy %' },
      { key: 'chances_created', label: 'Chances created' },
    ],
  },
  {
    label: 'Defensive',
    stats: [
      { key: 'tackles',         label: 'Tackles' },
      { key: 'interceptions',   label: 'Interceptions' },
      { key: 'clearances',      label: 'Clearances' },
      { key: 'blocks',          label: 'Blocks' },
    ],
  },
  {
    label: 'Social pressure',
    stats: [
      { key: 'hate_score',            label: 'Hate score' },
      { key: 'negative_ratio',        label: 'Negative ratio %' },
      { key: 'abuse_count',           label: 'Abuse posts (7d)' },
      { key: 'performance_percentile',label: 'Perf. percentile' },
      { key: 'injustice_score',       label: 'Injustice score' },
    ],
  },
]

// ─── Single bar comparing two values ────────────────────────────────────────────────
function CompareBar({ labelA, valA, labelB, valB, higherIsBetter = true }) {
  const a = parseFloat(valA) || 0
  const b = parseFloat(valB) || 0
  const max = Math.max(a, b, 0.01)
  const pctA = (a / max) * 100
  const pctB = (b / max) * 100
  const aWins = higherIsBetter ? a >= b : a <= b
  const bWins = higherIsBetter ? b > a : b < a

  return (
    <div className="compare-bar-row" aria-label={`${labelA}: ${valA ?? 'n/a'}, ${labelB}: ${valB ?? 'n/a'}`}>
      <span className={`compare-val compare-val-a${aWins ? ' compare-winner' : ''}`}>
        {valA != null ? (typeof valA === 'number' ? valA.toFixed(1) : valA) : '—'}
      </span>
      <div className="compare-bars">
        <div className="compare-track compare-track-a">
          <div
            className={`compare-fill compare-fill-a${aWins ? ' compare-fill-winner' : ''}`}
            style={{ width: `${pctA}%` }}
          />
        </div>
        <div className="compare-track compare-track-b">
          <div
            className={`compare-fill compare-fill-b${bWins ? ' compare-fill-winner' : ''}`}
            style={{ width: `${pctB}%` }}
          />
        </div>
      </div>
      <span className={`compare-val compare-val-b${bWins ? ' compare-winner' : ''}`}>
        {valB != null ? (typeof valB === 'number' ? valB.toFixed(1) : valB) : '—'}
      </span>
    </div>
  )
}

// ─── Player search autocomplete ──────────────────────────────────────────────────────
function PlayerSearch({ id, label, value, onSelect, exclude }) {
  const [query, setQuery] = useState(value?.name ?? '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)

  // Fix: players table uses 'name' column (not 'player_name').
  // Fix: exclude filter uses 'id' (the PK on players table, not player_id).
  const search = useCallback(async (q) => {
    if (q.length < 2) { setResults([]); return }
    const { data } = await supabase
      .from('players')
      .select('id, name, club, position, slug')
      .ilike('name', `%${q}%`)
      .neq('id', exclude?.id ?? '')
      .limit(8)
    setResults(data ?? [])
  }, [exclude])

  useEffect(() => {
    const t = setTimeout(() => search(query), 250)
    return () => clearTimeout(t)
  }, [query, search])

  const pick = (player) => {
    setQuery(player.name)
    setResults([])
    setOpen(false)
    onSelect(player)
  }

  return (
    <div className="player-search" role="combobox" aria-expanded={open && results.length > 0} aria-haspopup="listbox">
      <label htmlFor={id} className="player-search-label">{label}</label>
      <input
        id={id}
        type="search"
        className="search-input"
        placeholder="Type a player name…"
        value={query}
        autoComplete="off"
        onChange={e => { setQuery(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        aria-label={label}
        aria-autocomplete="list"
        aria-controls={`${id}-listbox`}
      />
      {open && results.length > 0 && (
        <ul id={`${id}-listbox`} className="search-dropdown" role="listbox">
          {results.map(p => (
            <li
              key={p.id}
              role="option"
              className="search-option"
              onMouseDown={() => pick(p)}
            >
              <span className="search-option-name">{p.name}</span>
              <span className="search-option-meta">{p.position} · {p.club}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Injustice verdict banner ──────────────────────────────────────────────────────
function InjusticeVerdict({ playerA, playerB, statsA, statsB }) {
  if (!statsA || !statsB) return null
  const scoreA = statsA.injustice_score ?? 0
  const scoreB = statsB.injustice_score ?? 0
  const perfA  = statsA.performance_percentile ?? 0
  const perfB  = statsB.performance_percentile ?? 0
  const hateA  = statsA.hate_score ?? 0
  const hateB  = statsB.hate_score ?? 0

  const gapHate = hateA - hateB
  const gapPerf = perfA - perfB

  // Fix: bias requires a meaningful hate gap (>=1.5) AND a performance gap
  // that does NOT justify the extra hate — i.e. the more-hated player is
  // not performing substantially worse (within 15 percentile points).
  const HATE_THRESHOLD = 1.5
  const PERF_JUSTIFY_THRESHOLD = 15
  const moreHatedAHasUnfairHate = gapHate >= HATE_THRESHOLD && gapPerf >= -PERF_JUSTIFY_THRESHOLD
  const moreHatedBHasUnfairHate = gapHate <= -HATE_THRESHOLD && gapPerf <= PERF_JUSTIFY_THRESHOLD
  const biased = moreHatedAHasUnfairHate || moreHatedBHasUnfairHate

  if (!biased) {
    return (
      <div className="verdict verdict-neutral">
        <strong>No clear bias detected</strong>
        <p>Both players receive hate broadly proportional to their performance difference.</p>
      </div>
    )
  }

  const moreHated = gapHate > 0 ? playerA : playerB
  const other     = gapHate > 0 ? playerB : playerA

  return (
    <div className="verdict verdict-bias">
      <strong>
        {moreHated.name} receives disproportionate hate
      </strong>
      <p>
        {moreHated.name} is performing at a similar or better level to {other.name} yet
        absorbs {Math.abs(gapHate).toFixed(1)} more hate score points online.
      </p>
    </div>
  )
}

// ─── Main page ──────────────────────────────────────────────────────────────────────
export default function ComparePage({ initialSlugA, initialSlugB, onNavigate }) {
  const [playerA, setPlayerA] = useState(null)
  const [playerB, setPlayerB] = useState(null)
  const [statsA,  setStatsA]  = useState(null)
  const [statsB,  setStatsB]  = useState(null)
  const [loadingA, setLoadingA] = useState(false)
  const [loadingB, setLoadingB] = useState(false)
  const [error, setError] = useState(null)

  // Load player + their latest injustice scores + season stats
  const loadPlayer = useCallback(async (slugOrObj, side) => {
    const setLoading = side === 'a' ? setLoadingA : setLoadingB
    const setPlayer  = side === 'a' ? setPlayerA  : setPlayerB
    const setStats   = side === 'a' ? setStatsA   : setStatsB

    if (!slugOrObj) { setPlayer(null); setStats(null); return }

    setLoading(true)
    setError(null)
    try {
      // Resolve player if we only have a slug string
      let player = typeof slugOrObj === 'object' ? slugOrObj : null
      if (!player) {
        const { data, error: e } = await supabase
          .from('players')
          .select('id, name, club, position, nationality, slug')
          .eq('slug', slugOrObj)
          .single()
        if (e) throw e
        player = data
      }
      setPlayer(player)

      // Latest injustice scores view — keyed on players.id
      const { data: scores, error: e2 } = await supabase
        .from('v_latest_injustice_scores')
        .select('*')
        .eq('player_id', player.id)
        .single()
      if (e2 && e2.code !== 'PGRST116') throw e2

      // Season stats
      const { data: seasonStats, error: e3 } = await supabase
        .from('player_season_stats')
        .select('*')
        .eq('player_id', player.id)
        .order('season', { ascending: false })
        .limit(1)
        .single()
      if (e3 && e3.code !== 'PGRST116') throw e3

      setStats({ ...scores, ...seasonStats })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Boot from URL slugs if provided
  useEffect(() => {
    if (initialSlugA) loadPlayer(initialSlugA, 'a')
    if (initialSlugB) loadPlayer(initialSlugB, 'b')
  }, [initialSlugA, initialSlugB, loadPlayer])

  const handleSelectA = (p) => loadPlayer(p, 'a')
  const handleSelectB = (p) => loadPlayer(p, 'b')

  const readyToCompare = playerA && playerB && !loadingA && !loadingB

  return (
    <section className="page compare-page" aria-labelledby="compare-title">
      <div className="page-header">
        <div>
          <h1 id="compare-title" className="page-title">Compare Players</h1>
          <p className="page-subtitle">Side-by-side stats and social pressure — see who’s treated fairly</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => onNavigate('')}
          aria-label="Back to leaderboard"
        >
          ← Leaderboard
        </button>
      </div>

      {/* Player pickers */}
      <div className="compare-pickers">
        <div className="compare-picker-slot">
          <PlayerSearch
            id="player-a"
            label="Player A"
            value={playerA}
            onSelect={handleSelectA}
            exclude={playerB}
          />
          {playerA && (
            <div className="compare-player-badge">
              <span className="compare-player-name">{playerA.name}</span>
              <span className="compare-player-meta">{playerA.position} · {playerA.club}</span>
              {loadingA && <span className="compare-loading-dot" aria-label="Loading" />}
            </div>
          )}
        </div>

        <div className="compare-vs" aria-hidden="true">vs</div>

        <div className="compare-picker-slot">
          <PlayerSearch
            id="player-b"
            label="Player B"
            value={playerB}
            onSelect={handleSelectB}
            exclude={playerA}
          />
          {playerB && (
            <div className="compare-player-badge compare-player-badge-b">
              <span className="compare-player-name">{playerB.name}</span>
              <span className="compare-player-meta">{playerB.position} · {playerB.club}</span>
              {loadingB && <span className="compare-loading-dot" aria-label="Loading" />}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <strong>Error loading player data.</strong> {error}
        </div>
      )}

      {/* Bias verdict */}
      {readyToCompare && (
        <InjusticeVerdict
          playerA={playerA} playerB={playerB}
          statsA={statsA}   statsB={statsB}
        />
      )}

      {/* Stat groups */}
      {readyToCompare && STAT_GROUPS.map(group => (
        <div key={group.label} className="compare-group">
          <h2 className="compare-group-label">{group.label}</h2>
          <div className="compare-group-header" aria-hidden="true">
            <span>{playerA.name}</span>
            <span />
            <span style={{ textAlign: 'right' }}>{playerB.name}</span>
          </div>
          {group.stats.map(({ key, label }) => (
            <div key={key} className="compare-stat-row">
              <span className="compare-stat-label">{label}</span>
              <CompareBar
                labelA={playerA.name}
                labelB={playerB.name}
                valA={statsA?.[key]}
                valB={statsB?.[key]}
                higherIsBetter={key !== 'hate_score' && key !== 'negative_ratio' && key !== 'abuse_count'}
              />
            </div>
          ))}
        </div>
      ))}

      {/* Empty prompt */}
      {!playerA && !playerB && (
        <div className="empty-state">
          <p>Search for two players above to start comparing their stats and social pressure.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('')}>
            Browse leaderboard
          </button>
        </div>
      )}

      {/* One player picked, waiting for second */}
      {(playerA || playerB) && !(playerA && playerB) && (
        <div className="empty-state" style={{ paddingTop: 'var(--space-8)' }}>
          <p>Now search for a second player to compare against.</p>
        </div>
      )}
    </section>
  )
}
