import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase.js";

const LEAGUES = [
  "All leagues",
  "Premier League",
  "La Liga",
  "Bundesliga",
  "Serie A",
  "Ligue 1",
];

function InjusticeBar({ score = 0 }) {
  const safeScore = Number(score) || 0;
  const pct = Math.min(100, Math.round((safeScore / 10) * 100));
  const color =
    safeScore >= 7
      ? "var(--color-notification)"
      : safeScore >= 4
        ? "var(--color-warning)"
        : "var(--color-success)";

  return (
    <div
      className="injustice-bar-wrap"
      aria-label={`Injustice score ${safeScore.toFixed(1)}`}>
      <div
        className="injustice-bar"
        style={{ width: `${pct}%`, background: color }}
      />
      <span className="injustice-bar-label" style={{ color }}>
        {safeScore.toFixed(1)}
      </span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr className="skeleton-row">
      <td>
        <div className="skeleton skeleton-text" style={{ width: "1.5rem" }} />
      </td>
      <td>
        <div className="skeleton skeleton-text" style={{ width: "8rem" }} />
      </td>
      <td>
        <div className="skeleton skeleton-text" style={{ width: "5rem" }} />
      </td>
      <td>
        <div className="skeleton skeleton-text" style={{ width: "4rem" }} />
      </td>
      <td>
        <div className="skeleton skeleton-text" style={{ width: "4rem" }} />
      </td>
      <td>
        <div className="skeleton skeleton-text" style={{ width: "4rem" }} />
      </td>
      <td>
        <div className="skeleton skeleton-text" style={{ width: "7rem" }} />
      </td>
    </tr>
  );
}

export default function LeaderboardPage({ onNavigate }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [league, setLeague] = useState("All leagues");
  const [search, setSearch] = useState("");

  const fetchPlayers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: sbError } = await supabase
        .from("v_latest_injustice_scores")
        .select("*")
        .order("injustice_score", { ascending: false })
        .limit(50);

      if (sbError) throw sbError;

      setPlayers(data || []);
    } catch (err) {
      setError(err.message || "Unknown error");
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const filtered = useMemo(() => {
    return players.filter((p) => {
      const playerName = p.player_name || p.name || "";
      const club = p.club || "";
      const leagueName = p.league || p.competition_name || "";

      const matchesSearch =
        playerName.toLowerCase().includes(search.toLowerCase()) ||
        club.toLowerCase().includes(search.toLowerCase());

      const matchesLeague =
        league === "All leagues" ? true : leagueName === league;

      return matchesSearch && matchesLeague;
    });
  }, [players, search, league]);

  return (
    <section
      className="page leaderboard-page"
      aria-labelledby="leaderboard-title">
      <div className="page-header">
        <div>
          <h1 id="leaderboard-title" className="page-title">
            Injustice Rankings
          </h1>
          <p className="page-subtitle">
            Players receiving the most disproportionate online hate relative to
            their actual performance
          </p>
        </div>
        <a
          href="#methodology"
          className="btn btn-ghost"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("methodology");
          }}>
          How scores work
        </a>
      </div>

      <div className="toolbar">
        <div className="search-wrap">
          <label htmlFor="player-search" className="sr-only">
            Search players
          </label>
          <input
            id="player-search"
            type="search"
            className="search-input"
            placeholder="Search player or club…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div
          className="league-filters"
          role="group"
          aria-label="Filter by league">
          {LEAGUES.map((l) => (
            <button
              key={l}
              className={`filter-btn${league === l ? " active" : ""}`}
              onClick={() => setLeague(l)}
              aria-pressed={league === l}
              type="button">
              {l}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <strong>Could not load rankings.</strong> {error}
          <button
            className="btn btn-ghost"
            onClick={fetchPlayers}
            style={{ marginLeft: "var(--space-4)" }}
            type="button">
            Retry
          </button>
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
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <p>
                      No players found
                      {search ? ` matching "${search}"` : ""}
                      {league !== "All leagues" ? ` in ${league}` : ""}.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((p, i) => {
                const playerName = p.player_name || p.name || "Unknown player";
                const playerMeta = [p.position, p.nationality]
                  .filter(Boolean)
                  .join(" · ");
                const playerSlug = p.slug || p.player_id;
                const performancePercentile =
                  p.performance_percentile ?? p.performance_score ?? null;

                return (
                  <tr
                    key={p.player_id || p.id || i}
                    className="leaderboard-row"
                    tabIndex={0}
                    onClick={() => onNavigate(`player/${playerSlug}`)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && onNavigate(`player/${playerSlug}`)
                    }
                    aria-label={`View ${playerName} detail`}>
                    <td className="rank-cell">{i + 1}</td>
                    <td className="name-cell">
                      <span className="player-name">{playerName}</span>
                      <span className="player-meta">
                        {playerMeta || "Profile data unavailable"}
                      </span>
                    </td>
                    <td>{p.club || "—"}</td>
                    <td className="num">
                      {p.hate_score != null
                        ? Number(p.hate_score).toFixed(1)
                        : "—"}
                    </td>
                    <td className="num">
                      {performancePercentile != null
                        ? `${Math.round(Number(performancePercentile))}th`
                        : "—"}
                    </td>
                    <td className="num">
                      {p.bias_gap != null ? Number(p.bias_gap).toFixed(1) : "—"}
                    </td>
                    <td>
                      <InjusticeBar score={Number(p.injustice_score ?? 0)} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
