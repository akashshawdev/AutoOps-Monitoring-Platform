"""
Health check service.
Pings configured services/URLs concurrently and returns their status.
"""
import os
import time
import requests
import psutil
from concurrent.futures import ThreadPoolExecutor, as_completed

SERVICES = [
    {"name": "GitHub API",        "url": "https://api.github.com"},
    {"name": "Frontend (Vercel)", "url": os.environ.get("FRONTEND_URL", "")},
]


def check_service(service):
    name = service["name"]
    url  = service["url"]

    if not url or "your-service" in url or "your-app" in url or "example.com" in url:
        return {"name": name, "url": url, "status": "unknown", "error": "not configured", "latency_ms": None}

    start = time.time()
    try:
        r = requests.get(url, timeout=4, allow_redirects=True)
        latency = round((time.time() - start) * 1000, 1)
        return {
            "name":        name,
            "url":         url,
            "status":      "healthy" if r.status_code < 400 else "degraded",
            "status_code": r.status_code,
            "latency_ms":  latency,
        }
    except requests.exceptions.Timeout:
        return {"name": name, "url": url, "status": "degraded", "error": "timeout", "latency_ms": 4000}
    except requests.exceptions.ConnectionError:
        return {"name": name, "url": url, "status": "unhealthy", "error": "connection refused", "latency_ms": None}
    except Exception as e:
        return {"name": name, "url": url, "status": "unhealthy", "error": str(e), "latency_ms": None}


def get_all_health():
    results = []
    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = {executor.submit(check_service, s): s for s in SERVICES}
        for future in as_completed(futures):
            results.append(future.result())

    healthy = sum(1 for r in results if r["status"] == "healthy")
    return {
        "services":       results,
        "healthy_count":  healthy,
        "total_count":    len(results),
        "overall_status": "healthy" if healthy == len(results) else "degraded" if healthy > 0 else "down",
    }


def get_system_metrics():
    cpu  = psutil.cpu_percent(interval=0.5)
    mem  = psutil.virtual_memory()
    disk = psutil.disk_usage("/")
    return {
        "cpu_percent":     cpu,
        "memory_percent":  mem.percent,
        "memory_used_mb":  round(mem.used / 1024 / 1024, 1),
        "memory_total_mb": round(mem.total / 1024 / 1024, 1),
        "disk_percent":    disk.percent,
        "disk_used_gb":    round(disk.used / 1024 / 1024 / 1024, 2),
        "disk_total_gb":   round(disk.total / 1024 / 1024 / 1024, 2),
    }
