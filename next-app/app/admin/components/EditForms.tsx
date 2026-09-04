"use client";

import { useEffect, useState } from "react";
import { Badge } from "./shared";

/* ═══════════════════════════════════════════════════════════════
   EditForms — Category, Employee, Coupon, FAQ, Affiliate, Withdrawals
   Extracted from dashboard.tsx for maintainability.
   ═══════════════════════════════════════════════════════════════ */

const inputStyle: React.CSSProperties = { padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13, width: "100%", boxSizing: "border-box" as const };
const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: ".06em", color: "var(--muted)", marginBottom: 4, display: "block" };

/* ── Category Edit Form ─── */
export function CategoryEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true); setIsError(false); setMsg("");
    const method = form.isNew ? "POST" : "PATCH";
    const body = form.isNew ? JSON.stringify(form) : JSON.stringify({ id: form.id, ...form });
    try {
      const res = await fetch("/api/admin/categories", { method, headers: { "Content-Type": "application/json" }, body });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setIsError(false); setMsg("Category saved successfully!"); setTimeout(onSave, 400); }
      else { setIsError(true); setMsg(d.error || "Failed to save category."); }
    } catch { setIsError(true); setMsg("Network error."); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 500, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Category" : "Edit Category"}</h3>
      {msg && <p style={{ padding: "8px 12px", background: isError ? "#fde8e8" : "#e9f7e9", fontSize: 12, color: isError ? "#b34141" : "#2e7d32", marginBottom: 12, border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb" }}>{msg}</p>}
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

/* ── Employee Edit Form ─── */
export function EmployeeEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true); setIsError(false); setMsg("");
    const method = form.isNew ? "POST" : "PATCH";
    const body = form.isNew ? JSON.stringify(form) : JSON.stringify({ id: form.id, ...form });
    try {
      const res = await fetch("/api/admin/employees", { method, headers: { "Content-Type": "application/json" }, body });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setIsError(false); setMsg("Employee saved successfully!"); setTimeout(onSave, 400); }
      else { setIsError(true); setMsg(d.error || "Failed to save employee."); }
    } catch { setIsError(true); setMsg("Network error."); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Employee" : "Edit Employee"}</h3>
      {msg && <p style={{ padding: "8px 12px", background: isError ? "#fde8e8" : "#e9f7e9", fontSize: 12, color: isError ? "#b34141" : "#2e7d32", marginBottom: 12, border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb" }}>{msg}</p>}
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

/* ── Coupon Edit Form ─── */
export function CouponEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true); setIsError(false); setMessage("");
    const method = form.isNew ? "POST" : "PATCH";
    const endpoint = form.isNew ? "/api/admin/coupons" : `/api/admin/coupons/${form.id}`;
    try {
      const res = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setIsError(false); setMessage("Coupon saved successfully!"); setTimeout(onSave, 400); }
      else { setIsError(true); setMessage(d.error || "Failed to save coupon."); }
    } catch { setIsError(true); setMessage("Network error."); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 500, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Coupon" : "Edit Coupon"}</h3>
      {message && <p style={{ padding: "8px 12px", background: isError ? "#fde8e8" : "#e9f7e9", fontSize: 12, color: isError ? "#b34141" : "#2e7d32", marginBottom: 12, border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb" }}>{message}</p>}
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

/* ── FAQ Edit Form ─── */
export function FAQEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true); setIsError(false); setMsg("");
    const method = form.isNew ? "POST" : "PATCH";
    const body = form.isNew ? JSON.stringify({ question: form.question, answer: form.answer, category: form.category, sort: form.sort, visible: form.visible }) : JSON.stringify({ id: form.id, question: form.question, answer: form.answer, category: form.category, sort: form.sort, visible: form.visible });
    try {
      const res = await fetch("/api/admin/faq", { method, headers: { "Content-Type": "application/json" }, body });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setIsError(false); setMsg("FAQ saved successfully!"); setTimeout(onSave, 400); }
      else { setIsError(true); setMsg(d.error || "Failed to save FAQ."); }
    } catch { setIsError(true); setMsg("Network error."); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 600, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New FAQ" : "Edit FAQ"}</h3>
      {msg && <p style={{ padding: "8px 12px", background: isError ? "#fde8e8" : "#e9f7e9", fontSize: 12, color: isError ? "#b34141" : "#2e7d32", marginBottom: 12, border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb" }}>{msg}</p>}
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

/* ── Affiliate Edit Form ─── */
export function AffiliateEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);

  const save = async () => {
    setSaving(true); setIsError(false); setMsg("");
    try {
      const res = await fetch(`/api/admin/affiliates/${form.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: form.status, commissionRate: Number(form.commissionRate), customCoupon: form.customCoupon, level: Number(form.level || 1) }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { setIsError(false); setMsg("Affiliate updated successfully!"); setTimeout(onSave, 400); }
      else { setIsError(true); setMsg(d.error || "Failed to update affiliate."); }
    } catch { setIsError(true); setMsg("Network error."); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 600, padding: 24, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "20px var(--font-display)", marginBottom: 16 }}>Edit Affiliate Partner</h3>
      {msg && <p style={{ padding: "8px 12px", background: isError ? "#fde8e8" : "#e9f7e9", fontSize: 12, color: isError ? "#b34141" : "#2e7d32", marginBottom: 16, border: isError ? "1px solid #f8b4b4" : "1px solid #c3e6cb" }}>{msg}</p>}
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Affiliate Code</label><input style={{ ...inputStyle, background: "#fafafa" }} value={String(form.affiliateCode || "")} readOnly /></div>
          <div><label style={labelStyle}>Status</label><select style={inputStyle} value={String(form.status || "pending")} onChange={e => setForm({ ...form, status: e.target.value })}><option value="pending">Pending</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option></select></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Commission Rate (%)</label><input type="number" style={inputStyle} value={Number(form.commissionRate || 10)} onChange={e => setForm({ ...form, commissionRate: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>Tier / Level</label><input type="number" style={inputStyle} value={Number(form.level || 1)} onChange={e => setForm({ ...form, level: Number(e.target.value) })} /></div>
        </div>
        <div><label style={labelStyle}>Custom Coupon Code</label><input style={inputStyle} placeholder="e.g. VIPANANYA" value={String(form.customCoupon || "")} onChange={e => setForm({ ...form, customCoupon: e.target.value })} /></div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Affiliate Changes →"}</button>
      </div>
    </div>
  );
}

/* ── Withdrawals Section ─── */
export function WithdrawalsSection({ onStatusUpdate }: { onStatusUpdate: () => void }) {
  const [withdrawals, setWithdrawals] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWithdrawals = async () => {
    try { const res = await fetch("/api/admin/affiliates/withdrawals"); const d = await res.json(); if (d.withdrawals) setWithdrawals(d.withdrawals); } catch {}
    setLoading(false);
  };

  useEffect(() => { loadWithdrawals(); }, []);

  const handleWithdrawalStatus = async (id: string, status: "approved" | "paid" | "rejected") => {
    await fetch("/api/admin/affiliates/withdrawals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ withdrawalId: id, status }) });
    loadWithdrawals(); onStatusUpdate();
  };

  if (loading) return <p style={{ fontSize: 12, color: "var(--muted)" }}>Loading withdrawals…</p>;
  if (withdrawals.length === 0) return <p style={{ fontSize: 13, color: "var(--muted)", padding: "12px 0" }}>No withdrawal requests currently.</p>;

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr>
          {["Date", "Affiliate", "Amount", "Method", "Status", "Actions"].map(h => (
            <th key={h} style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>{h}</th>
          ))}
        </tr></thead>
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
                {w.status === "approved" && <button onClick={() => handleWithdrawalStatus(String(w.id), "paid")} style={{ padding: "4px 8px", fontSize: 11, background: "#e3f2fd", color: "#1976d2", border: "1px solid #bbdefb", cursor: "pointer" }}>Mark Paid</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
