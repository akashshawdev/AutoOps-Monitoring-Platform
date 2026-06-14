import React from "react";

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}

export function StatCard({ label, value, sub, accent = "var(--accent)" }: Props) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      padding: "18px 22px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ color: "var(--muted)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--mono)" }}>
        {label}
      </span>
      <span style={{ fontSize: 32, fontWeight: 600, color: accent, fontFamily: "var(--mono)", lineHeight: 1.1 }}>
        {value}
      </span>
      {sub && <span style={{ color: "var(--text-dim)", fontSize: 12 }}>{sub}</span>}
    </div>
  );
}
