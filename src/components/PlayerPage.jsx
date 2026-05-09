import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

function Sparkline({ data, width = 200, height = 48 }) {
  if (!data || data.length < 2) return null
  const values = data.map(d => d.negative_ratio ?? 0)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 8) - 4
    return `${x},${y}`
  }).join(' ')
  const fillPts = `0,${height} ${pts} ${width},${height}`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="sparkline">
      <polygon points={fillPts} fill="var(--color-notification)" opacity="0.12" />
      <polyline points={pts} fill="none" stroke="var(--color-notification)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

function StatCard({ label, value, sub, highlight }) {
  return (
    <div className={`stat-card${highlight ? ' stat-card--highlight' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value ?? '—'}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}

function PercentileBar({ label, value }) {
  const pct = Math.min(100, value ?? 0)
  return (
    <div className="percentile-row">
      <span className="percentile-label">{label}</span>
      <div className="percentile-track">
        <div className="percentile-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="percentile-value">{pct}th</span>
    </div>
  )
}

export default function PlayerPage({ slug, onNavigate }) {
  const [player, setPlayer] = useState(null)
  const [stats, setStats] = useState(null)
  const [dailyMentions, setDailyMentions] = useState([])
  const [evidence, setEvidence] = useState([])
  const [score, setScore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!slug) return
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [{ data: playerData, error: e1 }] = await Promise.all([
          supabase.from('players').select('*').eq('slug', slug).single()
        ])
        if (e1) throw e1
        setPlayer(playerData)

        const [statsRes, scoreRes, mentionsRes, evidenceRes] = await Promise.all([
          supabase.from('player_season_stats').select('*').eq('player_id', playerData.id).order('season', { ascending: false }).limit(1).single(),
          supabase.from('v_latest_injustice_scores').select('*').eq('player_id', playerData.id).single(),
          supabase.from('social_mentions_daily').select('date,negative_ratio,total_mentions').eq('player_id', playerData.id).order('date', { ascending: true }).limit(30),
          supabase.from('evidence_posts').select('*').eq('player_id', playerData.id).order('created_at', { ascending: false }).limit(6)
        ])

        if (statsRes.data) setStats(statsRes.data)
        if (scoreRes.data) setScore(scoreRes.data)
        if (mentionsRes.data) setDailyMentions(mentionsRes.data)
        if (evidenceRes.data) setEvidence(evidenceRes.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

  if (loading) return (
    <section className="page">
      <div className="player-skeleton">
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-text" style={{ width: '60%' }} />
        <div className="stats-grid" style={{ marginTop: 'var(--space-8)' }}>
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      </div>
    </section>
  )

  if (error || !player) return (
    <section className="page">
      <div className="error-banner" role="alert">
        <strong>Player not found.</strong> {error}
        <button className="btn btn-ghost" onClick={() => onNavigate('')} style={{ marginLeft: 'var(--space-4)' }}>Back to rankings</button>
      </div>
    </section>
  )

  const injusticeColor = score?.injustice_score >= 7 ? 'var(--color-notification)' : score?.injustice_score >= 4 ? 'var(--color-warning)' : 'var(--color-success)'

  return (
    <section className="page player-page" aria-labelledby="player-title">
      <button className="back-btn" onClick={() => onNavigate('')} aria-label="Back to rankings">
        ← Rankings
      </button>

      <div className="player-header">
        <div className="player-identity">
          <h1 id="player-title" className="page-title">{player.name}</h1>
          <div className="player-tags">
            <span className="tag">{player.club}</span>
            <span className="tag">{player.league}</span>
            <span className="tag">{player.position}</span>
            <span className="tag">{player.nationality}</span>
          </div>
        </div>
        {score && (
          <div className="injustice-score-badge" style={{ borderColor: injusticeColor }}>
            <span className="injustice-badge-label">Injustice score</span>
            <span className="injustice-badge-value" style={{ color: injusticeColor }}>{score.injustice_score?.toFixed(1)}</span>
            <span className="injustice-badge-sub">out of 10</span>
          </div>
        )}
      </div>

      <div className="two-col">
        {/* Left: Social signal */}
        <div className="col-panel">
          <h2 className="panel-heading">Social pressure</h2>
          {score && (
            <div className="kpi-row">
              <StatCard label="Hate score" value={score.hate_score?.toFixed(1)} sub="negative posts / 10k mentions" highlight />
              <StatCard label="Bias gap" value={score.bias_gap?.toFixed(1)} sub="hate minus expected" />
            </div>
          )}
          {dailyMentions.length > 0 && (
            <div className="sparkline-wrap">
              <p className="spark-label">Negativity trend — last 30 days</p>
              <Sparkline data={dailyMentions} width={320} height={56} />
              <div className="spark-axis">
                <span>{dailyMentions[0]?.date}</span>
                <span>{dailyMentions[dailyMentions.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Performance */}
        <div className="col-panel">
          <h2 className="panel-heading">Performance vs peers</h2>
          {score && (
            <div className="percentile-list">
              <PercentileBar label="Overall percentile" value={score.performance_percentile} />
            </div>
          )}
          {stats && (
            <div className="stats-grid">
              <StatCard label="npxG" value={stats.npxg?.toFixed(2)} sub="non-penalty expected goals" />
              <StatCard label="xA" value={stats.xa?.toFixed(2)} sub="expected assists" />
              <StatCard label="Prog. carries" value={stats.progressive_carries} sub="per 90" />
              <StatCard label="Prog. passes" value={stats.progressive_passes} sub="per 90" />
              <StatCard label="Press %" value={stats.press_regain_pct ? `${stats.press_regain_pct}%` : null} sub="pressing regain rate" />
              <StatCard label="Mins played" value={stats.minutes_played} sub={`Season ${stats.season ?? ''}`} />
            </div>
          )}
        </div>
      </div>

      {evidence.length > 0 && (
        <div className="evidence-section">
          <h2 className="panel-heading">Sample flagged posts</h2>
          <p className="evidence-note">Posts classified as abusive or disproportionately negative. Sarcasm and context errors are possible — see <a href="#methodology" onClick={e => { e.preventDefault(); onNavigate('methodology') }}>methodology</a>.</p>
          <ul className="evidence-list" role="list">
            {evidence.map(post => (
              <li key={post.id} className="evidence-item">
                <div className="evidence-meta">
                  <span className="tag tag--source">{post.source}</span>
                  <span className="evidence-date">{post.created_at?.slice(0, 10)}</span>
                  <span className="tag tag--sentiment">{post.sentiment_label}</span>
                </div>
                <p className="evidence-text">{post.content}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="injustice-verdict">
        <h2 className="panel-heading">Why this may be unfair</h2>
        {score && stats ? (
          <p>
            {player.name} has a performance percentile of <strong>{score.performance_percentile}th</strong> among
            {' '}{player.position}s in the {player.league} this season, yet receives a hate score of
            {' '}<strong>{score.hate_score?.toFixed(1)}</strong> — a bias gap of
            {' '}<strong>{score.bias_gap?.toFixed(1)}</strong>.
            {score.bias_gap > 3
              ? ' The criticism they receive appears significantly disproportionate to their actual output.'
              : ' The gap is moderate — some criticism may reflect performance concerns, but the intensity of online abuse goes beyond the numbers.'
            }
          </p>
        ) : (
          <p className="text-muted">Score data not yet available for this player.</p>
        )}
      </div>
    </section>
  )
}
