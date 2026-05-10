"""social_ingest.py

Fetches recent tweets mentioning each tracked player, runs VADER sentiment
analysis, then upserts daily mention/negativity snapshots into Supabase.

Usage:
  python ingestion/social_ingest.py

Requires env vars:
  TWITTER_BEARER_TOKEN
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
"""

from __future__ import annotations

import os
import sys
import logging
from datetime import date, timedelta
from pathlib import Path

import httpx
from dotenv import load_dotenv
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from supabase import create_client, Client

load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)

TWITTER_BEARER = os.environ["TWITTER_BEARER_TOKEN"]
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

# Abuse / negativity keywords for football context
HATE_KEYWORDS = [
    "useless", "trash", "terrible", "worst", "overrated", "fraud",
    "benched", "sell him", "waste", "embarrassing", "pathetic",
    "shocking", "disgrace", "clown", "terrible",
]

MAX_RESULTS = 100  # Twitter API v2 max per request


def get_supabase() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_players(db: Client) -> list[dict]:
    """Return all tracked players with their Twitter search query."""
    res = db.table("players").select("id, name, twitter_query").execute()
    return res.data or []


def search_tweets(query: str, start_time: str) -> list[dict]:
    """Search recent tweets via Twitter API v2."""
    url = "https://api.twitter.com/2/tweets/search/recent"
    headers = {"Authorization": f"Bearer {TWITTER_BEARER}"}
    params = {
        "query": f"{query} lang:en -is:retweet",
        "max_results": MAX_RESULTS,
        "start_time": start_time,
        "tweet.fields": "created_at,text,public_metrics",
    }
    try:
        r = httpx.get(url, headers=headers, params=params, timeout=15)
        r.raise_for_status()
        return r.json().get("data", [])
    except httpx.HTTPStatusError as exc:
        log.warning("Twitter API error for query '%s': %s", query, exc)
        return []


def analyse_tweets(tweets: list[dict]) -> dict:
    """Return aggregated sentiment metrics for a list of tweets."""
    analyser = SentimentIntensityAnalyzer()
    total = len(tweets)
    if total == 0:
        return {"mention_count": 0, "negative_ratio": 0.0, "abuse_count": 0}

    negative_count = 0
    abuse_count = 0

    for tweet in tweets:
        text = tweet.get("text", "").lower()
        scores = analyser.polarity_scores(text)
        if scores["compound"] <= -0.05:
            negative_count += 1
        if any(kw in text for kw in HATE_KEYWORDS):
            abuse_count += 1

    return {
        "mention_count": total,
        "negative_ratio": round(negative_count / total, 4),
        "abuse_count": abuse_count,
    }


def upsert_snapshot(db: Client, player_id: str, snapshot_date: str, metrics: dict) -> None:
    row = {
        "player_id": player_id,
        "snapshot_date": snapshot_date,
        **metrics,
    }
    db.table("social_mentions_daily").upsert(row, on_conflict="player_id,snapshot_date").execute()
    log.info("Upserted snapshot for player_id=%s date=%s", player_id, snapshot_date)


def run() -> None:
    db = get_supabase()
    players = fetch_players(db)
    if not players:
        log.error("No players found in database. Run supabase/seed.sql first.")
        sys.exit(1)

    yesterday = date.today() - timedelta(days=1)
    snapshot_date = yesterday.isoformat()
    # Twitter v2 ISO 8601 format
    start_time = f"{snapshot_date}T00:00:00Z"

    for player in players:
        query = player.get("twitter_query") or player["name"]
        log.info("Processing %s (query: %s)", player["name"], query)
        tweets = search_tweets(query, start_time)
        metrics = analyse_tweets(tweets)
        upsert_snapshot(db, player["id"], snapshot_date, metrics)

    log.info("Social ingestion complete for %s", snapshot_date)


if __name__ == "__main__":
    run()
