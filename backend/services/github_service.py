import os
import requests
from datetime import datetime

GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
GITHUB_REPO  = os.environ.get("GITHUB_REPO", "")   # e.g. "akashshawdev/AutoOps-Monitoring-Platform"

HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}

BASE = "https://api.github.com"


def _repo():
    return GITHUB_REPO or ""


def get_workflow_runs(limit=20):
    """Fetch recent workflow runs for the configured repo."""
    if not _repo():
        return {"error": "GITHUB_REPO not configured"}, 400

    url = f"{BASE}/repos/{_repo()}/actions/runs?per_page={limit}"
    r = requests.get(url, headers=HEADERS, timeout=10)
    if r.status_code != 200:
        return {"error": r.json().get("message", "GitHub API error"), "status": r.status_code}, r.status_code

    runs = r.json().get("workflow_runs", [])
    result = []
    for run in runs:
        result.append({
            "id":          run["id"],
            "name":        run["name"],
            "workflow":    run.get("path", "").split("/")[-1],
            "branch":      run["head_branch"],
            "commit":      run["head_sha"][:7],
            "status":      run["status"],       # queued | in_progress | completed
            "conclusion":  run["conclusion"],   # success | failure | cancelled | None
            "started_at":  run["run_started_at"],
            "updated_at":  run["updated_at"],
            "url":         run["html_url"],
            "actor":       run["triggering_actor"]["login"] if run.get("triggering_actor") else "unknown",
            "run_number":  run["run_number"],
        })
    return result, 200


def get_workflow_jobs(run_id):
    """Fetch jobs for a specific run (for drill-down view)."""
    if not _repo():
        return {"error": "GITHUB_REPO not configured"}, 400

    url = f"{BASE}/repos/{_repo()}/actions/runs/{run_id}/jobs"
    r = requests.get(url, headers=HEADERS, timeout=10)
    if r.status_code != 200:
        return {"error": r.json().get("message", "GitHub API error")}, r.status_code

    jobs = r.json().get("jobs", [])
    result = []
    for job in jobs:
        steps = [
            {
                "name":       s["name"],
                "status":     s["status"],
                "conclusion": s["conclusion"],
                "number":     s["number"],
            }
            for s in job.get("steps", [])
        ]
        result.append({
            "id":         job["id"],
            "name":       job["name"],
            "status":     job["status"],
            "conclusion": job["conclusion"],
            "started_at": job["started_at"],
            "steps":      steps,
        })
    return result, 200


def get_pipeline_summary():
    """Aggregate stats: total runs success/failure rate etc."""
    runs, code = get_workflow_runs(limit=50)
    if code != 200:
        return runs, code

    total     = len(runs)
    success   = sum(1 for r in runs if r["conclusion"] == "success")
    failure   = sum(1 for r in runs if r["conclusion"] == "failure")
    in_prog   = sum(1 for r in runs if r["status"] == "in_progress")
    cancelled = sum(1 for r in runs if r["conclusion"] == "cancelled")

    return {
        "total":          total,
        "success":        success,
        "failure":        failure,
        "in_progress":    in_prog,
        "cancelled":      cancelled,
        "success_rate":   round((success / total * 100), 1) if total else 0,
        "recent_runs":    runs[:10],
    }, 200
