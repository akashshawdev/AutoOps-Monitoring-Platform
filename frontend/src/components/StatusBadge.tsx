import React from "react";

type Status = "success" | "failure" | "in_progress" | "cancelled" | "healthy" | "unhealthy" | "degraded" | string | null;

const COLOR: Record<string, string> = {
  success:     "#4ade80",
  healthy:     "#4ade80",
  failure:     "#f87171",
  unhealthy:   "#f87171",
  cancelled:   "#6b7280",
  in_progress: "#fbbf24",
  queued:      "#fbbf24",
  degraded:    "#fbbf24",
};

const DOT: Record<string, string> = {
  in_progress: "pulse",
  queued:      "pulse",
};

export function StatusBadge({ value }: { value: Status }) {
  const v    = value ?? "unknown";
  const color = COLOR[v] ?? "#94a3b8";
  const anim  = DOT[v] ? "pulseDot" : "none";

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600,
      textTransform: "uppercase", letterSpacing: "0.05em",
      color,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%",
        background: color,
        animation: anim === "pulseDot" ? "pulseDot 1.2s ease-in-out infinite" : "none",
      }} />
      {v.replace("_", " ")}
      <style>{`@keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </span>
  );
}
