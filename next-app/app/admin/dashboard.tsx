"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import BlogEditForm from "./BlogEditForm";
import { BannerEditForm, TestimonialEditForm, OfferEditForm, SettingsEditForm } from "./ContentEditForms";
import { ProductEditFormAdvanced } from "./ProductEditFormAdvanced";

type Tab = "dashboard" | "orders" | "products" | "product-edit" | "categories" | "customers" | "b2b" | "doctors" | "employees" | "affiliates" | "coupons" | "blog" | "faq" | "reviews" | "media" | "banners" | "testimonials" | "settings" | "offers";

const req = async (path: string, init?: RequestInit) => {
  const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  return r.json();
};

function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = { pending: "#d4ad65", approved: "#4caf50", paid: "#4caf50", active: "#4caf50", delivered: "#4caf50", processing: "#2196f3", shipped: "#2196f3", packed: "#2196f3", cancelled: "#b34141", declined: "#b34141", rejected: "#b34141", failed: "#b34141", refunded: "#9c27b0", suspended: "#ff9800" };
  return <span style={{ padding: "3px 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em", background: colors[status] || "#eee", color: ["pending", "suspended"].includes(status) ? "#333" : "#fff", borderRadius: 3 }}>{status}</span>;
}

function Table({ columns, rows, onEdit, onDelete, onStatusChange }: { columns: { key: string; label: string; render?: (v: unknown, row: Record<string, unknown>) => React.ReactNode }[]; rows: Record<string, unknown>[]; onEdit?: (row: Record<string, unknown>) => void; onDelete?: (row: Record<string, unknown>) => void; onStatusChange?: (row: Record<string, unknown>, status: string) => void }) {
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
          <thead><tr>{columns.map(c => <th key={c.key} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>{c.label}</th>)}{(onEdit || onDelete || onStatusChange) && <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--line)" }}>Actions</th>}</tr></thead>
          <tbody>{visible.map((row, i) => <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>{columns.map(c => <td key={c.key} style={{ padding: "10px 12px" }}>{c.render ? c.render(row[c.key], row) : String(row[c.key] ?? "—")}</td>)}{(onEdit || onDelete || onStatusChange) && <td style={{ padding: "10px 12px", display: "flex", gap: 6, flexWrap: "wrap" }}>{onEdit && <button onClick={() => onEdit(row)} style={{ border: "1px solid var(--line)", background: "#fff", padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>Edit</button>}{onDelete && <button onClick={() => onDelete(row)} style={{ border: "1px solid #e2c3c3", background: "#fff", padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#b34141" }}>Del</button>}{onStatusChange && <button onClick={() => onStatusChange(row, "approved")} style={{ border: "1px solid #c3e6cb", background: "#fff", padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#2e7d32" }}>Approve</button>}</td>}</tr>)}</tbody>
        </table>
      </div>
      {pages > 1 && <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "center" }}><button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ padding: "6px 12px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>← Prev</button><span style={{ padding: "6px 12px", fontSize: 12, color: "var(--muted)" }}>Page {page + 1} of {pages}</span><button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} style={{ padding: "6px 12px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>Next →</button></div>}
    </div>
  );
}

const ENDPOINTS: Record<Tab, string | null> = {
  dashboard: "/api/admin/dashboard", orders: "/api/orders", products: "/api/products",
  categories: "/api/admin/categories", customers: "/api/admin/customers", b2b: "/api/admin/b2b",
  doctors: "/api/admin/doctors", employees: "/api/admin/employees", affiliates: "/api/admin/affiliates",
  coupons: "/api/admin/coupons", blog: "/api/blog", faq: "/api/admin/faq",
  reviews: "/api/admin/reviews", media: "/api/admin/media", banners: "/api/admin/banners",
  testimonials: "/api/admin/testimonials", settings: "/api/admin/settings", offers: "/api/admin/offers",
  "product-edit": null,
};

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [data, setData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [editingItem, setEditingItem] = useState<Record<string, unknown> | null>(null);

  const doRefresh = useCallback(async () => {
    try {
      const url = ENDPOINTS[tab];
      if (url) { setLoading(true); const d = await req(url); setData(d); }
    } catch { setMessage("Failed to load data."); }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = ENDPOINTS[tab];
        if (url) { setLoading(true); const d = await req(url); if (!cancelled) setData(d); }
      } catch { if (!cancelled) setMessage("Failed to load data."); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [tab]);

  const handleDelete = async (endpoint: string, id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    await req(`${endpoint}?id=${id}`, { method: "DELETE" });
    setMessage("Deleted successfully.");
    doRefresh();
  };

  const handleStatusUpdate = async (endpoint: string, id: string, status: string) => {
    await req(`${endpoint}/${id}`, { method: "PATCH", body: JSON.stringify({ status }) });
    setMessage(`Status updated to ${status}.`);
    doRefresh();
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "products", label: "Products", icon: "🏷️" },
    { id: "categories", label: "Categories", icon: "📁" },
    { id: "customers", label: "Customers", icon: "👥" },
    { id: "b2b", label: "B2B", icon: "🏢" },
    { id: "doctors", label: "Doctors", icon: "⚕️" },
    { id: "employees", label: "Employees", icon: "👤" },
    { id: "affiliates", label: "Affiliates", icon: "🤝" },
    { id: "coupons", label: "Coupons", icon: "🎫" },
    { id: "blog", label: "Blog", icon: "📝" },
    { id: "faq", label: "FAQ", icon: "❓" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
    { id: "banners", label: "Banners", icon: "🎯" },
    { id: "testimonials", label: "Testimonials", icon: "💬" },
    { id: "offers", label: "Offers", icon: "🏷️" },
    { id: "media", label: "Media", icon: "🖼️" },
    { id: "settings", label: "Settings", icon: "⚙️" },
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
            <button key={t.id} onClick={() => { setTab(t.id); setEditingItem(null); setMessage(""); }}
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
            {message && <p style={{ margin: "8px 0 0", padding: "8px 12px", background: "#e9f7e9", fontSize: 12, color: "#2e7d32" }}>{message}</p>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {editingItem && <button onClick={() => { setEditingItem(null); }} style={{ padding: "8px 16px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>← Back to list</button>}
            <button onClick={doRefresh} style={{ padding: "8px 16px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>↻ Refresh</button>
          </div>
        </div>

        {loading ? <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading…</p> : (
          <>
            {/* ─── DASHBOARD ─── */}
            {tab === "dashboard" && (
              <div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 30 }}>
                  {((data?.metrics as Record<string, number>) || {}).orders !== undefined && [
                    { label: "Total Orders", value: (data.metrics as Record<string, number>).orders, color: "var(--purple)" },
                    { label: "Revenue", value: `₹${((data.metrics as Record<string, number>).revenue || 0).toLocaleString("en-IN")}`, color: "var(--gold)" },
                    { label: "Products", value: (data.metrics as Record<string, number>).products, color: "#4caf50" },
                    { label: "Low Stock", value: (data.metrics as Record<string, number>).lowStock, color: "#b34141" },
                  ].map(m => (
                    <div key={m.label} style={{ padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
                      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>{m.label}</span>
                      <b style={{ display: "block", marginTop: 8, font: "26px var(--font-display)", color: m.color }}>{m.value}</b>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── PRODUCT EDIT FORM ─── */}
            {tab === "products" && editingItem && (
              <ProductEditFormAdvanced item={editingItem} onSave={() => { setEditingItem(null); setMessage("Product saved."); doRefresh(); }} />
            )}

            {/* ─── PRODUCTS TABLE ─── */}
            {tab === "products" && !editingItem && data?.products && (
              <Table
                columns={[
                  { key: "name", label: "Product" },
                  { key: "category", label: "Category" },
                  { key: "price", label: "Price", render: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
                  { key: "stock", label: "Stock", render: (v, row) => <span style={{ color: Number(v) < Number(row.lowStockThreshold || 10) ? "#b34141" : "inherit" }}>{String(v)}</span> },
                  { key: "active", label: "Active", render: (v) => v ? "✓" : "✗" },
                ]}
                rows={(data.products as Record<string, unknown>[]) || []}
                onEdit={(row) => setEditingItem({ ...row, _type: "product" })}
                onDelete={(row) => { if (confirm("Delete this product?")) { req(`/api/products/${String(row.id)}`, { method: "DELETE" }); setMessage("Product deleted."); setTimeout(doRefresh, 500); } }}
              />
            )}

            {/* ─── CATEGORIES TABLE ─── */}
            {tab === "categories" && (
              <div>
                <button onClick={() => setEditingItem({ _type: "category", isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add Category</button>
                <Table
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "slug", label: "Slug" },
                    { key: "sort", label: "Sort" },
                    { key: "active", label: "Active", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.categories as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "category" })}
                  onDelete={(row) => handleDelete("/api/admin/categories", String(row.id))}
                />
                {editingItem?._type === "category" && (
                  <CategoryEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Category saved."); doRefresh(); }} inputStyle={inputStyle} labelStyle={labelStyle} />
                )}
              </div>
            )}

            {/* ─── ORDERS TABLE ─── */}
            {tab === "orders" && data?.orders && (
              <Table
                columns={[
                  { key: "id", label: "Order ID", render: (v) => <span style={{ fontFamily: "monospace", fontSize: 11 }}>{String(v).slice(0, 12)}…</span> },
                  { key: "status", label: "Status", render: (v) => <Badge status={String(v)} /> },
                  { key: "total", label: "Total", render: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
                  { key: "paymentStatus", label: "Payment", render: (v) => <Badge status={String(v || "pending")} /> },
                  { key: "createdAt", label: "Date", render: (v) => new Date(String(v)).toLocaleDateString("en-IN") },
                ]}
                rows={(data.orders as Record<string, unknown>[]) || []}
                onStatusChange={(row, s) => { handleStatusUpdate("/api/admin/orders", String(row.id), s); }}
              />
            )}

            {/* ─── CUSTOMERS ─── */}
            {tab === "customers" && data?.customers && (
              <Table
                columns={[
                  { key: "name", label: "Name" },
                  { key: "email", label: "Email" },
                  { key: "role", label: "Role", render: (v) => <Badge status={String(v)} /> },
                  { key: "createdAt", label: "Joined", render: (v) => new Date(String(v)).toLocaleDateString("en-IN") },
                ]}
                rows={((data.customers as Record<string, unknown>[]) || [])}
              />
            )}

            {/* ─── B2B ─── */}
            {tab === "b2b" && (
              <div>
                <h3 style={{ font: "18px var(--font-display)", margin: "0 0 16px" }}>Applications</h3>
                <Table
                  columns={[
                    { key: "company", label: "Company" },
                    { key: "name", label: "Contact" },
                    { key: "email", label: "Email" },
                    { key: "status", label: "Status", render: (v) => <Badge status={String(v)} /> },
                  ]}
                  rows={((data.applications as Record<string, unknown>[]) || [])}
                  onStatusChange={(row, s) => { handleStatusUpdate("/api/admin/b2b", String(row.id), s); setMessage(`Application ${s}.`); }}
                />
                <h3 style={{ font: "18px var(--font-display)", margin: "24px 0 16px" }}>Distributors</h3>
                <Table
                  columns={[
                    { key: "company", label: "Company" },
                    { key: "contactName", label: "Contact" },
                    { key: "status", label: "Status", render: (v) => <Badge status={String(v)} /> },
                  ]}
                  rows={((data.distributors as Record<string, unknown>[]) || [])}
                />
              </div>
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
                onStatusChange={(row, s) => { handleStatusUpdate("/api/admin/doctors", String(row.id), s); setMessage(`Doctor ${s}.`); }}
              />
            )}

            {/* ─── EMPLOYEES ─── */}
            {tab === "employees" && !editingItem?.employeeEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "employee", employeeEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Add Employee</button>
                <Table
                  columns={[
                    { key: "name", label: "Name" },
                    { key: "designation", label: "Designation" },
                    { key: "department", label: "Department" },
                    { key: "employeeId", label: "Employee ID" },
                    { key: "active", label: "Active", render: (v) => v ? "✓" : "✗" },
                  ]}
                  rows={((data.employees as Record<string, unknown>[]) || [])}
                  onEdit={(row) => setEditingItem({ ...row, _type: "employee", employeeEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/employees", String(row.id))}
                />
              </div>
            )}
            {tab === "employees" && editingItem?.employeeEdit && (
              <EmployeeEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Employee saved."); doRefresh(); }} inputStyle={inputStyle} labelStyle={labelStyle} />
            )}

            {/* ─── AFFILIATES ─── */}
            {tab === "affiliates" && data?.affiliates && (
              <Table
                columns={[
                  { key: "affiliateCode", label: "Code" },
                  { key: "user", label: "User", render: (v) => String((v as Record<string, unknown>)?.name || "—") },
                  { key: "status", label: "Status", render: (v) => <Badge status={String(v)} /> },
                  { key: "totalCommission", label: "Commission", render: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
                  { key: "wallet", label: "Wallet", render: (v) => `₹${Number(v).toLocaleString("en-IN")}` },
                ]}
                rows={((data.affiliates as Record<string, unknown>[]) || [])}
                onStatusChange={(row, s) => { handleStatusUpdate("/api/admin/affiliates", String(row.id), s); setMessage(`Affiliate ${s}.`); }}
              />
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
              <CouponEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Coupon saved."); doRefresh(); }} inputStyle={inputStyle} labelStyle={labelStyle} />
            )}

                        {/* ─── BLOG ─── */}
            {tab === "blog" && !editingItem?.blogEdit && (
              <div>
                <button onClick={() => setEditingItem({ _type: "blog", blogEdit: true, isNew: true })} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, marginBottom: 16 }}>+ Create Post</button>
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
                  onEdit={(row) => setEditingItem({ ...row, _type: "blog", blogEdit: true })}
                  onDelete={(row) => handleDelete("/api/admin/blog", String(row.id))}
                />
              </div>
            )}
            {tab === "blog" && editingItem?.blogEdit && (
              <BlogEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Post saved."); doRefresh(); }} inputStyle={inputStyle} labelStyle={labelStyle} />
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
              <FAQEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("FAQ saved."); doRefresh(); }} inputStyle={inputStyle} labelStyle={labelStyle} />
            )}

            {/* ─── REVIEWS ─── */}
            {tab === "reviews" && data?.reviews && (
              <Table
                columns={[
                  { key: "product", label: "Product", render: (v) => String((v as Record<string, unknown>)?.name || "—") },
                  { key: "user", label: "User", render: (v) => String((v as Record<string, unknown>)?.name || "—") },
                  { key: "rating", label: "Rating", render: (v) => "★".repeat(Number(v)) },
                  { key: "title", label: "Title" },
                  { key: "visible", label: "Visible", render: (v) => v ? "✓" : "✗" },
                ]}
                rows={((data.reviews as Record<string, unknown>[]) || [])}
                onEdit={(row) => { req("/api/admin/reviews", { method: "PATCH", body: JSON.stringify({ reviewId: row.id, visible: !row.visible }) }); setMessage("Review visibility toggled."); doRefresh(); }}
                onDelete={(row) => { req(`/api/admin/reviews?reviewId=${row.id}`, { method: "DELETE" }); setMessage("Review deleted."); doRefresh(); }}
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
              <BannerEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Banner saved."); doRefresh(); }} />
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
              <TestimonialEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Testimonial saved."); doRefresh(); }} />
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
              <OfferEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Offer saved."); doRefresh(); }} />
            )}

            {/* ─── MEDIA ─── */}
            {tab === "media" && data?.media && (
              <Table
                columns={[
                  { key: "filename", label: "File" },
                  { key: "type", label: "Type", render: (v) => <Badge status={String(v)} /> },
                  { key: "alt", label: "Alt Text" },
                  { key: "size", label: "Size", render: (v) => v ? `${(Number(v) / 1024).toFixed(1)} KB` : "—" },
                ]}
                rows={((data.media as Record<string, unknown>[]) || [])}
                onDelete={(row) => handleDelete("/api/admin/media", String(row.id))}
              />
            )}

            {/* ─── SETTINGS ─── */}
            {tab === "settings" && !editingItem?.settingEdit && (
              <div>
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
              <SettingsEditForm item={editingItem} onSave={() => { setEditingItem(null); setMessage("Setting saved."); doRefresh(); }} />
            )}
          </>
        )}
      </div>
    </main>
  );
}

/* ─── PRODUCT EDIT FORM ─────────────────────────────────────────────────── */
function ProductEditForm({ item, onSave, inputStyle, labelStyle }: { item: Record<string, unknown>; onSave: () => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const save = async () => {
    setSaving(true);
    const id = String(form.id);
    try {
      const res = await fetch(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(form) });
      if (res.ok) { setMessage("Product updated!"); setTimeout(onSave, 500); }
      else { setMessage("Failed to update."); }
    } catch { setMessage("Network error."); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <h3 style={{ font: "20px var(--font-display)", marginBottom: 20 }}>Edit Product</h3>
      {message && <p style={{ padding: "8px 12px", background: "#e9f7e9", fontSize: 12, color: "#2e7d32", marginBottom: 16 }}>{message}</p>}
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Name</label><input style={inputStyle} value={String(form.name || "")} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label style={labelStyle}>Slug</label><input style={inputStyle} value={String(form.slug || "")} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Category</label><input style={inputStyle} value={String(form.category || "")} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
          <div><label style={labelStyle}>Brand</label><input style={inputStyle} value={String(form.brand || "Queens Care")} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
          <div><label style={labelStyle}>SKU</label><input style={inputStyle} value={String(form.slug || "")} readOnly /></div>
        </div>
        <div><label style={labelStyle}>Short description</label><input style={inputStyle} value={String(form.shortDescription || "")} onChange={e => setForm({ ...form, shortDescription: e.target.value })} /></div>
        <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 100 }} value={String(form.description || "")} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Price (₹)</label><input type="number" style={inputStyle} value={Number(form.price || 0)} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>MRP (₹)</label><input type="number" style={inputStyle} value={Number(form.mrp || 0)} onChange={e => setForm({ ...form, mrp: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>Discount %</label><input type="number" style={inputStyle} value={Number(form.discount || 0)} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>Stock</label><input type="number" style={inputStyle} value={Number(form.stock || 0)} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></div>
        </div>
        <div><label style={labelStyle}>Image URL</label><input style={inputStyle} value={String(form.image || "")} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
        <div><label style={labelStyle}>Video URL</label><input style={inputStyle} value={String(form.video || "")} onChange={e => setForm({ ...form, video: e.target.value })} /></div>
        <div><label style={labelStyle}>Ingredients</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.ingredients || "")} onChange={e => setForm({ ...form, ingredients: e.target.value })} /></div>
        <div><label style={labelStyle}>Usage</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.usage || "")} onChange={e => setForm({ ...form, usage: e.target.value })} /></div>
        <div><label style={labelStyle}>Safety information</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.safetyInfo || "")} onChange={e => setForm({ ...form, safetyInfo: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>SEO Title</label><input style={inputStyle} value={String(form.seoTitle || "")} onChange={e => setForm({ ...form, seoTitle: e.target.value })} /></div>
          <div><label style={labelStyle}>SEO Description</label><input style={inputStyle} value={String(form.seoDescription || "")} onChange={e => setForm({ ...form, seoDescription: e.target.value })} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: 16, fontSize: 13 }}>
          <label><input type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label>
          <label><input type="checkbox" checked={!!form.visible} onChange={e => setForm({ ...form, visible: e.target.checked })} /> Visible</label>
          <label><input type="checkbox" checked={!!form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
          <label><input type="checkbox" checked={!!form.homepageVisible} onChange={e => setForm({ ...form, homepageVisible: e.target.checked })} /> Homepage</label>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Changes →"}</button>
      </div>
    </div>
  );
}

/* ─── CATEGORY EDIT FORM ─── */
function CategoryEditForm({ item, onSave, inputStyle, labelStyle }: { item: Record<string, unknown>; onSave: () => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const method = form.isNew ? "POST" : "PATCH";
    const body = form.isNew ? JSON.stringify(form) : JSON.stringify({ id: form.id, ...form });
    await fetch("/api/admin/categories", { method, body });
    onSave();
  };
  return (
    <div style={{ maxWidth: 500, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Category" : "Edit Category"}</h3>
      <div style={{ display: "grid", gap: 12 }}>
        <div><label style={labelStyle}>Name</label><input style={inputStyle} value={String(form.name || "")} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
        <div><label style={labelStyle}>Description</label><input style={inputStyle} value={String(form.description || "")} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div><label style={labelStyle}>Image URL</label><input style={inputStyle} value={String(form.image || "")} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
        <div><label style={labelStyle}>Sort order</label><input type="number" style={inputStyle} value={Number(form.sort || 0)} onChange={e => setForm({ ...form, sort: Number(e.target.value) })} /></div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Category →"}</button>
      </div>
    </div>
  );
}

/* ─── EMPLOYEE EDIT FORM ─── */
function EmployeeEditForm({ item, onSave, inputStyle, labelStyle }: { item: Record<string, unknown>; onSave: () => void; inputStyle: React.CSSProperties; labelStyle: React.CSSProperties }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    const method = form.isNew ? "POST" : "PATCH";
    const body = form.isNew ? JSON.stringify(form) : JSON.stringify({ id: form.id, ...form });
    await fetch("/api/admin/employees", { method, body });
    onSave();
  };
  return (
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Employee" : "Edit Employee"}</h3>
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
  const save = async () => {
    setSaving(true);
    const method = form.isNew ? "POST" : "PATCH";
    const endpoint = form.isNew ? "/api/admin/coupons" : `/api/admin/coupons/${form.id}`;
    try {
      const res = await fetch(endpoint, { method, body: JSON.stringify(form) });
      if (res.ok) { setMessage("Coupon saved!"); setTimeout(onSave, 500); }
      else { const d = await res.json(); setMessage(d.error || "Failed."); }
    } catch { setMessage("Error."); }
    setSaving(false);
  };
  return (
    <div style={{ maxWidth: 500, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Coupon" : "Edit Coupon"}</h3>
      {message && <p style={{ padding: "8px 12px", background: "#e9f7e9", fontSize: 12, color: "#2e7d32", marginBottom: 12 }}>{message}</p>}
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
  const save = async () => {
    setSaving(true);
    const method = form.isNew ? "POST" : "PATCH";
    const body = form.isNew ? JSON.stringify({ question: form.question, answer: form.answer, category: form.category, sort: form.sort, visible: form.visible }) : JSON.stringify({ id: form.id, question: form.question, answer: form.answer, category: form.category, sort: form.sort, visible: form.visible });
    await fetch("/api/admin/faq", { method, body });
    onSave();
  };
  return (
    <div style={{ maxWidth: 600, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New FAQ" : "Edit FAQ"}</h3>
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
