"use client";

import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   DashboardPanel — Admin dashboard with metrics, charts, date filter
   Extracted from dashboard.tsx for maintainability.
   ═══════════════════════════════════════════════════════════════ */

export default function DashboardPanel({ data: initialData }: { data: Record<string, unknown>; doRefresh: () => void }) {
  const [dateRange, setDateRange] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [dashData, setDashData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => { setDashData(initialData); }, [initialData]);

  const fetchWithParams = async (params: URLSearchParams) => {
    setLoading(true);
    try { const res = await fetch(`/api/admin/dashboard?${params}`); const d = await res.json(); setDashData(d || {}); } catch {}
    setLoading(false);
  };

  const metrics = (dashData.metrics || {}) as Record<string, number>;
  const comp = (dashData.comparison || {}) as Record<string, number>;
  const topProducts = (dashData.topProducts || []) as Array<{ name: string; count: number; revenue: number }>;
  const salesByCategory = (dashData.salesByCategory || []) as Array<{ name: string; revenue: number }>;
  const paymentMethods = (dashData.paymentMethods || {}) as Record<string, number>;
  const statusDist = (dashData.statusDistribution || {}) as Record<string, number>;
  const revenueOverTime = (dashData.revenueOverTime || []) as Array<{ date: string; revenue: number }>;
  const recentOrders = (dashData.recentOrders || []) as Record<string, unknown>[];

  const handleDateChange = (range: string) => {
    setDateRange(range);
    const now = new Date();
    let from = ""; let to = "";
    if (range === "today") { from = now.toISOString().slice(0, 10); to = from; }
    else if (range === "yesterday") { const d = new Date(now); d.setDate(d.getDate() - 1); from = d.toISOString().slice(0, 10); to = from; }
    else if (range === "7d") { const d = new Date(now); d.setDate(d.getDate() - 7); from = d.toISOString().slice(0, 10); }
    else if (range === "30d") { const d = new Date(now); d.setDate(d.getDate() - 30); from = d.toISOString().slice(0, 10); }
    else if (range === "month") { from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10); }
    else if (range === "last-month") { from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10); to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10); }
    else if (range === "year") { from = `${now.getFullYear()}-01-01`; }
    else if (range === "custom") { from = customFrom; to = customTo; }
    const params = new URLSearchParams();
    if (from) params.set("from", from); if (to) params.set("to", to);
    fetchWithParams(params);
  };

  const pct = (v: number) => v > 0 ? `+${v}%` : v === 0 ? "0%" : `${v}%`;
  const pctColor = (v: number) => v > 0 ? "#2e7d32" : v < 0 ? "#c62828" : "var(--muted)";

  const card = (label: string, value: string | number, color: string, change?: number, icon?: string) => (
    <div style={{ padding: 18, background: "#fff", border: "1px solid var(--line)", borderRadius: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", fontWeight: 600 }}>{icon} {label}</span>
        {change !== undefined && <span style={{ fontSize: 10, fontWeight: 700, color: pctColor(change) }}>{pct(change)}</span>}
      </div>
      <b style={{ display: "block", marginTop: 6, font: "24px var(--font-display)", color }}>{value}</b>
    </div>
  );

  const maxRevenue = Math.max(...revenueOverTime.map(r => r.revenue), 1);

  return (
    <div>
      {/* Date Range Filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", marginRight: 4 }}>📅 Date Range:</span>
        {["all", "today", "yesterday", "7d", "30d", "month", "last-month", "year", "custom"].map((r) => (
          <button key={r} onClick={() => handleDateChange(r)} style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: dateRange === r ? "2px solid var(--purple)" : "1px solid var(--line)", background: dateRange === r ? "var(--purple)" : "#fff", color: dateRange === r ? "#fff" : "var(--ink)", cursor: "pointer", fontWeight: dateRange === r ? 700 : 500, textTransform: "capitalize" }}>{r === "all" ? "All Time" : r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : r === "month" ? "This Month" : r === "last-month" ? "Last Month" : r === "year" ? "This Year" : r === "custom" ? "Custom" : r}</button>
        ))}
        {dateRange === "custom" && (
          <><input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={{ padding: "5px 8px", fontSize: 11, border: "1px solid var(--line)", borderRadius: 4 }} /><input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} style={{ padding: "5px 8px", fontSize: 11, border: "1px solid var(--line)", borderRadius: 4 }} /><button onClick={() => handleDateChange("custom")} style={{ padding: "5px 12px", fontSize: 11, background: "var(--purple)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>Apply</button></>
        )}
        <button onClick={() => { const p = new URLSearchParams(); if (dateRange !== "all" && dateRange !== "custom") handleDateChange(dateRange); else fetchWithParams(new URLSearchParams()); }} style={{ padding: "5px 12px", fontSize: 11, border: "1px solid var(--line)", borderRadius: 4, background: "#fff", cursor: "pointer" }}>↻ Refresh</button>
      </div>

      {/* Primary Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        {card("Total Orders", metrics.totalOrders || 0, "var(--purple)", comp.ordersChange)}
        {card("Revenue", `₹${(metrics.totalRevenue || 0).toLocaleString("en-IN")}`, "var(--gold)", comp.revenueChange)}
        {card("Avg Order Value", `₹${(metrics.avgOrderValue || 0).toLocaleString("en-IN")}`, "#1565c0", comp.avgOrderChange)}
        {card("Customers", metrics.totalCustomers || 0, "#4caf50")}
      </div>

      {/* Secondary Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 20 }}>
        {card("New Customers", metrics.newCustomers || 0, "#2e7d32")}
        {card("Returning", metrics.returningCustomers || 0, "#1565c0")}
        {card("Pending", metrics.pendingOrders || 0, "#d4ad65")}
        {card("Shipped", metrics.shippedOrders || 0, "#2196f3")}
        {card("Delivered", metrics.deliveredOrders || 0, "#4caf50")}
        {card("Cancelled", metrics.cancelledOrders || 0, "#b34141")}
      </div>

      {/* Financial Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {card("Discounts Given", `₹${(metrics.totalDiscounts || 0).toLocaleString("en-IN")}`, "#ff9800")}
        {card("Shipping Revenue", `₹${(metrics.totalShipping || 0).toLocaleString("en-IN")}`, "#0288d1")}
        {card("Tax Collected", `₹${(metrics.totalTax || 0).toLocaleString("en-IN")}`, "#795548")}
        {card("Products", `${metrics.activeProducts || 0} active`, "#4caf50")}
      </div>

      {/* Revenue Chart + Status Distribution */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: 20 }}>
          <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700 }}>📈 Revenue Over Time</h4>
          {revenueOverTime.length === 0 ? <p style={{ color: "var(--muted)", fontSize: 12 }}>No revenue data for selected period.</p> : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 120 }}>
              {revenueOverTime.map((r) => (
                <div key={r.date} title={`${r.date}: ₹${r.revenue.toLocaleString("en-IN")}`} style={{ flex: 1, background: "var(--purple)", borderRadius: "3px 3px 0 0", height: `${Math.max((r.revenue / maxRevenue) * 100, 2)}%`, minHeight: 2, cursor: "pointer", opacity: 0.85 }} />
              ))}
            </div>
          )}
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: 20 }}>
          <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700 }}>📊 Order Status</h4>
          {Object.keys(statusDist).length === 0 ? <p style={{ color: "var(--muted)", fontSize: 12 }}>No orders in period.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {Object.entries(statusDist).sort((a, b) => b[1] - a[1]).map(([status, count]) => (
                <div key={status} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <span style={{ width: 70, textTransform: "capitalize", color: "var(--muted)" }}>{status}</span>
                  <div style={{ flex: 1, background: "var(--line)", borderRadius: 3, height: 16 }}>
                    <div style={{ background: "var(--purple)", borderRadius: 3, height: "100%", width: `${(count / Math.max(...Object.values(statusDist))) * 100}%`, display: "flex", alignItems: "center", paddingLeft: 6 }}>
                      <span style={{ fontSize: 10, color: "#fff", fontWeight: 700 }}>{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products + Sales by Category + Payment Methods */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: 20 }}>
          <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700 }}>🏆 Top Products</h4>
          {topProducts.length === 0 ? <p style={{ color: "var(--muted)", fontSize: 12 }}>No sales yet.</p> : topProducts.map((p, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--line)", fontSize: 12 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 150 }}>{p.name}</span>
              <span style={{ fontWeight: 700, color: "var(--gold)" }}>₹{p.revenue.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: 20 }}>
          <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700 }}>📂 Sales by Category</h4>
          {salesByCategory.length === 0 ? <p style={{ color: "var(--muted)", fontSize: 12 }}>No category data.</p> : salesByCategory.map((c, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--line)", fontSize: 12 }}>
              <span>{c.name}</span>
              <span style={{ fontWeight: 700 }}>₹{c.revenue.toLocaleString("en-IN")}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: 20 }}>
          <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700 }}>💳 Payment Methods</h4>
          {Object.keys(paymentMethods).length === 0 ? <p style={{ color: "var(--muted)", fontSize: 12 }}>No payment data.</p> : Object.entries(paymentMethods).sort((a, b) => b[1] - a[1]).map(([method, count]) => (
            <div key={method} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--line)", fontSize: 12, textTransform: "capitalize" }}>
              <span>{method}</span>
              <span style={{ fontWeight: 700 }}>{count} orders</span>
            </div>
          ))}
        </div>
      </div>

      {/* Low Stock Alert */}
      {(metrics.lowStockProducts || 0) + (metrics.outOfStockProducts || 0) > 0 && (
        <div style={{ background: "#fff3e0", border: "1px solid #ffcc02", borderRadius: 6, padding: 16, marginBottom: 20 }}>
          <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700 }}>⚠️ Inventory Alerts</h4>
          <div style={{ display: "flex", gap: 20, fontSize: 12 }}>
            {metrics.lowStockProducts > 0 && <span style={{ color: "#e65100" }}>⚠️ {metrics.lowStockProducts} products low on stock</span>}
            {metrics.outOfStockProducts > 0 && <span style={{ color: "#c62828" }}>🚫 {metrics.outOfStockProducts} products out of stock</span>}
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: 20 }}>
        <h4 style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700 }}>🕐 Recent Orders</h4>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>
            <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Order</th>
            <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Date</th>
            <th style={{ textAlign: "left", padding: "8px 10px", fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Status</th>
            <th style={{ textAlign: "right", padding: "8px 10px", fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Total</th>
          </tr></thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={String(o.id)} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "8px 10px", fontFamily: "monospace", fontSize: 11 }}>{String(o.id).slice(0, 12)}…</td>
                <td style={{ padding: "8px 10px" }}>{o.createdAt ? new Date(String(o.createdAt)).toLocaleDateString("en-IN") : "—"}</td>
                <td style={{ padding: "8px 10px" }}><span style={{ padding: "2px 8px", fontSize: 10, borderRadius: 3, background: "var(--purple)", color: "#fff", textTransform: "capitalize" }}>{String(o.status)}</span></td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 700 }}>₹{Number(o.total || 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {recentOrders.length === 0 && <tr><td colSpan={4} style={{ padding: 20, textAlign: "center", color: "var(--muted)" }}>No orders in selected period.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
