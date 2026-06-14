"""
Log aggregation service.
Pulls GitHub Actions logs for failed runs and stores them locally
so the dashboard can surface failure reasons without hitting GitHub on every request.
"""
import os
import json
import sqlite3
import requests
from datetime import datetime

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO  = os.environ.get("GITHUB_REPO", "")
HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
}
DB_PATH = os.environ.get("DB_PATH", "autoops-monitoring-platform.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS run_logs (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id      TEXT UNIQUE,
            workflow    TEXT,
            branch      TEXT,
            conclusion  TEXT,
            log_snippet TEXT,
            fetched_at  TEXT
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS alerts (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            run_id      TEXT,
            workflow    TEXT,
            branch      TEXT,
            message     TEXT,
            severity    TEXT DEFAULT 'warning',
            created_at  TEXT
        )
    """)
    conn.commit()
    conn.close()


def store_log(run_id, workflow, branch, conclusion, snippet):
    conn = get_db()
    try:
        conn.execute("""
            INSERT OR REPLACE INTO run_logs
            (run_id, workflow, branch, conclusion, log_snippet, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (str(run_id), workflow, branch, conclusion, snippet, datetime.utcnow().isoformat()))
        conn.commit()
    finally:
        conn.close()


def create_alert(run_id, workflow, branch, message, severity="warning"):
    conn = get_db()
    try:
        conn.execute("""
            INSERT INTO alerts (run_id, workflow, branch, message, severity, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (str(run_id), workflow, branch, message, severity, datetime.utcnow().isoformat()))
        conn.commit()
    finally:
        conn.close()


def get_recent_logs(limit=20):
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM run_logs ORDER BY fetched_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_alerts(limit=20):
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM alerts ORDER BY created_at DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def ingest_failed_runs(runs):
    """
    Given a list of run dicts from github_service, store logs for failed ones
    and generate alerts. This is the aggregation step.
    """
    ingested = 0
    for run in runs:
        if run.get("conclusion") == "failure":
            snippet = f"Run #{run['run_number']} on branch '{run['branch']}' failed. Commit: {run['commit']}. Check: {run['url']}"
            store_log(
                run_id=run["id"],
                workflow=run["name"],
                branch=run["branch"],
                conclusion="failure",
                snippet=snippet,
            )
            create_alert(
                run_id=run["id"],
                workflow=run["name"],
                branch=run["branch"],
                message=f"Pipeline '{run['name']}' failed on {run['branch']} (#{run['run_number']})",
                severity="critical",
            )
            ingested += 1
    return ingested
