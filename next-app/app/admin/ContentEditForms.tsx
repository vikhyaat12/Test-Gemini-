"use client";

import { useState } from "react";

const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 };
const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4 };

/* ─── BANNER EDIT FORM ─── */
export function BannerEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const save = async () => {
    setSaving(true);
    const method = form.isNew ? "POST" : "PATCH";
    const endpoint = form.isNew ? "/api/admin/banners" : `/api/admin/banners/${form.id}`;
    try {
      const res = await fetch(endpoint, { method, body: JSON.stringify(form) });
      if (res.ok) { setMsg("Saved!"); setTimeout(onSave, 400); }
      else { const d = await res.json(); setMsg(d.error || "Failed."); }
    } catch { setMsg("Network error."); }
    setSaving(false);
  };
  return (
    <div style={{ maxWidth: 600, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Banner" : "Edit Banner"}</h3>
      {msg && <p style={{ padding: "6px 10px", background: "#e9f7e9", fontSize: 12, color: "#2e7d32", marginBottom: 12 }}>{msg}</p>}
      <div style={{ display: "grid", gap: 12 }}>
        <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={String(form.title || "")} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><label style={labelStyle}>Subtitle</label><input style={inputStyle} value={String(form.subtitle || "")} onChange={e => setForm({ ...form, subtitle: e.target.value })} /></div>
        <div><label style={labelStyle}>Image URL</label><input style={inputStyle} value={String(form.image || "")} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
        <div><label style={labelStyle}>Link / CTA URL</label><input style={inputStyle} value={String(form.link || "")} onChange={e => setForm({ ...form, link: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Position</label><select style={inputStyle} value={String(form.position || "hero")} onChange={e => setForm({ ...form, position: e.target.value })}>
            <option value="hero">Hero</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="sidebar">Sidebar</option>
          </select></div>
          <div><label style={labelStyle}>Sort order</label><input type="number" style={inputStyle} value={Number(form.sort || 0)} onChange={e => setForm({ ...form, sort: Number(e.target.value) })} /></div>
          <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}><label style={{ fontSize: 13 }}><input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label></div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Banner →"}</button>
      </div>
    </div>
  );
}

/* ─── TESTIMONIAL EDIT FORM ─── */
export function TestimonialEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const save = async () => {
    setSaving(true);
    const method = form.isNew ? "POST" : "PATCH";
    const endpoint = form.isNew ? "/api/admin/testimonials" : `/api/admin/testimonials/${form.id}`;
    try {
      const res = await fetch(endpoint, { method, body: JSON.stringify(form) });
      if (res.ok) { setMsg("Saved!"); setTimeout(onSave, 400); }
      else { const d = await res.json(); setMsg(d.error || "Failed."); }
    } catch { setMsg("Network error."); }
    setSaving(false);
  };
  return (
    <div style={{ maxWidth: 600, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Testimonial" : "Edit Testimonial"}</h3>
      {msg && <p style={{ padding: "6px 10px", background: "#e9f7e9", fontSize: 12, color: "#2e7d32", marginBottom: 12 }}>{msg}</p>}
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Name *</label><input style={inputStyle} value={String(form.name || "")} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div><label style={labelStyle}>Title / Role</label><input style={inputStyle} value={String(form.title || "")} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        </div>
        <div><label style={labelStyle}>Review / Testimonial *</label><textarea style={{ ...inputStyle, minHeight: 100 }} value={String(form.body || "")} onChange={e => setForm({ ...form, body: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Rating (1-5)</label><input type="number" min={1} max={5} style={inputStyle} value={Number(form.rating || 5)} onChange={e => setForm({ ...form, rating: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>Image URL</label><input style={inputStyle} value={String(form.image || "")} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
          <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}><label style={{ fontSize: 13 }}><input type="checkbox" checked={form.visible !== false} onChange={e => setForm({ ...form, visible: e.target.checked })} /> Visible</label></div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Testimonial →"}</button>
      </div>
    </div>
  );
}

/* ─── OFFER EDIT FORM ─── */
export function OfferEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const save = async () => {
    setSaving(true);
    const method = form.isNew ? "POST" : "PATCH";
    const endpoint = form.isNew ? "/api/admin/offers" : `/api/admin/offers/${form.id}`;
    try {
      const res = await fetch(endpoint, { method, body: JSON.stringify(form) });
      if (res.ok) { setMsg("Saved!"); setTimeout(onSave, 400); }
      else { const d = await res.json(); setMsg(d.error || "Failed."); }
    } catch { setMsg("Network error."); }
    setSaving(false);
  };
  return (
    <div style={{ maxWidth: 600, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Offer" : "Edit Offer"}</h3>
      {msg && <p style={{ padding: "6px 10px", background: "#e9f7e9", fontSize: 12, color: "#2e7d32", marginBottom: 12 }}>{msg}</p>}
      <div style={{ display: "grid", gap: 12 }}>
        <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={String(form.title || "")} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
        <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.description || "")} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Type</label><select style={inputStyle} value={String(form.type || "percentage")} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="percentage">Percentage</option><option value="flat">Flat amount</option><option value="buyXget">Buy X Get Y</option>
          </select></div>
          <div><label style={labelStyle}>Discount value</label><input type="number" style={inputStyle} value={Number(form.discount || 0)} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>Coupon code</label><input style={inputStyle} value={String(form.couponCode || "")} onChange={e => setForm({ ...form, couponCode: e.target.value })} /></div>
        </div>
        <div><label style={labelStyle}>Image URL</label><input style={inputStyle} value={String(form.image || "")} onChange={e => setForm({ ...form, image: e.target.value })} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Min order (₹)</label><input type="number" style={inputStyle} value={Number(form.minOrder || 0)} onChange={e => setForm({ ...form, minOrder: Number(e.target.value) })} /></div>
          <div><label style={labelStyle}>Start date</label><input type="date" style={inputStyle} value={String(form.startDate || "")} onChange={e => setForm({ ...form, startDate: e.target.value })} /></div>
          <div><label style={labelStyle}>End date</label><input type="date" style={inputStyle} value={String(form.endDate || "")} onChange={e => setForm({ ...form, endDate: e.target.value })} /></div>
          <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}><label style={{ fontSize: 13 }}><input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label></div>
        </div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Offer →"}</button>
      </div>
    </div>
  );
}

/* ─── SETTINGS EDIT FORM ─── */
export function SettingsEditForm({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", { method: "POST", body: JSON.stringify({ settings: [form] }) });
      if (res.ok) { setMsg("Saved!"); setTimeout(onSave, 400); }
      else { setMsg("Failed."); }
    } catch { setMsg("Network error."); }
    setSaving(false);
  };
  return (
    <div style={{ maxWidth: 500, marginTop: 20, padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
      <h3 style={{ font: "18px var(--font-display)", marginBottom: 16 }}>{form.isNew ? "New Setting" : "Edit Setting"}</h3>
      {msg && <p style={{ padding: "6px 10px", background: "#e9f7e9", fontSize: 12, color: "#2e7d32", marginBottom: 12 }}>{msg}</p>}
      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><label style={labelStyle}>Key *</label><input style={inputStyle} value={String(form.key || "")} onChange={e => setForm({ ...form, key: e.target.value })} /></div>
          <div><label style={labelStyle}>Group</label><input style={inputStyle} value={String(form.group || "")} onChange={e => setForm({ ...form, group: e.target.value })} /></div>
        </div>
        <div><label style={labelStyle}>Value *</label><textarea style={{ ...inputStyle, minHeight: 80 }} value={typeof form.value === "string" ? form.value : JSON.stringify(form.value || "")} onChange={e => setForm({ ...form, value: e.target.value })} /></div>
        <button onClick={save} disabled={saving} style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, width: "fit-content" }}>{saving ? "Saving…" : "Save Setting →"}</button>
      </div>
    </div>
  );
}
