import React from "react";

interface Alert {
  id: number;
  workflow: string;
  branch: string;
  message: string;
  severity: string;
  created_at: string;
}

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) {
    return <p style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>No alerts. All pipelines healthy.</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {alerts.map(a => (
        <div key={a.id} style={{
          background: "var(--surface)",
          border: `1px solid ${a.severity === "critical" ? "#f8717150" : "#fbbf2450"}`,
          borderLeft: `3px solid ${a.severity === "critical" ? "var(--danger)" : "var(--warn)"}`,
          borderRadius: 6,
          padding: "10px 14px",
          display: "flex", flexDirection: "column", gap: 4,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 500, fontSize: 13 }}>{a.message}</span>
            <span style={{
              fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
              color: a.severity === "critical" ? "var(--danger)" : "var(--warn)",
              textTransform: "uppercase",
            }}>{a.severity}</span>
          </div>
          <span style={{ color: "var(--muted)", fontSize: 11, fontFamily: "var(--mono)" }}>
            {new Date(a.created_at).toLocaleString()} · branch: {a.branch}
          </span>
        </div>
      ))}
    </div>
  );
}
