"""scheduler.py

Runs the three ingestion stages on a daily schedule:
  1. social_ingest   — fetch tweets & sentiment
  2. stats_ingest    — fetch season stats
  3. score_calculator — compute injustice scores

Usage (local / server):
  python ingestion/scheduler.py

For production, prefer a cron job or GitHub Actions scheduled workflow.
"""

import logging
import schedule
import time

import social_ingest
import stats_ingest
import score_calculator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger(__name__)


def daily_pipeline() -> None:
    log.info("=== Starting daily ingestion pipeline ===")
    try:
        social_ingest.run()
    except Exception as exc:  # noqa: BLE001
        log.error("social_ingest failed: %s", exc)

    try:
        stats_ingest.run()
    except Exception as exc:  # noqa: BLE001
        log.error("stats_ingest failed: %s", exc)

    try:
        score_calculator.run()
    except Exception as exc:  # noqa: BLE001
        log.error("score_calculator failed: %s", exc)

    log.info("=== Daily pipeline complete ===")


# Run at 03:00 UTC every day
schedule.every().day.at("03:00").do(daily_pipeline)

log.info("Scheduler started. Next run at 03:00 UTC.")

while True:
    schedule.run_pending()
    time.sleep(30)
