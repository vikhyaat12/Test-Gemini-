"use client";

import { useState, useRef } from "react";
import { Badge } from "./shared";
import OrderDetailPanel from "./OrderDetailPanel";

/* ═══════════════════════════════════════════════════════════════
   OrderManager — order list with filters, status actions, pagination
   Extracted from dashboard.tsx for maintainability.
   ═══════════════════════════════════════════════════════════════ */

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "completed", "cancelled", "rejected", "refunded"] as const;

export default function OrderManager({ orders, onUpdate }: { orders: Record<string, unknown>[]; onUpdate: () => void }) {
  const [filter, setFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const perPage = 20;
  const prevFilterRef = useRef({ filter, paymentFilter, searchQuery });
  if (prevFilterRef.current.filter !== filter || prevFilterRef.current.paymentFilter !== paymentFilter || prevFilterRef.current.searchQuery !== searchQuery) {
    setCurrentPage(0);
    prevFilterRef.current = { filter, paymentFilter, searchQuery };
  }

  const filtered = orders.filter((o) => {
    if (filter !== "all" && String(o.status) !== filter) return false;
    if (paymentFilter !== "all" && String(o.paymentStatus || "pending") !== paymentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const id = String(o.id || "").toLowerCase();
      const name = String(o.customerName || "").toLowerCase();
      const email = String(o.email || "").toLowerCase();
      const phone = String(o.phone || "").toLowerCase();
      if (!id.includes(q) && !name.includes(q) && !email.includes(q) && !phone.includes(q)) return false;
    }
    return true;
  });

  const updateStatus = async (id: string, status: string, note?: string) => {
    const body: Record<string, unknown> = { status };
    if (note) body.note = note;
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) onUpdate();
    setRejectingId(null); setRejectReason("");
  };

  return (
    <div>
      {/* Search + Payment filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="🔍 Search order ID, customer, email, phone…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, minWidth: 200, padding: "7px 12px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 12 }} />
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} style={{ padding: "7px 10px", borderRadius: 6, border: "1px solid var(--line)", fontSize: 11 }}>
          <option value="all">All Payment</option>
          <option value="pending">Payment Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
          <option value="cod_pending">COD Pending</option>
        </select>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{filtered.length} order{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Status filter chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", ...ORDER_STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: filter === s ? "2px solid var(--purple)" : "1px solid var(--line)", background: filter === s ? "var(--purple)" : "#fff", color: filter === s ? "#fff" : "var(--ink)", cursor: "pointer", fontWeight: filter === s ? 700 : 500, textTransform: "capitalize", transition: "all 0.15s" }}>{s}{s !== "all" && <span style={{ marginLeft: 4, opacity: 0.7 }}>({orders.filter((o) => String(o.status) === s).length})</span>}</button>
        ))}
      </div>

      {/* Order rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24 }}>No orders match filter.</p>}
        {filtered.slice(currentPage * perPage, (currentPage + 1) * perPage).map((order) => {
          const id = String(order.id);
          const isExpanded = expandedId === id;
          const isRejecting = rejectingId === id;
          return (
            <div key={id} style={{ border: "1px solid var(--line)", borderRadius: 6, background: "#fff", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 0.8fr 0.8fr 1fr 1.2fr", gap: 8, padding: "10px 14px", alignItems: "center", cursor: "pointer" }} onClick={() => setExpandedId(isExpanded ? null : id)}>
                <div>
                  <span style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 600 }}>{String(order.id).slice(0, 16)}</span>
                  {order.createdAt ? <span style={{ display: "block", fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{new Date(String(order.createdAt)).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span> : null}
                </div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>₹{Number(order.total || 0).toLocaleString("en-IN")}</div>
                <Badge status={String(order.status || "pending")} />
                <Badge status={String(order.paymentStatus || "pending")} />
                <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(order.customerName || order.email || "—")}</div>
                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
                  {(!order.status || order.status === "pending") && (
                    <>
                      <button onClick={() => updateStatus(id, "confirmed")} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9", borderRadius: 3, cursor: "pointer" }}>✓ Confirm</button>
                      <button onClick={() => setRejectingId(id)} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2", borderRadius: 3, cursor: "pointer" }}>✕ Reject</button>
                    </>
                  )}
                  {order.status === "confirmed" && <button onClick={() => updateStatus(id, "processing")} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#e3f2fd", color: "#1565c0", border: "1px solid #bbdefb", borderRadius: 3, cursor: "pointer" }}>⚙ Process</button>}
                  {order.status === "processing" && <button onClick={() => updateStatus(id, "shipped")} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#e3f2fd", color: "#1565c0", border: "1px solid #bbdefb", borderRadius: 3, cursor: "pointer" }}>🚚 Ship</button>}
                  {order.status === "shipped" && <button onClick={() => updateStatus(id, "delivered")} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9", borderRadius: 3, cursor: "pointer" }}>📦 Deliver</button>}
                  {order.status === "delivered" && <button onClick={() => updateStatus(id, "completed")} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9", borderRadius: 3, cursor: "pointer" }}>✓ Complete</button>}
                  <select value={String(order.status || "pending")} onChange={(e) => updateStatus(id, e.target.value)} style={{ padding: "4px 6px", fontSize: 10, borderRadius: 3, border: "1px solid var(--line)" }} onClick={(e) => e.stopPropagation()}>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {isRejecting && (
                <div style={{ padding: "8px 14px", background: "#fff5f5", borderTop: "1px solid #ffcdd2", display: "flex", gap: 8, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                  <input placeholder="Rejection reason (optional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ flex: 1, padding: "6px 10px", fontSize: 12, border: "1px solid #ffcdd2", borderRadius: 3 }} />
                  <button onClick={() => updateStatus(id, "rejected", rejectReason || undefined)} style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, background: "#c62828", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}>Confirm Reject</button>
                  <button onClick={() => { setRejectingId(null); setRejectReason(""); }} style={{ padding: "6px 14px", fontSize: 11, background: "#fff", border: "1px solid #ccc", borderRadius: 3, cursor: "pointer" }}>Cancel</button>
                </div>
              )}
              {isExpanded && <OrderDetailPanel orderId={id} onClose={() => setExpandedId(null)} onRefresh={onUpdate} />}
            </div>
          );
        })}
      </div>
      {/* Pagination */}
      {filtered.length > perPage && (() => {
        const totalPages = Math.ceil(filtered.length / perPage);
        const start = currentPage * perPage + 1;
        const end = Math.min((currentPage + 1) * perPage, filtered.length);
        return (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "12px 0", borderTop: "1px solid var(--line)" }}>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Showing {start}–{end} of {filtered.length} orders</span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} style={{ padding: "5px 12px", fontSize: 11, border: "1px solid var(--line)", background: currentPage === 0 ? "#f5f5f5" : "#fff", cursor: currentPage === 0 ? "not-allowed" : "pointer", borderRadius: 3, opacity: currentPage === 0 ? 0.5 : 1 }}>← Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) pageNum = i;
                else if (currentPage < 3) pageNum = i;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 5 + i;
                else pageNum = currentPage - 2 + i;
                return <button key={pageNum} onClick={() => setCurrentPage(pageNum)} style={{ padding: "5px 10px", fontSize: 11, border: currentPage === pageNum ? "2px solid var(--purple)" : "1px solid var(--line)", background: currentPage === pageNum ? "var(--purple)" : "#fff", color: currentPage === pageNum ? "#fff" : "var(--ink)", cursor: "pointer", borderRadius: 3, fontWeight: currentPage === pageNum ? 700 : 500 }}>{pageNum + 1}</button>;
              })}
              <button disabled={currentPage >= totalPages - 1} onClick={() => setCurrentPage(p => p + 1)} style={{ padding: "5px 12px", fontSize: 11, border: "1px solid var(--line)", background: currentPage >= totalPages - 1 ? "#f5f5f5" : "#fff", cursor: currentPage >= totalPages - 1 ? "not-allowed" : "pointer", borderRadius: 3, opacity: currentPage >= totalPages - 1 ? 0.5 : 1 }}>Next →</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
