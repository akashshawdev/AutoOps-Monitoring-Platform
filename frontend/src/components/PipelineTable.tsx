import React from "react";
import { StatusBadge } from "./StatusBadge";

interface Run {
  id: number;
  name: string;
  branch: string;
  commit: string;
  status: string;
  conclusion: string | null;
  started_at: string;
  actor: string;
  run_number: number;
  url: string;
}

export function PipelineTable({ runs }: { runs: Run[] }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["#", "Workflow", "Branch", "Commit", "Triggered by", "Status", "Link"].map(h => (
              <th key={h} style={{
                textAlign: "left", padding: "8px 12px",
                color: "var(--muted)", fontSize: 11,
                fontFamily: "var(--mono)", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {runs.map((r, i) => (
            <tr key={r.id} style={{
              borderBottom: "1px solid var(--border)",
              background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
              transition: "background 0.15s",
            }}>
              <td style={cell}><span style={{ color: "var(--muted)", fontFamily: "var(--mono)" }}>#{r.run_number}</span></td>
              <td style={cell}>{r.name}</td>
              <td style={{ ...cell, fontFamily: "var(--mono)", color: "var(--accent)", fontSize: 12 }}>{r.branch}</td>
              <td style={{ ...cell, fontFamily: "var(--mono)", fontSize: 12, color: "var(--text-dim)" }}>{r.commit}</td>
              <td style={cell}>{r.actor}</td>
              <td style={cell}>
                <StatusBadge value={r.status === "completed" ? r.conclusion : r.status} />
              </td>
              <td style={cell}>
                <a href={r.url} target="_blank" rel="noreferrer"
                  style={{ fontFamily: "var(--mono)", fontSize: 11 }}>↗ view</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cell: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "middle",
};
