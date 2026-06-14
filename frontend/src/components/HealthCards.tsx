import React from "react";
import { StatusBadge } from "./StatusBadge";

interface Service {
  name: string;
  url: string;
  status: string;
  latency_ms: number | null;
  error?: string;
}

export function HealthCards({ services }: { services: Service[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
      {services.map(s => (
        <div key={s.name} style={{
          background: "var(--surface)",
          border: `1px solid ${s.status === "healthy" ? "var(--border)" : s.status === "degraded" ? "#fbbf2440" : "#f8717140"}`,
          borderRadius: 8,
          padding: "14px 18px",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 500 }}>{s.name}</span>
            <StatusBadge value={s.status} />
          </div>
          <span style={{ color: "var(--muted)", fontSize: 11, fontFamily: "var(--mono)" }}>
            {s.latency_ms != null ? `${s.latency_ms} ms` : s.error ?? "—"}
          </span>
        </div>
      ))}
    </div>
  );
}
