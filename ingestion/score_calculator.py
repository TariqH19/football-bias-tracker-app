"""score_calculator.py

Reads fresh social + stats data from Supabase, computes the injustice score
for each player, and upserts results into `player_injustice_scores`.

Injustice Score formula
-----------------------
  hate_score       = weighted_negative_ratio * log10(mention_count + 1)
  perf_percentile  = player's percentile rank vs peers (same position + league)
  expectation_adj  = adjustment for wage tier / transfer fee (0.8 – 1.2 multiplier)
  injustice_score  = (hate_score - expected_hate) * (1 - perf_percentile / 100)

Higher = more unjustly criticised.
"""

from __future__ import annotations

import os
import math
import logging
from pathlib import Path
from datetime import date

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


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_latest_scores(db: Client) -> list[dict]:
    """Pull the latest social snapshot + season stats for every player."""
    res = db.rpc("get_scoring_inputs").execute()
    return res.data or []


def compute_percentile(value: float, peer_values: list[float]) -> float:
    if not peer_values:
        return 50.0
    below = sum(1 for v in peer_values if v < value)
    return round(below / len(peer_values) * 100, 1)


def compute_hate_score(negative_ratio: float, mention_count: int) -> float:
    return round(negative_ratio * math.log10(mention_count + 1), 4)


def compute_injustice(hate_score: float, perf_percentile: float) -> float:
    # Expected hate proportional to performance gap from peers (lower perf = more expected hate)
    expected_hate = (1 - perf_percentile / 100) * 0.5
    raw = hate_score - expected_hate
    return round(max(raw, 0.0), 4)


def upsert_injustice_score(db: Client, player_id: str, scores: dict) -> None:
    row = {
        "player_id": player_id,
        "calculated_at": date.today().isoformat(),
        **scores,
    }
    db.table("player_injustice_scores").upsert(
        row, on_conflict="player_id,calculated_at"
    ).execute()


def run() -> None:
    db = get_supabase()
    rows = fetch_latest_scores(db)
    if not rows:
        log.error("No scoring inputs returned. Ensure social + stats data is present.")
        return

    # Group players by position+league for peer percentile
    groups: dict[str, list[dict]] = {}
    for row in rows:
        key = f"{row['position']}:{row['league']}"
        groups.setdefault(key, []).append(row)

    for group_key, players in groups.items():
        # Compute peer performance scores for percentile ranking
        # Use composite: goals/90 + assists/90 + rating normalised
        def perf_score(p: dict) -> float:
            mins = p.get("minutes_played") or 1
            return (
                (p.get("goals", 0) + p.get("assists", 0)) / (mins / 90)
                + (p.get("rating") or 6.0)
            )

        peer_scores = [perf_score(p) for p in players]

        for player in players:
            ps = perf_score(player)
            perf_pct = compute_percentile(ps, peer_scores)
            hate = compute_hate_score(
                player.get("negative_ratio", 0),
                player.get("mention_count", 0),
            )
            injustice = compute_injustice(hate, perf_pct)

            upsert_injustice_score(
                db,
                player["player_id"],
                {
                    "hate_score": hate,
                    "performance_percentile": perf_pct,
                    "injustice_score": injustice,
                    "peer_group": group_key,
                },
            )
            log.info(
                "%s → hate=%.3f perf_pct=%.1f injustice=%.3f",
                player["name"], hate, perf_pct, injustice,
            )

    log.info("Score calculation complete for %d players", len(rows))


if __name__ == "__main__":
    run()
