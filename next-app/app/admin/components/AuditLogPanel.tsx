"use client";

import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   AuditLogPanel — audit log with action filtering
   Extracted from dashboard.tsx for maintainability.
   ═══════════════════════════════════════════════════════════════ */

export default function AuditLogPanel() {
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (filter) params.set("action", filter);
      const r = await fetch(`/api/admin/audit-log?${params}`);
      const d = await r.json();
      setLogs(d.logs || []); setTotal(d.total || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [filter]);

  const actionColors: Record<string, string> = {
    staff_created: "#2e7d32", staff_updated: "#1565c0", staff_deleted: "#c62828",
    order_status_changed: "#9c27b0", product_updated: "#ff9800",
    settings_changed: "#795548", login: "#4caf50", logout: "#ff9800",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📋 Audit Log <span style={{ fontSize: 12, fontWeight: 400, color: "var(--muted)" }}>({total} entries)</span></h3>
        <div style={{ display: "flex", gap: 6 }}>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: "6px 10px", fontSize: 12, border: "1px solid var(--line)", borderRadius: 4 }}>
            <option value="">All Actions</option>
            <option value="staff_created">Staff Created</option>
            <option value="staff_updated">Staff Updated</option>
            <option value="staff_deleted">Staff Deleted</option>
            <option value="order_status_changed">Order Status</option>
            <option value="settings_changed">Settings Changed</option>
          </select>
          <button onClick={fetchLogs} style={{ padding: "6px 14px", fontSize: 12, border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer", background: "#fff" }}>↻ Refresh</button>
        </div>
      </div>
      <div style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "#f9f8f6" }}>
            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Timestamp</th>
            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Action</th>
            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Actor</th>
            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Details</th>
          </tr></thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "8px 14px", whiteSpace: "nowrap" }}>{log.createdAt ? new Date(String(log.createdAt)).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                <td style={{ padding: "8px 14px" }}><span style={{ padding: "2px 8px", fontSize: 10, borderRadius: 3, background: actionColors[String(log.action)] || "#eee", color: ["staff_created"].includes(String(log.action)) ? "#fff" : "#333", fontWeight: 600 }}>{String(log.action).replace(/_/g, " ")}</span></td>
                <td style={{ padding: "8px 14px" }}>{String(log.actorId || "—")}</td>
                <td style={{ padding: "8px 14px", maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(log.details || "—")}</td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>{loading ? "Loading..." : "No audit log entries found."}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
