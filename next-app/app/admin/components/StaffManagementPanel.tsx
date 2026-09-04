"use client";

import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   StaffManagementPanel — staff CRUD with roles and permissions
   Extracted from dashboard.tsx for maintainability.
   ═══════════════════════════════════════════════════════════════ */

const ALL_PERMISSIONS = ["orders", "products", "customers", "homepage", "pages", "blog", "reviews", "marketing", "notifications", "analytics", "employees", "b2b", "careers", "settings", "payments", "shipping", "media", "social_links", "coupons", "staff"];

export default function StaffManagementPanel() {
  const [staff, setStaff] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin", permissions: ["orders", "products", "customers", "homepage", "pages", "blog", "analytics", "settings"] as string[] });
  const [editingId, setEditingId] = useState<string | null>(null);

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
