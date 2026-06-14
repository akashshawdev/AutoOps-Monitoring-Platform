import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useApi } from "./hooks/useApi";
import { StatCard } from "./components/StatCard";
import { PipelineTable } from "./components/PipelineTable";
import { HealthCards } from "./components/HealthCards";
import { AlertsPanel } from "./components/AlertsPanel";
import { StatusBadge } from "./components/StatusBadge";

type Tab = "dashboard" | "pipelines" | "health" | "logs";

interface Summary {
  total: number; success: number; failure: number;
  in_progress: number; cancelled: number; success_rate: number;
  recent_runs: Run[];
}

interface Run {
  id: number; name: string; branch: string; commit: string;
  status: string; conclusion: string | null;
  started_at: string; actor: string; run_number: number; url: string;
}

interface HealthData {
  services: { name: string; url: string; status: string; latency_ms: number | null; error?: string }[];
  healthy_count: number; total_count: number; overall_status: string;
}

interface SystemMetrics {
  cpu_percent: number; memory_percent: number;
  memory_used_mb: number; memory_total_mb: number;
  disk_percent: number; disk_used_gb: number; disk_total_gb: number;
}

interface Alert {
  id: number; workflow: string; branch: string;
  message: string; severity: string; created_at: string;
}

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");

  const summary  = useApi<Summary>("/api/pipelines/summary", 30_000);
  const health   = useApi<HealthData>("/api/health/", 15_000);
  const system   = useApi<SystemMetrics>("/api/health/system", 10_000);
  const alerts   = useApi<Alert[]>("/api/logs/alerts", 30_000);
  const allRuns  = useApi<Run[]>("/api/pipelines/?limit=30", tab === "pipelines" ? 30_000 : 0);

  const chartData = summary.data ? [
    { name: "Success",   value: summary.data.success,     color: "#4ade80" },
    { name: "Failed",    value: summary.data.failure,     color: "#f87171" },
    { name: "Running",   value: summary.data.in_progress, color: "#fbbf24" },
    { name: "Cancelled", value: summary.data.cancelled,   color: "#6b7280" },
  ] : [];

  const tabs: { id: Tab; label: string }[] = [
    { id: "dashboard",  label: "Dashboard" },
    { id: "pipelines",  label: "Pipelines" },
    { id: "health",     label: "Health" },
    { id: "logs",       label: "Alerts" },
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid var(--border)",
        padding: "0 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 52, position: "sticky", top: 0, background: "var(--bg)", zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--mono)", fontWeight: 600, fontSize: 15, color: "var(--accent)" }}>
            ◈ AutoOps Monitoring Platform
          </span>
          <span style={{ color: "var(--muted)", fontSize: 12 }}>CI/CD Monitor</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {health.data && <StatusBadge value={health.data.overall_status} />}
          <span style={{ color: "var(--muted)", fontSize: 11, fontFamily: "var(--mono)" }}>
            {health.data ? `${health.data.healthy_count}/${health.data.total_count} services` : "checking..."}
          </span>
        </div>
      </header>

      {/* Nav */}
      <nav style={{ borderBottom: "1px solid var(--border)", padding: "0 28px", display: "flex", gap: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", cursor: "pointer",
            padding: "12px 18px",
            color: tab === t.id ? "var(--text)" : "var(--muted)",
            borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
            fontFamily: "var(--sans)", fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            marginBottom: -1, transition: "color 0.15s",
          }}>
            {t.label}
            {t.id === "logs" && alerts.data && alerts.data.length > 0 && (
              <span style={{
                marginLeft: 6, background: "var(--danger)", color: "#fff",
                borderRadius: 10, padding: "1px 6px", fontSize: 10, fontWeight: 700,
              }}>{alerts.data.length}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ padding: "24px 28px", flex: 1 }}>

        {tab === "dashboard" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Pipeline Overview">
              {summary.loading ? <Spinner /> : summary.error ? <Err msg={summary.error} /> : summary.data && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
                    <StatCard label="Total Runs"    value={summary.data.total} />
                    <StatCard label="Success Rate"  value={`${summary.data.success_rate}%`} accent={summary.data.success_rate >= 80 ? "var(--accent)" : "var(--danger)"} />
                    <StatCard label="Failed"        value={summary.data.failure} accent="var(--danger)" />
                    <StatCard label="In Progress"   value={summary.data.in_progress} accent="var(--warn)" />
                  </div>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barSize={32}>
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                        <YAxis stroke="#6b7280" fontSize={11} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--text)" }}
                          cursor={{ fill: "rgba(255,255,255,0.03)" }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </Section>

            <Section title="System Metrics">
              {system.loading ? <Spinner /> : system.data && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                  <StatCard label="CPU"    value={`${system.data.cpu_percent}%`}    accent={system.data.cpu_percent > 80 ? "var(--danger)" : "var(--accent)"} />
                  <StatCard label="Memory" value={`${system.data.memory_percent}%`} sub={`${system.data.memory_used_mb} / ${system.data.memory_total_mb} MB`} accent={system.data.memory_percent > 85 ? "var(--warn)" : "var(--text)"} />
                  <StatCard label="Disk"   value={`${system.data.disk_percent}%`}   sub={`${system.data.disk_used_gb} / ${system.data.disk_total_gb} GB`} accent={system.data.disk_percent > 90 ? "var(--danger)" : "var(--text)"} />
                </div>
              )}
            </Section>

            <Section title="Recent Runs">
              {summary.loading ? <Spinner /> : summary.data?.recent_runs && (
                <PipelineTable runs={summary.data.recent_runs} />
              )}
            </Section>

            <Section title="Recent Alerts">
              {alerts.loading ? <Spinner /> : <AlertsPanel alerts={alerts.data ?? []} />}
            </Section>
          </div>
        )}

        {tab === "pipelines" && (
          <Section title="All Pipeline Runs">
            {allRuns.loading ? <Spinner /> : allRuns.error ? <Err msg={allRuns.error} /> : (
              <PipelineTable runs={allRuns.data ?? []} />
            )}
          </Section>
        )}

        {tab === "health" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Section title="Service Health">
              {health.loading ? <Spinner /> : health.error ? <Err msg={health.error} /> : health.data && (
                <HealthCards services={health.data.services} />
              )}
            </Section>
            <Section title="System Resources">
              {system.loading ? <Spinner /> : system.data && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                  <StatCard label="CPU Usage"     value={`${system.data.cpu_percent}%`} />
                  <StatCard label="Memory Usage"  value={`${system.data.memory_percent}%`} sub={`${system.data.memory_used_mb} MB used`} />
                  <StatCard label="Disk Usage"    value={`${system.data.disk_percent}%`}   sub={`${system.data.disk_used_gb} GB used`} />
                </div>
              )}
            </Section>
          </div>
        )}

        {tab === "logs" && (
          <Section title="CI/CD Failure Alerts">
            {alerts.loading ? <Spinner /> : <AlertsPanel alerts={alerts.data ?? []} />}
          </Section>
        )}

      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{
        fontSize: 12, fontFamily: "var(--mono)", fontWeight: 600,
        color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em",
        marginBottom: 14,
      }}>{title}</h2>
      {children}
    </section>
  );
}

function Spinner() {
  return (
    <div style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>
      loading...
    </div>
  );
}

function Err({ msg }: { msg: string }) {
  return (
    <div style={{
      color: "var(--danger)", fontFamily: "var(--mono)", fontSize: 12,
      background: "var(--surface)", border: "1px solid #f8717140",
      borderRadius: 6, padding: "10px 14px",
    }}>
      Error: {msg}
    </div>
  );
}
