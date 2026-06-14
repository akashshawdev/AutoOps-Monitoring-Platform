# AutoOps Monitoring Platform

A centralized DevOps monitoring dashboard that tracks real GitHub Actions CI/CD pipelines, service health and system metrics in one place.

**GitHub:** [akashshawdev/AutoOps-Monitoring-Platform](https://github.com/akashshawdev/AutoOps-Monitoring-Platform)

**Live demo:** [autoops-monitoring-platform.vercel.app](https://autoops-monitoring-platform.vercel.app) | **API:** [autoops-monitoring-platform-api.onrender.com](https://autoops-monitoring-platform-api.onrender.com)

---

## What it does

| Feature | Detail |
|---|---|
| **Pipeline tracking** | Fetches real GitHub Actions runs via the GitHub REST API |
| **Health checks** | Pings configured services and reports latency + status |
| **Log aggregation** | Stores failure details in SQLite, surfaces them as structured alerts |
| **System metrics** | CPU, memory and disk usage via `psutil` |
| **REST API** | Flask blueprint-based API with CORS support |
| **CI/CD** | GitHub Actions pipeline validates the project itself |

---

## Tech stack

- **Backend:** Python, Flask, SQLite, psutil, Gunicorn
- **Frontend:** React, Vite, TypeScript, Recharts
- **CI/CD:** GitHub Actions
- **Deploy:** Render (backend) + Vercel (frontend)

---

## Project structure

```
AutoOps-Monitoring-Platform/
├── backend/
│   ├── app.py                  # Flask entry point
│   ├── requirements.txt
│   ├── render.yaml             # Render deploy config
│   ├── routes/
│   │   ├── pipelines.py        # /api/pipelines
│   │   ├── health.py           # /api/health
│   │   ├── logs.py             # /api/logs
│   │   └── metrics.py          # /api/metrics
│   └── services/
│       ├── github_service.py   # GitHub Actions API integration
│       ├── health_service.py   # Docker/service health checks
│       └── log_service.py      # SQLite log aggregation + alerts
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main dashboard
│   │   ├── hooks/useApi.ts     # Generic data-fetching hook
│   │   └── components/
│   │       ├── StatCard.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── PipelineTable.tsx
│   │       ├── HealthCards.tsx
│   │       └── AlertsPanel.tsx
│   └── vite.config.ts
└── .github/workflows/ci.yml
```

---

## Local setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Fill in GITHUB_TOKEN and GITHUB_REPO in .env

python app.py
# API running at http://localhost:5000
```

You need a GitHub Personal Access Token with `repo` and `actions:read` scopes.
Create one at: https://github.com/settings/tokens

### Frontend

```bash
cd frontend
npm install

cp .env.example .env
# Set VITE_API_URL=http://localhost:5000 for local dev

npm run dev
# Dashboard at http://localhost:5173
```

---

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/pipelines/` | Recent workflow runs |
| GET | `/api/pipelines/summary` | Aggregated stats + success rate |
| GET | `/api/pipelines/{id}/jobs` | Jobs and steps for a specific run |
| POST | `/api/pipelines/ingest` | Pull runs and store failures to DB |
| GET | `/api/health/` | Service health checks |
| GET | `/api/health/system` | CPU, memory, disk metrics |
| GET | `/api/logs/` | Stored failure logs from SQLite |
| GET | `/api/logs/alerts` | Generated alerts for failed runs |
| GET | `/api/metrics/` | Combined pipeline + system metrics |

---

## Deploy

### Backend on Render

1. Push repo to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Set root directory to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `gunicorn app:app --bind 0.0.0.0:$PORT`
6. Add environment variables: `GITHUB_TOKEN`, `GITHUB_REPO`, `FRONTEND_URL`

### Frontend on Vercel

```bash
cd frontend
npx vercel
# Set VITE_API_URL to your Render backend URL when prompted
```

---

## Design decisions

**Why Flask over FastAPI?** Flask's blueprint system makes it straightforward to split routes by domain (pipelines, health, logs) without overengineering for a monitoring tool at this scale.

**Why SQLite over PostgreSQL?** The log aggregation volume is low and SQLite ships with Python. Swapping to PostgreSQL is a one-line change in `log_service.py`.

**Why poll instead of webhooks?** GitHub webhooks require a public URL and secret rotation. Polling the GitHub API every 30 seconds is simpler to demo and sufficient for a monitoring dashboard.

**Page Object Model parallel:** The same separation of concerns used in the Firefox UI Automation Testing Suite (POM separates test logic from selectors) is applied here: services handle all external API logic, routes only handle HTTP concerns.
