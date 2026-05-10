"""stats_ingest.py

Fetches current-season football stats for each tracked player via the
API-Football (RapidAPI) endpoint and upserts them into `player_season_stats`.

Usage:
  python ingestion/stats_ingest.py

Requires env vars:
  RAPIDAPI_KEY
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import os
import logging
import time
from pathlib import Path

import httpx
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
RAPIDAPI_KEY = os.environ["RAPIDAPI_KEY"]

CURRENT_SEASON = 2025  # Update each season
API_HOST = "api-football-v1.p.rapidapi.com"
RATE_LIMIT_DELAY = 1.2  # seconds between requests (free tier: 100 req/day)


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_players(db: Client) -> list[dict]:
    res = (
        db.table("players")
        .select("id, name, api_football_id, league_id")
        .execute()
    )
    return res.data or []


def fetch_player_stats(api_player_id: int, league_id: int) -> dict | None:
    """Fetch stats from API-Football for a single player."""
    url = f"https://{API_HOST}/players"
    headers = {
        "x-rapidapi-host": API_HOST,
        "x-rapidapi-key": RAPIDAPI_KEY,
    }
    params = {
        "id": api_player_id,
        "season": CURRENT_SEASON,
        "league": league_id,
    }
    try:
        r = httpx.get(url, headers=headers, params=params, timeout=15)
        r.raise_for_status()
        results = r.json().get("response", [])
        if not results:
            return None
        return results[0]
    except httpx.HTTPStatusError as exc:
        log.warning("API-Football error for player %s: %s", api_player_id, exc)
        return None


def extract_stats(raw: dict) -> dict:
    """Map API-Football response fields to our schema columns."""
    stats = raw.get("statistics", [{}])[0]
    goals = stats.get("goals", {})
    passes = stats.get("passes", {})
    dribbles = stats.get("dribbles", {})
    tackles = stats.get("tackles", {})
    duels = stats.get("duels", {})
    games = stats.get("games", {})

    return {
        "season": CURRENT_SEASON,
        "appearances": games.get("appearences") or 0,
        "minutes_played": games.get("minutes") or 0,
        "goals": goals.get("total") or 0,
        "assists": goals.get("assists") or 0,
        "shots_on_target": (stats.get("shots") or {}).get("on") or 0,
        "key_passes": passes.get("key") or 0,
        "pass_accuracy": passes.get("accuracy") or 0.0,
        "dribbles_completed": dribbles.get("success") or 0,
        "tackles": tackles.get("total") or 0,
        "duels_won": duels.get("won") or 0,
        "rating": float(games.get("rating") or 0),
    }


def upsert_stats(db: Client, player_id: str, stats: dict) -> None:
    row = {"player_id": player_id, **stats}
    db.table("player_season_stats").upsert(
        row, on_conflict="player_id,season"
    ).execute()
    log.info("Upserted stats for player_id=%s season=%s", player_id, CURRENT_SEASON)


def run() -> None:
    db = get_supabase()
    players = fetch_players(db)
    log.info("Processing stats for %d players", len(players))

    for player in players:
        api_id = player.get("api_football_id")
        league_id = player.get("league_id")
        if not api_id or not league_id:
            log.warning("Skipping %s — missing api_football_id or league_id", player["name"])
            continue

        raw = fetch_player_stats(api_id, league_id)
        if raw is None:
            log.warning("No stats returned for %s", player["name"])
            continue

        stats = extract_stats(raw)
        upsert_stats(db, player["id"], stats)
        time.sleep(RATE_LIMIT_DELAY)

    log.info("Stats ingestion complete for season %s", CURRENT_SEASON)


if __name__ == "__main__":
    run()
