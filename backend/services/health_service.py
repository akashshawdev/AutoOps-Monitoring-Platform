"""
Health check service.
Pings configured services/URLs and returns their status.
In production these would be Docker containers. For demo we check
real public URLs + the app itself.
"""
import os
import time
import requests
import psutil

# Configure via env or use these defaults (safe public endpoints)
SERVICES = [
    {"name": "AutoOps Monitoring Platform API", "url": os.environ.get("SELF_URL", "http://localhost:5000/")},
    {"name": "GitHub API",         "url": "https://api.github.com"},
    {"name": "Frontend (Vercel)",  "url": os.environ.get("FRONTEND_URL", "https://example.com")},
]


def check_service(service):
    name = service["name"]
    url  = service["url"]
    start = time.time()
    try:
        r = requests.get(url, timeout=5)
        latency = round((time.time() - start) * 1000, 1)
        return {
            "name":        name,
            "url":         url,
            "status":      "healthy" if r.status_code < 400 else "degraded",
            "status_code": r.status_code,
            "latency_ms":  latency,
        }
    except requests.exceptions.Timeout:
        return {"name": name, "url": url, "status": "unhealthy", "error": "timeout", "latency_ms": 5000}
    except requests.exceptions.ConnectionError:
        return {"name": name, "url": url, "status": "unhealthy", "error": "connection refused", "latency_ms": None}
    except Exception as e:
        return {"name": name, "url": url, "status": "unhealthy", "error": str(e), "latency_ms": None}


def get_all_health():
    results = [check_service(s) for s in SERVICES]
    healthy = sum(1 for r in results if r["status"] == "healthy")
    return {
        "services":        results,
        "healthy_count":   healthy,
        "total_count":     len(results),
        "overall_status":  "healthy" if healthy == len(results) else "degraded" if healthy > 0 else "down",
    }


def get_system_metrics():
    """Local system metrics -- CPU memory disk."""
    cpu    = psutil.cpu_percent(interval=0.5)
    mem    = psutil.virtual_memory()
    disk   = psutil.disk_usage("/")
    return {
        "cpu_percent":       cpu,
        "memory_percent":    mem.percent,
        "memory_used_mb":    round(mem.used / 1024 / 1024, 1),
        "memory_total_mb":   round(mem.total / 1024 / 1024, 1),
        "disk_percent":      disk.percent,
        "disk_used_gb":      round(disk.used / 1024 / 1024 / 1024, 2),
        "disk_total_gb":     round(disk.total / 1024 / 1024 / 1024, 2),
    }
