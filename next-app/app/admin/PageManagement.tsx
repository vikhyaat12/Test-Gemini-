"use client";

import { useState, useEffect, useCallback } from "react";

type PageSetting = Record<string, unknown> & {
  id: string;
  slug: string;
  title: string;
  label: string;
  headerVisible: boolean;
  footerVisible: boolean;
  sortOrder: number;
  active: boolean;
  isAnchor?: boolean;
};

export default function PageManagement() {
  const [pages, setPages] = useState<PageSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PageSetting | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isErr, setIsErr] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 };
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4 };

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/pages");
      const d = await r.json();
      setPages(d.pages || []);
    } catch { setPages([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startNew = () => {
    setIsNew(true);
    setEditing({ id: "new", slug: "", title: "", label: "", headerVisible: true, footerVisible: true, sortOrder: pages.length, active: true } as PageSetting);
    setForm({ slug: "", title: "", label: "", headerVisible: true, footerVisible: true, sortOrder: pages.length, active: true });
    setMsg("");
  };

  const save = async () => {
    if (!form.slug && !form.title) { setMsg("Title and slug are required."); setIsErr(true); return; }
    setSaving(true);
    setMsg("");
    try {
      const endpoint = "/api/admin/pages";
      const method = isNew ? "POST" : "PATCH";
      const payload = { ...form, id: isNew ? undefined : form.id };
      const r = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (r.ok) {
        setIsErr(false);
        setMsg("Page saved successfully!");
        setEditing(null);
        setIsNew(false);
        load();
      } else {
        setIsErr(true);
        setMsg(d.error || "Failed to save.");
      }
    } catch {
      setIsErr(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  const del = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/pages?id=${id}`, { method: "DELETE" });
    load();
  };

  const toggleHeader = async (page: PageSetting) => {
    await fetch("/api/admin/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: page.id, headerVisible: !page.headerVisible }),
    });
    load();
  };

  const toggleActive = async (page: PageSetting) => {
    await fetch("/api/admin/pages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: page.id, active: !page.active }),
    });
    load();
  };

  const moveUp = async (page: PageSetting, idx: number) => {
    if (idx === 0) return;
    const prev = pages[idx - 1];
    await fetch("/api/admin/pages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: page.id, sortOrder: Number(prev.sortOrder) - 1 }) });
    load();
  };

  const moveDown = async (page: PageSetting, idx: number) => {
    if (idx >= pages.length - 1) return;
    const next = pages[idx + 1];
    await fetch("/api/admin/pages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: page.id, sortOrder: Number(next.sortOrder) + 1 }) });
    load();
  };

  // ─── EDITOR ──────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div style={{ maxWidth: 700 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, font: "20px var(--font-display)" }}>{isNew ? "Create New" : "Edit"} Page</h3>
          <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ padding: "8px 16px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>← Back</button>
        </div>
        {msg && <p style={{ padding: "8px 12px", background: isErr ? "#fde8e8" : "#e9f7e9", fontSize: 12, color: isErr ? "#b34141" : "#2e7d32", marginBottom: 16 }}>{msg}</p>}

        <div style={{ padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Page Title *</label>
                <input style={inputStyle} value={String(form.title || "")} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="About Us" />
              </div>
              <div>
                <label style={labelStyle}>URL Slug *</label>
                <input style={inputStyle} value={String(form.slug || "")} onChange={(e) => setForm({ ...form, slug: e.target.value.replace(/[^a-z0-9-\/#]/g, "").toLowerCase() })} placeholder="about" />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <div>
                <label style={labelStyle}>Navigation Label</label>
                <input style={inputStyle} value={String(form.label || "")} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="About" />
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--muted)" }}>Text shown in navigation (defaults to title)</p>
              </div>
              <div>
                <label style={labelStyle}>Sort Order</label>
                <input type="number" style={inputStyle} value={Number(form.sortOrder || 0)} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                Active (Page exists)
              </label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.headerVisible !== false} onChange={(e) => setForm({ ...form, headerVisible: e.target.checked })} />
                Show in Header Navigation
              </label>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.footerVisible !== false} onChange={(e) => setForm({ ...form, footerVisible: e.target.checked })} />
                Show in Footer
              </label>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button onClick={save} disabled={saving} style={{ padding: "12px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 }}>{saving ? "Saving…" : "Save Page"}</button>
          <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ padding: "12px 24px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, font: "18px var(--font-display)" }}>Page Management ({pages.length} pages)</h3>
        <button onClick={startNew} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>+ Create Page</button>
      </div>

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 30 }}>Loading…</p>
      ) : pages.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 30 }}>No pages found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Page</th>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Slug</th>
              <th style={{ textAlign: "center", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Active</th>
              <th style={{ textAlign: "center", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Header</th>
              <th style={{ textAlign: "center", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Footer</th>
              <th style={{ textAlign: "center", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Order</th>
              <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.map((page, idx) => (
              <tr key={page.id} style={{ borderBottom: "1px solid var(--line)", opacity: page.active === false ? 0.5 : 1 }}>
                <td style={{ padding: "10px 12px", fontWeight: 600 }}>{page.label || page.title}</td>
                <td style={{ padding: "10px 12px" }}><code style={{ fontSize: 11, background: "#f0eeeb", padding: "2px 6px" }}>/{page.slug}</code></td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <button onClick={() => toggleActive(page)} style={{ padding: "3px 10px", fontSize: 11, border: "1px solid var(--line)", background: page.active !== false ? "#e8f5e9" : "#fff", color: page.active !== false ? "#2e7d32" : "var(--muted)", cursor: "pointer" }}>
                    {page.active !== false ? "ON" : "OFF"}
                  </button>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <button onClick={() => toggleHeader(page)} style={{ padding: "3px 10px", fontSize: 11, border: "1px solid var(--line)", background: page.headerVisible !== false ? "#e8f5e9" : "#fff", color: page.headerVisible !== false ? "#2e7d32" : "var(--muted)", cursor: "pointer" }}>
                    {page.headerVisible !== false ? "ON" : "OFF"}
                  </button>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <span style={{ fontSize: 11, color: page.footerVisible !== false ? "#2e7d32" : "var(--muted)" }}>
                    {page.footerVisible !== false ? "ON" : "OFF"}
                  </span>
                </td>
                <td style={{ padding: "10px 12px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 2, justifyContent: "center" }}>
                    <button onClick={() => moveUp(page, idx)} disabled={idx === 0} style={{ padding: "2px 6px", fontSize: 10, border: "1px solid var(--line)", background: "#fff", cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1 }}>↑</button>
                    <button onClick={() => moveDown(page, idx)} disabled={idx >= pages.length - 1} style={{ padding: "2px 6px", fontSize: 10, border: "1px solid var(--line)", background: "#fff", cursor: idx >= pages.length - 1 ? "default" : "pointer", opacity: idx >= pages.length - 1 ? 0.3 : 1 }}>↓</button>
                  </div>
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditing(page); setForm({ ...page }); setIsNew(false); setMsg(""); }} style={{ padding: "4px 10px", fontSize: 11, border: "1px solid var(--line)", background: "#fff", cursor: "pointer" }}>Edit</button>
                  {!page.isAnchor && (
                    <button onClick={() => del(page.id, page.title)} style={{ padding: "4px 10px", fontSize: 11, border: "1px solid #e2c3c3", background: "#fff", color: "#b34141", cursor: "pointer" }}>Del</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ marginTop: 20, padding: "14px 18px", background: "#f5f3f0", border: "1px solid var(--line)", borderRadius: 8 }}>
        <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>📋 How Page Management Works</h4>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
          <li><strong>Header ON</strong> = page appears in public top navigation</li>
          <li><strong>Header OFF</strong> = page is hidden from public navigation (but URL still works)</li>
          <li><strong>Active OFF</strong> = page is completely disabled</li>
          <li><strong>Footer</strong> = visibility in footer links</li>
          <li>Use ↑↓ arrows to reorder navigation items</li>
          <li>Deleting a page removes it permanently — use Active OFF to temporarily hide</li>
        </ul>
      </div>
    </div>
  );
}
