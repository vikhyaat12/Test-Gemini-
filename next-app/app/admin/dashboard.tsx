"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import BlogEditForm from "./BlogEditForm";
import { BannerEditForm, TestimonialEditForm, OfferEditForm, SettingsEditForm, ReviewEditForm } from "./ContentEditForms";
import { ProductEditFormAdvanced } from "./ProductEditFormAdvanced";
import HomepageSectionEdit from "./HomepageSectionEdit";
import MarketingPanel from "./MarketingPanel";
import LogoManager from "./LogoManager";
import MediaLibrary from "./MediaLibrary";
import PaymentGatewayManager from "./PaymentGatewayManager";
import ShippingManager from "./ShippingManager";
import APlusManager from "./APlusManager";
import EmployeeEditFormAdvanced from "./EmployeeEditFormAdvanced";
import PushNotificationPanel from "./PushNotificationPanel";
import PageManagement from "./PageManagement";
import SocialMediaLinksManager from "./SocialMediaLinksManager";
import CareerApplicationsManager from "./CareerApplicationsManager";
import CareersCMSManager from "./CareersCMSManager";
import OTPSettingsPanel from "./OTPSettingsPanel";
import NotificationSettingsPanel from "./NotificationSettingsPanel";
import DataCenterExportPanel from "./DataCenterExportPanel";
import B2BManagement from "./B2BManagement";
import StoreLocatorManagement from "./StoreLocatorManagement";
import FooterSettingsModal from "./FooterSettingsModal";
import AnalyticsDashboard from "./AnalyticsDashboard";

type Tab = "dashboard" | "orders" | "products" | "product-edit" | "aplus" | "categories" | "customers" | "b2b" | "stores" | "careers" | "career-applications" | "doctors" | "employees" | "affiliates" | "coupons" | "blog" | "faq" | "reviews" | "media" | "banners" | "testimonials" | "settings" | "offers" | "homepage" | "marketing" | "payments" | "shipping" | "push" | "pages" | "social-links" | "otp-security" | "notifications-matrix" | "data-export"
  | "analytics" | "staff" | "audit-log";

const req = async (path: string, init?: RequestInit) => {
  const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  return r.json();
};

function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = { pending: "#d4ad65", submitted: "#2196f3", under_review: "#d4ad65", shortlisted: "#9c27b0", interview: "#ff9800", hired: "#4caf50", approved: "#4caf50", paid: "#4caf50", active: "#4caf50", delivered: "#4caf50", completed: "#2e7d32", confirmed: "#1565c0", processing: "#2196f3", shipped: "#2196f3", packed: "#2196f3", cancelled: "#b34141", declined: "#b34141", rejected: "#b34141", failed: "#b34141", refunded: "#9c27b0", suspended: "#ff9800" };
  return <span style={{ padding: "3px 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", background: colors[status] || "#eee", color: ["pending", "suspended", "under_review"].includes(status) ? "#333" : "#fff", borderRadius: 3 }}>{status}</span>;
}

function Table({ columns, rows, onEdit, onDelete, onStatusChange, onPreview }: { columns: { key: string; label: string; render?: (v: unknown, row: Record<string, unknown>) => React.ReactNode }[]; rows: Record<string, unknown>[]; onEdit?: (row: Record<string, unknown>) => void; onDelete?: (row: Record<string, unknown>) => void; onStatusChange?: (row: Record<string, unknown>, status: string) => void; onPreview?: (row: Record<string, unknown>) => void }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const perPage = 12;
  const filtered = rows.filter(r => !search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase())));
  const pages = Math.ceil(filtered.length / perPage);
  const visible = filtered.slice(page * perPage, (page + 1) * perPage);
  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <input placeholder="Search…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} style={{ padding: "10px 14px", border: "1px solid var(--line)", flex: 1, maxWidth: 350, fontSize: 13 }} />
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{filtered.length} records</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr>{columns.map(c => <th key={c.key} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>{c.label}</th>)}{(onEdit || onDelete || onStatusChange || onPreview) && <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--line)" }}>Actions</th>}</tr></thead>
          <tbody>{visible.map((row, i) => <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>{columns.map(c => <td key={c.key} style={{ padding: "10px 12px" }}>{c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "—")}</td>)}{(onEdit || onDelete || onStatusChange || onPreview) && <td style={{ padding: "10px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>{onPreview && <button onClick={() => onPreview(row)} style={{ border: "1px solid #c7d2fe", background: "#f5f3ff", padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "var(--purple)", fontWeight: 600 }}>Preview ↗</button>}{onEdit && <button onClick={() => onEdit(row)} style={{ border: "1px solid var(--line)", background: "#fff", padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Edit</button>}{onDelete && <button onClick={() => onDelete(row)} style={{ border: "1px solid #e2c3c3", background: "#fff", padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#b34141" }}>Del</button>}{onStatusChange && <button onClick={() => onStatusChange(row, "approved")} style={{ border: "1px solid #c3e6cb", background: "#fff", padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#2e7d32" }}>Approve</button>}</td>}</tr>)}</tbody>
        </table>
      </div>
      {pages > 1 && <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}><button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: "6px 12px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>← Prev</button><span style={{ padding: "6px 12px", fontSize: 12, color: "var(--muted)" }}>Page {page + 1} of {pages}</span><button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: "6px 12px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>Next →</button></div>}
    </div>
  );
}

const ENDPOINTS: Record<Tab, string | null> = {
  dashboard: "/api/admin/dashboard",
  orders: "/api/admin/orders",
  products: "/api/products?all=true",
  categories: "/api/admin/categories",
  customers: "/api/admin/customers",
  b2b: "/api/admin/b2b",
  stores: "/api/admin/store-locator",
  careers: "/api/admin/careers/page",
  "career-applications": "/api/admin/careers",
  doctors: "/api/admin/doctors",
  employees: "/api/admin/employees",
  affiliates: "/api/admin/affiliates",
  coupons: "/api/admin/coupons",
  blog: "/api/admin/blog",
  faq: "/api/admin/faq",
  reviews: "/api/admin/reviews",
  media: "/api/admin/media",
  banners: "/api/admin/banners",
  testimonials: "/api/admin/testimonials",
  settings: "/api/admin/settings",
  offers: "/api/admin/offers",
  homepage: "/api/admin/homepage",
  marketing: "/api/admin/marketing",
  payments: "/api/admin/payments",
  shipping: "/api/admin/shipping/providers",
  push: "/api/admin/push/history",
  pages: "/api/admin/pages",
  "social-links": "/api/admin/social-links",
  aplus: "/api/admin/aplus",
  "otp-security": "/api/admin/otp/settings",
  "notifications-matrix": "/api/admin/notifications/settings",
  "data-export": "/api/admin/googlesheets",
  "product-edit": null,
  analytics: "/api/analytics",
  staff: "/api/admin/staff",
  "audit-log": "/api/admin/audit-log",
};

function DashboardPanel({ data: initialData }: { data: Record<string, unknown>; doRefresh: () => void }) {
  const [dateRange, setDateRange] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [dashData, setDashData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  // Sync when parent refreshes
  useEffect(() => { setDashData(initialData); }, [initialData]);

  const fetchWithParams = async (params: URLSearchParams) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?${params}`);
      const d = await res.json();
      setDashData(d || {});
    } catch {}
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
    let from = "";
    let to = "";
    if (range === "today") { from = now.toISOString().slice(0, 10); to = from; }
    else if (range === "yesterday") { const d = new Date(now); d.setDate(d.getDate() - 1); from = d.toISOString().slice(0, 10); to = from; }
    else if (range === "7d") { const d = new Date(now); d.setDate(d.getDate() - 7); from = d.toISOString().slice(0, 10); }
    else if (range === "30d") { const d = new Date(now); d.setDate(d.getDate() - 30); from = d.toISOString().slice(0, 10); }
    else if (range === "month") { from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10); }
    else if (range === "last-month") { from = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10); to = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10); }
    else if (range === "year") { from = `${now.getFullYear()}-01-01`; }
    else if (range === "custom") { from = customFrom; to = customTo; }
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
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
        {/* Revenue Over Time */}
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

        {/* Order Status Distribution */}
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

function StaffManagementPanel() {
  const [staff, setStaff] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin", permissions: ["orders", "products", "customers", "homepage", "pages", "blog", "analytics", "settings"] as string[] });
  const [editingId, setEditingId] = useState<string | null>(null);

  const ALL_PERMISSIONS = ["orders", "products", "customers", "homepage", "pages", "blog", "reviews", "marketing", "notifications", "analytics", "employees", "b2b", "careers", "settings", "payments", "shipping", "media", "social_links", "coupons", "staff"];

  const fetchStaff = async () => {
    setLoading(true);
    try { const r = await fetch("/api/admin/staff"); const d = await r.json(); setStaff(d.staff || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleSave = async () => {
    const method = editingId ? "PATCH" : "POST";
    const body: Record<string, unknown> = { ...form };
    if (editingId) body.id = editingId;
    if (!form.password && editingId) delete body.password;
    const r = await fetch("/api/admin/staff", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) { setShowForm(false); setEditingId(null); setForm({ name: "", email: "", password: "", role: "admin", permissions: ALL_PERMISSIONS.slice(0, 8) }); fetchStaff(); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this staff member?")) return;
    await fetch("/api/admin/staff", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchStaff();
  };

  const togglePerm = (perm: string) => {
    setForm((f) => ({ ...f, permissions: f.permissions.includes(perm) ? f.permissions.filter((p) => p !== perm) : [...f.permissions, perm] }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>👥 Staff Management</h3>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: "", email: "", password: "", role: "admin", permissions: ALL_PERMISSIONS.slice(0, 8) }); }} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}>{showForm ? "Cancel" : "+ Add Staff"}</button>
      </div>

      {showForm && (
        <div style={{ background: "#f9f8f6", border: "1px solid var(--line)", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Name</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Email</label><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }} /></div>
            <div><label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>{editingId ? "New Password (blank = keep)" : "Password"}</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }} /></div>
          </div>
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4 }}><option value="admin">Admin (Full Access)</option><option value="staff">Staff (Custom Permissions)</option></select>
          </div>
          {form.role === "staff" && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 6 }}>Permissions</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ALL_PERMISSIONS.map((p) => (
                  <button key={p} onClick={() => togglePerm(p)} style={{ padding: "4px 10px", fontSize: 11, borderRadius: 4, border: form.permissions.includes(p) ? "2px solid var(--purple)" : "1px solid var(--line)", background: form.permissions.includes(p) ? "var(--purple)" : "#fff", color: form.permissions.includes(p) ? "#fff" : "var(--ink)", cursor: "pointer", fontWeight: form.permissions.includes(p) ? 700 : 400 }}>{p.replace(/_/g, " ")}</button>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleSave} style={{ marginTop: 12, padding: "8px 20px", background: "#2e7d32", color: "#fff", border: "none", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}>{editingId ? "Update" : "Create Staff"}</button>
        </div>
      )}

      <div style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead><tr style={{ background: "#f9f8f6" }}>
            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Name</th>
            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Email</th>
            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Role</th>
            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Permissions</th>
            <th style={{ textAlign: "left", padding: "10px 14px", fontWeight: 600, fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Actions</th>
          </tr></thead>
          <tbody>
            {staff.map((s) => (
              <tr key={String(s.id)} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "10px 14px", fontWeight: 600 }}>{String(s.name)}</td>
                <td style={{ padding: "10px 14px" }}>{String(s.email)}</td>
                <td style={{ padding: "10px 14px" }}><span style={{ padding: "3px 8px", fontSize: 10, borderRadius: 3, background: s.role === "admin" ? "#e8f5e9" : "#e3f2fd", color: s.role === "admin" ? "#2e7d32" : "#1565c0", fontWeight: 600, textTransform: "uppercase" }}>{String(s.role)}</span></td>
                <td style={{ padding: "10px 14px", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.role === "admin" ? "Full Access" : (Array.isArray(s.permissions) ? (s.permissions as string[]).join(", ") : "—")}</td>
                <td style={{ padding: "10px 14px", display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditingId(String(s.id)); setForm({ name: String(s.name), email: String(s.email), password: "", role: String(s.role), permissions: Array.isArray(s.permissions) ? (s.permissions as string[]) : [] }); setShowForm(true); }} style={{ padding: "4px 10px", fontSize: 11, border: "1px solid var(--line)", background: "#fff", borderRadius: 3, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => handleDelete(String(s.id))} style={{ padding: "4px 10px", fontSize: 11, border: "1px solid #ffcdd2", background: "#fff", color: "#c62828", borderRadius: 3, cursor: "pointer" }}>Del</button>
                </td>
              </tr>
            ))}
            {staff.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No staff members found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditLogPanel() {
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

const ORDER_STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "completed", "cancelled", "rejected", "refunded"] as const;

function OrderManager({ orders, onUpdate }: { orders: Record<string, unknown>[]; onUpdate: () => void }) {
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const filtered = filter === "all" ? orders : orders.filter((o) => String(o.status) === filter);

  const updateStatus = async (id: string, status: string, note?: string) => {
    const body: Record<string, unknown> = { status };
    if (note) body.note = note;
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) onUpdate();
    setRejectingId(null);
    setRejectReason("");
  };

  return (
    <div>
      {/* Status filter chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", ...ORDER_STATUSES].map((s) => (
          <button key={s} onClick={() => setFilter(s)} style={{ padding: "5px 12px", fontSize: 11, borderRadius: 20, border: filter === s ? "2px solid var(--purple)" : "1px solid var(--line)", background: filter === s ? "var(--purple)" : "#fff", color: filter === s ? "#fff" : "var(--ink)", cursor: "pointer", fontWeight: filter === s ? 700 : 500, textTransform: "capitalize", transition: "all 0.15s" }}>{s}{s !== "all" && <span style={{ marginLeft: 4, opacity: 0.7 }}>({orders.filter((o) => String(o.status) === s).length})</span>}</button>
        ))}
      </div>

      {/* Order rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {filtered.length === 0 && <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 24 }}>No orders match filter.</p>}
        {filtered.map((order) => {
          const id = String(order.id);
          const isExpanded = expandedId === id;
          const isRejecting = rejectingId === id;
          return (
            <div key={id} style={{ border: "1px solid var(--line)", borderRadius: 6, background: "#fff", overflow: "hidden" }}>
              {/* Row header */}
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
                  {/* Quick actions based on current status */}
                  {(!order.status || order.status === "pending") && (
                    <>
                      <button onClick={() => updateStatus(id, "confirmed")} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9", borderRadius: 3, cursor: "pointer" }}>✓ Confirm</button>
                      <button onClick={() => setRejectingId(id)} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2", borderRadius: 3, cursor: "pointer" }}>✕ Reject</button>
                    </>
                  )}
                  {order.status === "confirmed" && (
                    <button onClick={() => updateStatus(id, "processing")} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#e3f2fd", color: "#1565c0", border: "1px solid #bbdefb", borderRadius: 3, cursor: "pointer" }}>⚙ Process</button>
                  )}
                  {order.status === "processing" && (
                    <button onClick={() => updateStatus(id, "shipped")} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#e3f2fd", color: "#1565c0", border: "1px solid #bbdefb", borderRadius: 3, cursor: "pointer" }}>🚚 Ship</button>
                  )}
                  {order.status === "shipped" && (
                    <button onClick={() => updateStatus(id, "delivered")} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9", borderRadius: 3, cursor: "pointer" }}>📦 Deliver</button>
                  )}
                  {order.status === "delivered" && (
                    <button onClick={() => updateStatus(id, "completed")} style={{ padding: "4px 10px", fontSize: 10, fontWeight: 700, background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9", borderRadius: 3, cursor: "pointer" }}>✓ Complete</button>
                  )}
                  {/* Status override dropdown */}
                  <select value={String(order.status || "pending")} onChange={(e) => updateStatus(id, e.target.value)} style={{ padding: "4px 6px", fontSize: 10, borderRadius: 3, border: "1px solid var(--line)" }} onClick={(e) => e.stopPropagation()}>
                    {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Reject reason input */}
              {isRejecting && (
                <div style={{ padding: "8px 14px", background: "#fff5f5", borderTop: "1px solid #ffcdd2", display: "flex", gap: 8, alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                  <input placeholder="Rejection reason (optional)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ flex: 1, padding: "6px 10px", fontSize: 12, border: "1px solid #ffcdd2", borderRadius: 3 }} />
                  <button onClick={() => updateStatus(id, "rejected", rejectReason || undefined)} style={{ padding: "6px 14px", fontSize: 11, fontWeight: 700, background: "#c62828", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}>Confirm Reject</button>
                  <button onClick={() => { setRejectingId(null); setRejectReason(""); }} style={{ padding: "6px 14px", fontSize: 11, background: "#fff", border: "1px solid #ccc", borderRadius: 3, cursor: "pointer" }}>Cancel</button>
                </div>
              )}

              {/* Expanded details */}
              {isExpanded && (
                <div style={{ padding: "12px 14px", borderTop: "1px solid var(--line)", background: "#fafafa", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, fontSize: 12 }}>
                  <div>
                    <strong style={{ fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Customer</strong>
                    <p style={{ margin: "4px 0" }}>{String(order.customerName || "—")}</p>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: 11 }}>{String(order.email || "—")}</p>
                    <p style={{ margin: 0, color: "var(--muted)", fontSize: 11 }}>{String(order.phone || "—")}</p>
                  </div>
                  <div>
                    <strong style={{ fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Shipping</strong>
                    <p style={{ margin: "4px 0" }}>{String(order.shippingAddress || order.address || "—")}</p>
                    {order.trackingNumber ? <p style={{ margin: 0, color: "var(--muted)", fontSize: 11 }}>Track: {String(order.trackingNumber)}</p> : null}
                    {order.shippingMethod ? <p style={{ margin: 0, color: "var(--muted)", fontSize: 11 }}>Method: {String(order.shippingMethod)}</p> : null}
                  </div>
                  <div>
                    <strong style={{ fontSize: 10, textTransform: "uppercase", color: "var(--muted)" }}>Payment</strong>
                    <p style={{ margin: "4px 0" }}>Total: ₹{Number(order.total || 0).toLocaleString("en-IN")}</p>
                    <p style={{ margin: 0 }}><Badge status={String(order.paymentStatus || "pending")} /></p>
                    {order.paymentMethod ? <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 11 }}>Via: {String(order.paymentMethod)}</p> : null}
                    {order.couponCode ? <p style={{ margin: "4px 0 0", color: "var(--muted)", fontSize: 11 }}>Coupon: {String(order.couponCode)}</p> : null}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);
  const [showFooterEditor, setShowFooterEditor] = useState(false);

  const doRefresh = useCallback(async () => {
    try {
      const url = ENDPOINTS[tab];
      if (url) {
        setLoading(true);
        const d = await req(url);
        setData(d || {});
      }
    } catch {
      setMessage("Failed to load data.");
      setIsError(true);
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = ENDPOINTS[tab];
        if (url) {
          setLoading(true);
          const d = await req(url);
          if (!cancelled) setData(d || {});
        }
      } catch {
        if (!cancelled) {
          setMessage("Failed to load data.");
          setIsError(true);
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tab]);

  const handleDelete = async (endpoint: string, id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const r = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const d = await r.json().catch(() => ({}));
      if (r.ok) {
        setIsError(false);
        setMessage("Deleted successfully.");
        doRefresh();
      } else {
        setIsError(true);
        setMessage(d.error || "Failed to delete.");
      }
    } catch {
      setIsError(true);
      setMessage("Network error during delete.");
    }
  };

  const handleStatusUpdate = async (endpoint: string, id: string, status: string) => {
    try {
      const res = await fetch(`${endpoint}/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMessage(`Status updated to ${status}.`);
        doRefresh();
      } else {
        setIsError(true);
        setMessage(d.error || "Failed to update status.");
      }
    } catch {
      setIsError(true);
      setMessage("Network error.");
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "products", label: "Products", icon: "🏷️" },
    { id: "aplus", label: "A+ Content", icon: "✨" },
    { id: "categories", label: "Categories", icon: "📁" },
    { id: "customers", label: "Customers", icon: "👥" },
    { id: "b2b", label: "B2B Leads", icon: "🏢" },
    { id: "stores", label: "Store Locator", icon: "📍" },
    { id: "careers", label: "Careers CMS", icon: "💼" },
    { id: "career-applications", label: "Career Applications", icon: "📁" },
    { id: "doctors", label: "Doctors", icon: "⚕️" },
    { id: "employees", label: "Employees", icon: "👤" },
    { id: "affiliates", label: "Affiliates", icon: "🤝" },
    { id: "coupons", label: "Coupons", icon: "🎫" },
    { id: "blog", label: "Blog", icon: "📝" },
    { id: "faq", label: "FAQ", icon: "❓" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
    { id: "banners", label: "Banners", icon: "🎯" },
    { id: "testimonials", label: "Testimonials", icon: "💬" },
    { id: "marketing", label: "Marketing", icon: "📣" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "shipping", label: "Shipping", icon: "🚚" },
    { id: "push", label: "Push Notifications", icon: "📱" },
    { id: "otp-security", label: "OTP & Security", icon: "🔐" },
    { id: "notifications-matrix", label: "Order Notifications", icon: "🔔" },
    { id: "data-export", label: "Data Center & Excel", icon: "📊" },
    { id: "media", label: "Media", icon: "🖼️" },
    { id: "staff", label: "Staff", icon: "👥" },
    { id: "audit-log", label: "Audit Log", icon: "📋" },
    { id: "settings", label: "Settings", icon: "⚙️" },
    { id: "pages", label: "Pages", icon: "📑" },
    { id: "social-links", label: "Social Links", icon: "🔗" },
    { id: "homepage", label: "Homepage", icon: "🏠" },
    { id: "analytics", label: "Analytics", icon: "📈" },
  ];

  const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 };
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4 };

  return (
    <main className="portal" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 0, minHeight: "100vh" }}>
      <nav style={{ background: "var(--purple)", color: "#fff", padding: "24px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid #ffffff20" }}>
          <Link href="/" className="brand inverse" style={{ marginBottom: 12, display: "block" }}><i>Q</i><span>QUEENS<br /><b>CARE</b></span></Link>
          <p style={{ fontSize: 11, color: "#d7cddd", margin: 0 }}>Commerce Command Centre</p>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setEditingItem(null); setMessage(""); setIsError(false); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 20px", border: "none", background: tab === t.id ? "#ffffff15" : "transparent", color: "#fff", cursor: "pointer", fontSize: 12, textAlign: "left", borderLeft: tab === t.id ? "3px solid var(--gold)" : "3px solid transparent" }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid #ffffff20", fontSize: 10, color: "#a99cab" }}>Queens Care Labs © 2026</div>
      </nav>

      <div style={{ padding: "30px 36px", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h2 style={{ margin: 0, font: "28px var(--font-display)", letterSpacing: "-.03em" }}>{editingItem ? `Edit ${editingItem._type || tab}` : tabs.find(t => t.id === tab)?.label}</h2>
            {message && (
              <p
                style={{
                  margin: "8px 0 0",
                  padding: "8px 12px",
                  background: isError ? "#fde8e8" : "#e9f7e9",
                  fontSize: 12,
                  color: isError ? "#b34141" : "#2e7d32",
                  border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
                }}
              >
                {message}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {editingItem && <button onClick={() => { setEditingItem(null); setMessage(""); setIsError(false); }} style={{ padding: "8px 16px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>← Back to list</button>}
            <button onClick={doRefresh} style={{ padding: "8px 16px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>↻ Refresh</button>
          </div>
        </div>

        {loading ? <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p> : (
          <>
            {/* ─── DASHBOARD ─── */}
            {tab === "dashboard" && (
              <DashboardPanel data={data} doRefresh={doRefresh} />
            )}

            {/* ─── PRODUCT EDIT FORM ─── */}
            {tab === "products" && editingItem && (
              <ProductEditFormAdvanced item={editingItem} onSave={() => { setEditingItem(null); setMessage("Product saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── PRODUCTS TABLE ─── */}
            {tab === "products" && !editingItem && (
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                  <button onClick={() => setEditingItem({ _type: "product", isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>+ Add Product</button>
                  <a
                    href="/shop"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "8px 14px",
                      background: "#fff",
                      color: "var(--purple)",
                      border: "1px solid var(--purple)",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>👁️ View Shop</span>
                    <span>↗</span>
                  </a>
                </div>
                <Table
                  columns={[
                    { key: "name", label: "Product" },
                    { key: "category", label: "Category" },
                    { key: "price", label: "Price", render: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
                    { key: "stock", label: "Stock", render: (v, row) => <span style={{ color: Number(v) < Number(row.lowStockThreshold || 10) ? "#b34141" : "inherit" }}>{String(v)}</span> },
                    { key: "active", label: "Active", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={(data?.products as Record<string, unknown>[]) || []}
                  onPreview={(row) => window.open(`/products/${row.slug}`, "_blank")}
                  onEdit={(row) => setEditingItem({ ...row, _type: "product" })}
                  onDelete={(row) => {
                    if (confirm("Delete this product?")) {
                      (async () => {
                        try {
                          const res = await fetch(`/api/products/${encodeURIComponent(String(row.slug || row.id))}`, { method: "DELETE" });
                          const d = await res.json().catch(() => ({}));
                          if (res.ok) {
                            setMessage("Product deleted.");
                            setIsError(false);
                            doRefresh();
                          } else {
                            setMessage(d.error || "Failed to delete product.");
                            setIsError(true);
                          }
                        } catch {
                          setMessage("Network error.");
                          setIsError(true);
                        }
                      })();
                    }
                  }}
                />
              </div>
            )}

            {/* ─── A+ CONTENT MANAGER ─── */}
            {tab === "aplus" && (
              <APlusManager />
            )}

            {/* ─── CATEGORIES TABLE ─── */}
            {tab === "categories" && !editingItem?.categoryEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "category", categoryEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add Category</button>
                <Table
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "slug", label: "Slug" },
                    { key: "sort", label: "Sort" },
                    { key: "active", label: "Active", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.categories as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "category", categoryEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/categories", String(row.id))}
                />
              </div>
            )}
            {tab === "categories" && editingItem?.categoryEdit && (
              <CategoryEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Category saved."); setIsError(false); doRefresh(); }} inputStyle={inputStyle} labelStyle={labelStyle} />
            )}

            {/* ─── ORDERS TABLE ─── */}
            {tab === "orders" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["all", "pending", "confirmed", "processing", "shipped", "delivered", "completed", "cancelled", "rejected", "refunded"].map((s) => (
                      <button key={s} onClick={() => (window as unknown as Record<string, string>).__orderFilter = s} style={{ padding: "4px 10px", fontSize: 11, borderRadius: 3, border: "1px solid var(--line)", background: "#fff", cursor: "pointer", textTransform: "capitalize", fontWeight: 600 }} className="order-filter-btn" data-status={s}>{s}</button>
                    ))}
                  </div>
                  <a href="/api/admin/export?dataset=orders" download style={{ padding: "8px 14px", background: "var(--purple)", color: "#fff", borderRadius: 4, fontSize: 12, fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span>📥 Export Orders CSV</span>
                  </a>
                </div>
                <OrderManager orders={(data?.orders as Record<string, unknown>[]) || []} onUpdate={doRefresh} />
              </div>
            )}

            {/* ─── CUSTOMERS ─── */}
            {tab === "customers" && (
              <div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                  <a
                    href="/api/admin/export?dataset=customers"
                    download
                    style={{
                      padding: "8px 14px",
                      background: "var(--purple)",
                      color: "#fff",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>📥 Export Customers (.CSV / Excel)</span>
                  </a>
                </div>
                <Table
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "email", label: "Email" },
                    { key: "role", label: "Role", render: (v) => <Badge status={String(v)} /> },
                    { key: "createdAt", label: "Joined", render: (v) => new Date(String(v)).toLocaleDateString("en-IN") },
                  ]}
                  rows={((data.customers as Record<string, unknown>[]) || [])}
                />
              </div>
            )}

            {/* ─── B2B ─── */}
            {tab === "b2b" && <B2BManagement />}

            {/* ─── STORE LOCATOR ─── */}
            {tab === "stores" && <StoreLocatorManagement />}

            {/* ─── CAREERS CMS ─── */}
            {tab === "careers" && (
              <CareersCMSManager />
            )}

            {/* ─── CAREER APPLICATIONS ─── */}
            {tab === "career-applications" && (
              <CareerApplicationsManager />
            )}

            {/* ─── DOCTORS ─── */}
            {tab === "doctors" && (
              <Table
                columns={[
                  { key: "name", label: "Name" },
                  { key: "email", label: "Email" },
                  { key: "specialty", label: "Specialty" },
                  { key: "clinic", label: "Clinic" },
                  { key: "status", label: "Status", render: (v) => <Badge status={String(v)} /> },
                ]}
                rows={((data.doctors as Record<string, unknown>[]) || [])}
                onStatusChange={(row, s) => { handleStatusUpdate("/api/admin/doctors", String(row.id), s); }}
              />
            )}

            {/* ─── EMPLOYEES ─── */}
            {tab === "employees" && !editingItem?.employeeEdit && (
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                  <button onClick={() => setEditingItem({ _type: "employee", employeeEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>+ Add Employee</button>
                  <a
                    href="/employee"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "8px 14px",
                      background: "#fff",
                      color: "var(--purple)",
                      border: "1px solid var(--purple)",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>👁️ Preview Team Page</span>
                    <span>↗</span>
                  </a>
                </div>
                <Table
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "designation", label: "Designation" },
                    { key: "department", label: "Department" },
                    { key: "employeeId", label: "Employee ID" },
                    {
                      key: "active",
                      label: "Status",
                      render: (v, row) => (
                        <button
                          type="button"
                          onClick={async () => {
                            const nextActive = v === false ? true : false;
                            await fetch("/api/admin/employees", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: row.id, active: nextActive }),
                            });
                            doRefresh();
                          }}
                          style={{
                            padding: "3px 8px",
                            fontSize: 11,
                            fontWeight: 700,
                            borderRadius: 4,
                            border: "1px solid " + (v !== false ? "#a5d6a7" : "#ffcdd2"),
                            background: v !== false ? "#e8f5e9" : "#ffebee",
                            color: v !== false ? "#2e7d32" : "#c62828",
                            cursor: "pointer",
                          }}
                          title="Click to toggle Active / Inactive"
                        >
                          {v !== false ? "● ACTIVE" : "○ INACTIVE"}
                        </button>
                      ),
                    },
                    {
                      key: "featured",
                      label: "Featured",
                      render: (v, row) => (
                        <button
                          type="button"
                          onClick={async () => {
                            const nextFeatured = !v;
                            await fetch("/api/admin/employees", {
                              method: "PATCH",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ id: row.id, featured: nextFeatured }),
                            });
                            doRefresh();
                          }}
                          style={{
                            padding: "3px 8px",
                            fontSize: 11,
                            fontWeight: 600,
                            borderRadius: 4,
                            border: "1px solid " + (v ? "#ffe082" : "#eee"),
                            background: v ? "#fff8e1" : "#fff",
                            color: v ? "#b78103" : "var(--muted)",
                            cursor: "pointer",
                          }}
                          title="Click to toggle Featured on Team Page"
                        >
                          {v ? "⭐ FEATURED" : "☆ Standard"}
                        </button>
                      ),
                    },
                  ]}
                  rows={((data.employees as Record<string, unknown>[]) || [])}
                  onPreview={(row) => window.open(`/employee/${row.slug || row.id}`, "_blank")}
                  onEdit={(row) => setEditingItem({ ...row, _type: "employee", employeeEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/employees", String(row.id))}
                />
              </div>
            )}
            {tab === "employees" && editingItem?.employeeEdit && (
              <EmployeeEditFormAdvanced
                item={editingItem}
                onSave={() => {
                  setEditingItem(null);
                  setMessage("Employee saved successfully.");
                  setIsError(false);
                  doRefresh();
                }}
                onCancel={() => setEditingItem(null)}
                inputStyle={inputStyle}
                labelStyle={labelStyle}
              />
            )}

            {/* ─── AFFILIATES ─── */}
            {tab === "affiliates" && !editingItem?.affiliateEdit && (
              <div>
                <h3 style={{ font: "20px var(--font-display)", margin: "0 0 16px" }}>Affiliate Partners</h3>
                <Table
                  columns={[
                    { key: "affiliateCode", label: "Code", render: (v) => <code style={{ fontWeight: 600 }}>{String(v)}</code> },
                    { key: "user", label: "User", render: (v, row) => <span>{String((v as Record<string, unknown>)?.name || (row.user as Record<string, unknown>)?.email || "—")}</span> },
                    { key: "status", label: "Status", render: (v) => <Badge status={String(v)} /> },
                    { key: "commissionRate", label: "Rate", render: (v) => `${Number(v || 10)}%` },
                    { key: "totalSales", label: "Sales", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
                    { key: "totalCommission", label: "Commission", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
                    { key: "wallet", label: "Wallet", render: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
                  ]}
                  rows={((data.affiliates as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "affiliate", affiliateEdit: true })}
                  onStatusChange={(row, s) => { handleStatusUpdate("/api/admin/affiliates", String(row.id), s); }}
                />

                <h3 style={{ font: "20px var(--font-display)", margin: "32px 0 16px" }}>Withdrawal Requests</h3>
                <WithdrawalsSection onStatusUpdate={doRefresh} />
              </div>
            )}
            {tab === "affiliates" && editingItem?.affiliateEdit && (
              <AffiliateEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Affiliate updated."); setIsError(false); doRefresh(); }} inputStyle={inputStyle} labelStyle={labelStyle} />
            )}

            {/* ─── COUPONS ─── */}
            {tab === "coupons" && !editingItem?.couponEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "coupon", couponEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Create Coupon</button>
                <Table
                  columns={[
                    { key: "code", label: "Code", render: (v) => <b>{String(v)}</b> },
                    { key: "type", label: "Type" },
                    { key: "discount", label: "Discount", render: (v, row) => row.type === "percentage" ? `${v}%` : `₹${Number(v).toLocaleString("en-IN")}` },
                    { key: "minOrder", label: "Min Order", render: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
                    { key: "usedCount", label: "Used" },
                    { key: "isActive", label: "Active", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.coupons as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "coupon", couponEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/coupons", String(row.id))}
                />
              </div>
            )}
            {tab === "coupons" && editingItem?.couponEdit && (
              <CouponEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Coupon saved."); setIsError(false); doRefresh(); }} inputStyle={inputStyle} labelStyle={labelStyle} />
            )}

            {/* ─── BLOG ─── */}
            {tab === "blog" && !editingItem?.blogEdit && (
              <div>
                <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 16 }}>
                  <button onClick={() => setEditingItem({ _type: "blog", blogEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>+ Create Post</button>
                  <a
                    href="/blog"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "8px 14px",
                      background: "#fff",
                      color: "var(--purple)",
                      border: "1px solid var(--purple)",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>👁️ View Journal</span>
                    <span>↗</span>
                  </a>
                </div>
                <Table
                  columns={[
                    { key: "title", label: "Title" },
                    { key: "category", label: "Category" },
                    { key: "author", label: "Author", render: (v) => String(v || "—") },
                    { key: "featured", label: "Featured", render: (v) => v ? "⭐" : "—" },
                    { key: "published", label: "Status", render: (v) => <Badge status={v ? "approved" : "draft"} /> },
                    { key: "createdAt", label: "Date", render: (v) => new Date(String(v)).toLocaleDateString("en-IN") },
                  ]}
                  rows={((data.posts as Record<string, unknown>[]) || [])}
                  onPreview={(row) => window.open(`/blog/${row.slug}`, "_blank")}
                  onEdit={(row) => setEditingItem({ ...row, _type: "blog", blogEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/blog", String(row.id || row.slug))}
                />
              </div>
            )}
            {tab === "blog" && editingItem?.blogEdit && (
              <BlogEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Post saved."); setIsError(false); doRefresh(); }} inputStyle={inputStyle} labelStyle={labelStyle} />
            )}

            {/* ─── FAQ ─── */}
            {tab === "faq" && !editingItem?.faqEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "faq", faqEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add FAQ</button>
                <Table
                  columns={[
                    { key: "question", label: "Question" },
                    { key: "category", label: "Category" },
                    { key: "sort", label: "Sort" },
                    { key: "visible", label: "Visible", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.faqs as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "faq", faqEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/faq", String(row.id))}
                />
              </div>
            )}
            {tab === "faq" && editingItem?.faqEdit && (
              <FAQEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("FAQ saved."); setIsError(false); doRefresh(); }} inputStyle={inputStyle} labelStyle={labelStyle} />
            )}

            {/* ─── REVIEWS ─── */}
            {tab === "reviews" && !editingItem?.reviewEdit && (
              <div>
                <button
                  onClick={() => setEditingItem({ _type: "review", reviewEdit: true, isNew: true, rating: 5, verified: true, visible: true })}
                  style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}
                >
                  + Add Review
                </button>
                <Table
                  columns={[
                    { key: "product", label: "Product", render: (v, row) => String((v as Record<string, unknown>)?.name || row.productSlug || row.productId || "—") },
                    { key: "user", label: "Customer", render: (v, row) => String((v as Record<string, unknown>)?.name || row.customerName || row.author || "—") },
                    { key: "rating", label: "Rating", render: (v) => "★".repeat(Number(v || 5)) },
                    { key: "title", label: "Title" },
                    { key: "visible", label: "Visible", render: (v) => v !== false ? "✓" : "✗" },
                  ]}
                  rows={((data.reviews as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "review", reviewEdit: true })}
                  onDelete={(row) => { req(`/api/admin/reviews?reviewId=${row.id}`, { method: "DELETE" }); setMessage("Review deleted."); doRefresh(); }}
                />
              </div>
            )}
            {tab === "reviews" && editingItem?.reviewEdit && (
              <ReviewEditForm
                item={editingItem}
                products={((data.products as Record<string, unknown>[]) || [])}
                onSave={() => { setEditingItem(null); setMessage("Review saved."); setIsError(false); doRefresh(); }}
              />
            )}

            {/* ─── BANNERS ─── */}
            {tab === "banners" && !editingItem?.bannerEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "banner", bannerEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add Banner</button>
                <Table
                  columns={[
                    { key: "title", label: "Title" },
                    { key: "position", label: "Position" },
                    { key: "sort", label: "Sort" },
                    { key: "active", label: "Active", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.banners as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "banner", bannerEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/banners", String(row.id))}
                />
              </div>
            )}
            {tab === "banners" && editingItem?.bannerEdit && (
              <BannerEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Banner saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── TESTIMONIALS ─── */}
            {tab === "testimonials" && !editingItem?.testimonialEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "testimonial", testimonialEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add Testimonial</button>
                <Table
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "title", label: "Title" },
                    { key: "body", label: "Review", render: (v) => <span style={{ maxWidth: 300, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{String(v)}</span> },
                    { key: "rating", label: "Rating" },
                    { key: "visible", label: "Visible", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.testimonials as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "testimonial", testimonialEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/testimonials", String(row.id))}
                />
              </div>
            )}
            {tab === "testimonials" && editingItem?.testimonialEdit && (
              <TestimonialEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Testimonial saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── OFFERS ─── */}
            {tab === "offers" && !editingItem?.offerEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "offer", offerEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add Offer</button>
                <Table
                  columns={[
                    { key: "title", label: "Title" },
                    { key: "type", label: "Type" },
                    { key: "discount", label: "Discount" },
                    { key: "active", label: "Active", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.offers as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "offer", offerEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/offers", String(row.id))}
                />
              </div>
            )}
            {tab === "offers" && editingItem?.offerEdit && (
              <OfferEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Offer saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── OTP & SECURITY ─── */}
            {tab === "otp-security" && (
              <OTPSettingsPanel />
            )}

            {/* ─── ORDER NOTIFICATIONS & TEMPLATES ─── */}
            {tab === "notifications-matrix" && (
              <NotificationSettingsPanel />
            )}

            {/* ─── DATA CENTER & EXPORTS ─── */}
            {tab === "data-export" && (
              <DataCenterExportPanel />
            )}

            {/* ─── MEDIA ─── */}
            {tab === "media" && (
              <MediaLibrary />
            )}

            {/* ─── SETTINGS ─── */}
            {tab === "settings" && !editingItem?.settingEdit && (
              <div>
                <LogoManager onSave={doRefresh} />
                <button onClick={() => setEditingItem({ _type: "setting", settingEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add Setting</button>
                <Table
                  columns={[
                    { key: "key", label: "Key" },
                    { key: "group", label: "Group" },
                    { key: "value", label: "Value", render: (v) => <code style={{ fontSize: 11 }}>{JSON.stringify(v).slice(0, 80)}</code> },
                    { key: "updatedAt", label: "Updated", render: (v) => new Date(String(v)).toLocaleDateString("en-IN") },
                  ]}
                  rows={((data.settings as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "setting", settingEdit: true })}
                />
              </div>
            )}
            {tab === "settings" && editingItem?.settingEdit && (
              <SettingsEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Setting saved."); setIsError(false); doRefresh(); }} />
            )}

            {/* ─── HOMEPAGE SECTIONS ─── */}
            {tab === "homepage" && !editingItem?.hpEdit && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ font: "20px var(--font-display)", color: "#2A0F3A", margin: "0 0 4px" }}>Homepage Content & 3D Manager</h3>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>Manage, reorder, show/hide, or edit all public homepage sections, copy, media, and 3D visual parameters.</p>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <a
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: "8px 14px",
                        background: "#fff",
                        color: "#2A0F3A",
                        border: "1px solid var(--line)",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>👁️ Preview Live Homepage</span>
                      <span>↗</span>
                    </a>
                    <button
                      onClick={() => setShowFooterEditor(true)}
                      style={{
                        padding: "8px 14px",
                        background: "#fff",
                        color: "var(--purple)",
                        border: "1px solid var(--purple)",
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span>⚙️ Footer CMS</span>
                    </button>
                    <button
                      onClick={() =>
                        setEditingItem({
                          _type: "homepage",
                          hpEdit: true,
                          isNew: true,
                          type: "custom",
                          title: "New Custom Section",
                          sort: ((data.sections as Record<string, unknown>[]) || []).length,
                          active: true,
                          visible: true,
                        })
                      }
                      style={{ padding: "8px 16px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                    >
                      + Add New Section
                    </button>
                  </div>
                </div>

                <Table
                  columns={[
                    {
                      key: "title",
                      label: "Section Title",
                      render: (v, row) => (
                        <div>
                          <b style={{ color: "#2A0F3A", fontSize: 13 }}>{String(v || row.type || "Untitled Section")}</b>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>Type: <code>{({ hero: 'Hero Banner', heroVisual: '3D Visual', trust: 'Trust Strip', collection: 'Product Collection', science: 'Our Science', ritual: 'Ritual Cards', testimonial: 'Testimonial', newsletter: 'Newsletter', consult: 'Consultation', affiliate: 'Affiliate', banner: 'Announcement Bar', custom: 'Custom Section', marquee: 'Marquee / Ticker' } as Record<string,string>)[String(row.type)] || String(row.type)}</code></div>
                        </div>
                      ),
                    },
                    {
                      key: "sort",
                      label: "Order",
                      render: (v, row) => (
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 12, minWidth: 20 }}>{Number(v || 0)}</span>
                          <button
                            type="button"
                            title="Move Up"
                            onClick={async () => {
                              const newSort = Math.max(0, Number(v || 0) - 1);
                              await fetch("/api/admin/homepage", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: row.id, sort: newSort }),
                              });
                              doRefresh();
                            }}
                            style={{ padding: "2px 6px", fontSize: 10, cursor: "pointer", border: "1px solid var(--line)", background: "#fff", borderRadius: 2 }}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            title="Move Down"
                            onClick={async () => {
                              const newSort = Number(v || 0) + 1;
                              await fetch("/api/admin/homepage", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: row.id, sort: newSort }),
                              });
                              doRefresh();
                            }}
                            style={{ padding: "2px 6px", fontSize: 10, cursor: "pointer", border: "1px solid var(--line)", background: "#fff", borderRadius: 2 }}
                          >
                            ▼
                          </button>
                        </div>
                      ),
                    },
                    {
                      key: "visible",
                      label: "Public Visibility",
                      render: (v, row) => (
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              padding: "2px 8px",
                              borderRadius: 12,
                              fontSize: 10,
                              fontWeight: 700,
                              background: v !== false && row.active !== false ? "#e8f5e9" : "#ffebee",
                              color: v !== false && row.active !== false ? "#2e7d32" : "#c62828",
                            }}
                          >
                            {v !== false && row.active !== false ? "● VISIBLE" : "○ HIDDEN"}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              const nextVisible = v === false ? true : false;
                              await fetch("/api/admin/homepage", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ id: row.id, visible: nextVisible }),
                              });
                              doRefresh();
                            }}
                            style={{
                              padding: "3px 8px",
                              fontSize: 11,
                              cursor: "pointer",
                              border: "1px solid var(--line)",
                              borderRadius: 3,
                              background: "#fff",
                              color: "#2A0F3A",
                            }}
                          >
                            {v !== false ? "Hide" : "Unhide"}
                          </button>
                        </div>
                      ),
                    },
                    {
                      key: "id",
                      label: "Actions",
                      render: (_, row) => (
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setEditingItem({ ...row, _type: "homepage", hpEdit: true })}
                            style={{ padding: "4px 10px", fontSize: 11, fontWeight: 600, background: "var(--purple)", color: "#fff", border: "none", borderRadius: 3, cursor: "pointer" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            title="Duplicate Section"
                            onClick={async () => {
                              const copyPayload = {
                                title: `${String(row.title || row.type)} (Copy)`,
                                type: row.type,
                                content: row.content,
                                sort: Number(row.sort || 0) + 1,
                                active: true,
                                visible: true,
                              };
                              await fetch("/api/admin/homepage", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(copyPayload),
                              });
                              doRefresh();
                            }}
                            style={{ padding: "4px 8px", fontSize: 11, background: "#f5f3ef", color: "#2A0F3A", border: "1px solid var(--line)", borderRadius: 3, cursor: "pointer" }}
                          >
                            📋 Copy
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete("/api/admin/homepage", String(row.id))}
                            style={{ padding: "4px 8px", fontSize: 11, background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2", borderRadius: 3, cursor: "pointer" }}
                          >
                            Delete
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  rows={((data.sections as Record<string, unknown>[]) || [])}
                />
                {showFooterEditor && (
                  <FooterSettingsModal
                    onClose={() => setShowFooterEditor(false)}
                    onSave={doRefresh}
                  />
                )}
              </div>
            )}
            {tab === "homepage" && editingItem?.hpEdit && (
              <HomepageSectionEdit item={editingItem} onSave={() => { setEditingItem(null); setMessage("Section saved successfully."); setIsError(false); doRefresh(); }} />
            )}
            {tab === "marketing" && (
              <MarketingPanel />
            )}
            {tab === "payments" && (
              <PaymentGatewayManager />
            )}
            {tab === "shipping" && (
              <ShippingManager />
            )}
            {tab === "push" && (
              <PushNotificationPanel />
            )}
            {tab === "pages" && (
              <PageManagement />
            )}
            {tab === "social-links" && (
              <SocialMediaLinksManager />
            )}
            {tab === "analytics" && (
              <AnalyticsDashboard />
            )}

            {tab === "staff" && (
              <StaffManagementPanel />
            )}

            {tab === "audit-log" && (
              <AuditLogPanel />
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* ─── CATEGORY EDIT FORM ─── */
function CategoryEditForm({ item, onSave, inputStyle, labelStyle }: { item: Record<string, unknown>; onSave: () => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true);
    setIsError(false);
    setMsg("");
    const method = form.isNew ? "POST" : "PATCH";
    const body = form.isNew ? JSON.stringify(form) : JSON.stringify({ id: form.id, ...form });
    try {
      const res = await fetch("/api/admin/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("Category saved successfully!");
        setTimeout(onSave, 400);
      } else {
        setIsError(true);
        setMsg(d.error || "Failed to save category.");
      }
    } catch {
      setIsError(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 500, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Category" : "Edit Category"}</h3>
      {msg && (
        <p
          style={{
            padding: "8px 12px",
            background: isError ? "#fde8e8" : "#e9f7e9",
            fontSize: 12,
            color: isError ? "#b34141" : "#2e7d32",
            marginBottom: 12,
            border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
          }}
        >
          {msg}
        </p>
      )}
      <div style={{ display: "grid", gap: 12 }}>
        <div><label style={labelStyle}>Name *</label><input style={inputStyle} value={String(form.name || "")} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div><label style={labelStyle}>Slug</label><input style={inputStyle} value={String(form.slug || "")} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
        <div><label style={labelStyle}>Description</label><input style={inputStyle} value={String(form.description || "")} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div><label style={labelStyle}>Image URL</label><input style={inputStyle} value={String(form.image || "")} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
        <div><label style={labelStyle}>Sort order</label><input type="number" style={inputStyle} value={Number(form.sort || 0)} onChange={e => setForm({ ...form, sort: Number(e.target.value) })} /></div>
        <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
          <label><input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label>
          <label><input type="checkbox" checked={form.visible !== false} onChange={e => setForm({ ...form, visible: e.target.checked })} /> Visible</label>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Category →"}</button>
      </div>
    </div>
  );
}

/* ─── EMPLOYEE EDIT FORM ─── */
function EmployeeEditForm({ item, onSave, inputStyle, labelStyle }: { item: Record<string, unknown>; onSave: () => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true);
    setIsError(false);
    setMsg("");
    const method = form.isNew ? "POST" : "PATCH";
    const body = form.isNew ? JSON.stringify(form) : JSON.stringify({ id: form.id, ...form });
    try {
      const res = await fetch("/api/admin/employees", {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("Employee saved successfully!");
        setTimeout(onSave, 400);
      } else {
        setIsError(true);
        setMsg(d.error || "Failed to save employee.");
      }
    } catch {
      setIsError(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Employee" : "Edit Employee"}</h3>
      {msg && (
        <p
          style={{
            padding: "8px 12px",
            background: isError ? "#fde8e8" : "#e9f7e9",
            fontSize: 12,
            color: isError ? "#b34141" : "#2e7d32",
            marginBottom: 12,
            border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
          }}
        >
          {msg}
        </p>
      )}
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Full name *</label><input style={inputStyle} value={String(form.name || "")} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label style={labelStyle}>Employee ID</label><input style={inputStyle} value={String(form.employeeId || "")} onChange={e => setForm({ ...form, employeeId: e.target.value })} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Designation</label><input style={inputStyle} value={String(form.designation || "")} onChange={e => setForm({ ...form, designation: e.target.value })} /></div>
          <div><label style={labelStyle}>Department</label><input style={inputStyle} value={String(form.department || "")} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Email</label><input style={inputStyle} value={String(form.email || "")} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><label style={labelStyle}>Phone</label><input style={inputStyle} value={String(form.phone || "")} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <div><label style={labelStyle}>Profile Photo URL</label><input style={inputStyle} value={String(form.photo || "")} onChange={e => setForm({ ...form, photo: e.target.value })} /></div>
        <div><label style={labelStyle}>Bio</label><textarea style={{ ...inputStyle, minHeight: 80 }} value={String(form.bio || "")} onChange={e => setForm({ ...form, bio: e.target.value })} /></div>
        <div><label style={labelStyle}>URL Slug</label><input style={inputStyle} value={String(form.slug || "")} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
        <label style={{ fontSize: 13 }}><input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active (profile accessible via QR)</label>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Employee →"}</button>
        {String(form.slug) && !form.isNew ? <p style={{ fontSize: 12, color: "var(--muted)" }}>Public profile URL: <a href={`/employee/${String(form.slug)}`} target="_blank" rel="noopener noreferrer" style={{ color: "var(--purple)" }}>{`/employee/${String(form.slug)}`}</a></p> : null}
      </div>
    </div>
  );
}

/* ─── COUPON EDIT FORM ─── */
function CouponEditForm({ item, onSave, inputStyle, labelStyle }: { item: Record<string, unknown>; onSave: () => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true);
    setIsError(false);
    setMessage("");
    const method = form.isNew ? "POST" : "PATCH";
    const endpoint = form.isNew ? "/api/admin/coupons" : `/api/admin/coupons/${form.id}`;
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMessage("Coupon saved successfully!");
        setTimeout(onSave, 400);
      } else {
        setIsError(true);
        setMessage(d.error || "Failed to save coupon.");
      }
    } catch {
      setIsError(true);
      setMessage("Network error.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 500, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Coupon" : "Edit Coupon"}</h3>
      {message && (
        <p
          style={{
            padding: "8px 12px",
            background: isError ? "#fde8e8" : "#e9f7e9",
            fontSize: 12,
            color: isError ? "#b34141" : "#2e7d32",
            marginBottom: 12,
            border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
          }}
        >
          {message}
        </p>
      )}
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Coupon code *</label><input style={{ ...inputStyle, textTransform: "uppercase" }} value={String(form.code || "")} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} /></div>
          <div><label style={labelStyle}>Type</label><select style={inputStyle} value={String(form.type || "percentage")} onChange={e => setForm({ ...form, type: e.target.value })}><option value="percentage">Percentage</option><option value="flat">Fixed amount</option></select></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Discount</label><input type="number" style={inputStyle} value={Number(form.discount || 0)} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>Min order (₹)</label><input type="number" style={inputStyle} value={Number(form.minOrder || 0)} onChange={e => setForm({ ...form, minOrder: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>Max discount (₹)</label><input type="number" style={inputStyle} value={Number(form.maxDiscount || 0)} onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Usage limit</label><input type="number" style={inputStyle} value={Number(form.usageLimit || 0)} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>Per user limit</label><input type="number" style={inputStyle} value={Number(form.perUserLimit || 1)} onChange={e => setForm({ ...form, perUserLimit: Number(e.target.value) })} /></div>
          <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}><label style={{ fontSize: 13 }}><input type="checkbox" checked={form.isActive !== false} onChange={e => setForm({ ...form, isActive: e.target.checked })} /> Active</label></div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Coupon →"}</button>
      </div>
    </div>
  );
}

/* ─── FAQ EDIT FORM ─── */
function FAQEditForm({ item, onSave, inputStyle, labelStyle }: { item: Record<string, unknown>; onSave: () => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true);
    setIsError(false);
    setMsg("");
    const method = form.isNew ? "POST" : "PATCH";
    const body = form.isNew ? JSON.stringify({ question: form.question, answer: form.answer, category: form.category, sort: form.sort, visible: form.visible }) : JSON.stringify({ id: form.id, question: form.question, answer: form.answer, category: form.category, sort: form.sort, visible: form.visible });
    try {
      const res = await fetch("/api/admin/faq", {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("FAQ saved successfully!");
        setTimeout(onSave, 400);
      } else {
        setIsError(true);
        setMsg(d.error || "Failed to save FAQ.");
      }
    } catch {
      setIsError(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 600, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New FAQ" : "Edit FAQ"}</h3>
      {msg && (
        <p
          style={{
            padding: "8px 12px",
            background: isError ? "#fde8e8" : "#e9f7e9",
            fontSize: 12,
            color: isError ? "#b34141" : "#2e7d32",
            marginBottom: 12,
            border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
          }}
        >
          {msg}
        </p>
      )}
      <div style={{ display: "grid", gap: 12 }}>
        <div><label style={labelStyle}>Question *</label><input style={inputStyle} value={String(form.question || "")} onChange={e => setForm({ ...form, question: e.target.value })} /></div>
        <div><label style={labelStyle}>Answer *</label><textarea style={{ ...inputStyle, minHeight: 100 }} value={String(form.answer || "")} onChange={e => setForm({ ...form, answer: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Category</label><input style={inputStyle} value={String(form.category || "")} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
          <div><label style={labelStyle}>Sort order</label><input type="number" style={inputStyle} value={Number(form.sort || 0)} onChange={e => setForm({ ...form, sort: Number(e.target.value) })} /></div>
        </div>
        <label style={{ fontSize: 13 }}><input type="checkbox" checked={form.visible !== false} onChange={e => setForm({ ...form, visible: e.target.checked })} /> Visible on website</label>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save FAQ →"}</button>
      </div>
    </div>
  );
}

/* ─── AFFILIATE EDIT FORM ─── */
function AffiliateEditForm({ item, onSave, inputStyle, labelStyle }: { item: Record<string, unknown>; onSave: () => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true);
    setIsError(false);
    setMsg("");
    try {
      const res = await fetch(`/api/admin/affiliates/${form.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: form.status,
          commissionRate: Number(form.commissionRate),
          customCoupon: form.customCoupon,
          level: Number(form.level || 1),
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("Affiliate updated successfully!");
        setTimeout(onSave, 400);
      } else {
        setIsError(true);
        setMsg(d.error || "Failed to update affiliate.");
      }
    } catch {
      setIsError(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 600, padding: 24, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "20px var(--font-display)", marginBottom: 16 }}>Edit Affiliate Partner</h3>
      {msg && (
        <p
          style={{
            padding: "8px 12px",
            background: isError ? "#fde8e8" : "#e9f7e9",
            fontSize: 12,
            color: isError ? "#b34141" : "#2e7d32",
            marginBottom: 16,
            border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb",
          }}
        >
          {msg}
        </p>
      )}
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Affiliate Code</label><input style={{ ...inputStyle, background: "#fafafa" }} value={String(form.affiliateCode || "")} readOnly /></div>
          <div>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={String(form.status || "pending")} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Commission Rate (%)</label><input type="number" style={inputStyle} value={Number(form.commissionRate || 10)} onChange={e => setForm({ ...form, commissionRate: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>Tier / Level</label><input type="number" style={inputStyle} value={Number(form.level || 1)} onChange={e => setForm({ ...form, level: Number(e.target.value) })} /></div>
        </div>
        <div>
          <label style={labelStyle}>Custom Coupon Code</label>
          <input style={inputStyle} placeholder="e.g. VIPANANYA" value={String(form.customCoupon || "")} onChange={e => setForm({ ...form, customCoupon: e.target.value })} />
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Affiliate Changes →"}</button>
      </div>
    </div>
  );
}

/* ─── WITHDRAWALS SECTION ─── */
function WithdrawalsSection({ onStatusUpdate }: { onStatusUpdate: () => void }) {
  const [withdrawals, setWithdrawals] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWithdrawals = async () => {
    try {
      const res = await fetch("/api/admin/affiliates/withdrawals");
      const d = await res.json();
      if (d.withdrawals) setWithdrawals(d.withdrawals);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const handleWithdrawalStatus = async (id: string, status: "approved" | "paid" | "rejected") => {
    await fetch("/api/admin/affiliates/withdrawals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ withdrawalId: id, status }),
    });
    loadWithdrawals();
    onStatusUpdate();
  };

  if (loading) return <p style={{ fontSize: 12, color: "var(--muted)" }}>Loading withdrawals…</p>;

  if (withdrawals.length === 0) return <p style={{ fontSize: 13, color: "var(--muted)", padding: "12px 0" }}>No withdrawal requests currently.</p>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Date</th>
            <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Affiliate</th>
            <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Amount</th>
            <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Method</th>
            <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Status</th>
            <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((w) => (
            <tr key={String(w.id)} style={{ borderBottom: "1px solid var(--line)" }}>
              <td style={{ padding: "10px 12px" }}>{new Date(String(w.createdAt)).toLocaleDateString("en-IN")}</td>
              <td style={{ padding: "10px 12px" }}><code>{String((w.affiliate as Record<string, unknown>)?.affiliateCode || w.affiliateId || "—")}</code></td>
              <td style={{ padding: "10px 12px", fontWeight: 600 }}>₹{Number(w.amount).toLocaleString("en-IN")}</td>
              <td style={{ padding: "10px 12px" }}>{String(w.method || "Bank Transfer")}</td>
              <td style={{ padding: "10px 12px" }}><Badge status={String(w.status)} /></td>
              <td style={{ padding: "10px 12px", display: "flex", gap: 6 }}>
                {w.status === "pending" && (
                  <>
                    <button onClick={() => handleWithdrawalStatus(String(w.id), "approved")} style={{ padding: "4px 8px", fontSize: 11, background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9", cursor: "pointer" }}>Approve</button>
                    <button onClick={() => handleWithdrawalStatus(String(w.id), "paid")} style={{ padding: "4px 8px", fontSize: 11, background: "#e3f2fd", color: "#1976d2", border: "1px solid #bbdefb", cursor: "pointer" }}>Mark Paid</button>
                    <button onClick={() => handleWithdrawalStatus(String(w.id), "rejected")} style={{ padding: "4px 8px", fontSize: 11, background: "#ffebee", color: "#c62828", border: "1px solid #ffcdd2", cursor: "pointer" }}>Reject</button>
                  </>
                )}
                {w.status === "approved" && (
                  <button onClick={() => handleWithdrawalStatus(String(w.id), "paid")} style={{ padding: "4px 8px", fontSize: 11, background: "#e3f2fd", color: "#1976d2", border: "1px solid #bbdefb", cursor: "pointer" }}>Mark Paid</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
