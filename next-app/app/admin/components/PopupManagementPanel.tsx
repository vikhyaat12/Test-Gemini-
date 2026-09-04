"use client";

import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   POPUP MANAGEMENT PANEL — Admin CRUD for site popups
   ═══════════════════════════════════════════════════════════════ */

type Popup = {
  id: string;
  title: string;
  heading: string;
  text: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
  placement: string;
  trigger: string;
  delay: number;
  enabled: boolean;
  visible: boolean;
  width: number;
  borderRadius: number;
  overlayOpacity: number;
  animation: string;
  desktopOnly: boolean;
  sort?: number;
  createdAt?: string;
};

const PLACEMENTS = ["site-wide", "homepage", "shop", "product", "blog"];
const TRIGGERS = ["load", "delay", "exit", "click"];
const ANIMATIONS = ["fade", "slide-up", "slide-right"];

const defaultPopup: Partial<Popup> = {
  title: "",
  heading: "",
  text: "",
  imageUrl: "",
  buttonText: "",
  buttonUrl: "",
  placement: "site-wide",
  trigger: "delay",
  delay: 3,
  enabled: true,
  visible: true,
  width: 480,
  borderRadius: 12,
  overlayOpacity: 0.5,
  animation: "fade",
  desktopOnly: false,
};

export default function PopupManagementPanel() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Popup | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/popups?admin=true");
      const data = await res.json();
      setPopups(data.popups || []);
    } catch {
      setMessage("Failed to load popups.");
      setIsError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (popup: Partial<Popup>) => {
    try {
      const method = popup.id ? "PATCH" : "POST";
      const body = popup.id ? popup : { ...popup };
      const res = await fetch("/api/popups", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      setMessage(popup.id ? "Popup updated." : "Popup created.");
      setIsError(false);
      setShowForm(false);
      setEditing(null);
      load();
    } catch {
      setMessage("Failed to save popup.");
      setIsError(true);
    }
  };

  const toggleEnabled = async (popup: Popup) => {
    await save({ ...popup, enabled: !popup.enabled, visible: !popup.enabled });
  };

  const deletePopup = async (id: string) => {
    try {
      await fetch("/api/popups", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setMessage("Popup deleted.");
      setIsError(false);
      setDeletingId(null);
      load();
    } catch {
      setMessage("Failed to delete popup.");
      setIsError(true);
    }
  };

  const moveUp = async (idx: number) => {
    if (idx === 0) return;
    const a = popups[idx - 1], b = popups[idx];
    await save({ id: a.id, sort: (b.sort || 0) });
    await save({ id: b.id, sort: (a.sort || 0) });
    load();
  };

  const moveDown = async (idx: number) => {
    if (idx >= popups.length - 1) return;
    const a = popups[idx], b = popups[idx + 1];
    await save({ id: a.id, sort: (b.sort || 0) });
    await save({ id: b.id, sort: (a.sort || 0) });
    load();
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>📣 Site Popups</h2>
        <button
          onClick={() => { setEditing({ ...defaultPopup } as Popup); setShowForm(true); }}
          style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          + New Popup
        </button>
      </div>

      {message && (
        <div style={{ padding: "8px 14px", borderRadius: 4, marginBottom: 12, fontSize: 12, background: isError ? "#fce4ec" : "#e8f5e9", color: isError ? "#c62828" : "#2e7d32" }}>
          {message}
          <button onClick={() => setMessage("")} style={{ marginLeft: 8, background: "none", border: "none", cursor: "pointer", fontSize: 14 }}>×</button>
        </div>
      )}

      {showForm && editing && (
        <PopupForm popup={editing} onSave={save} onCancel={() => { setShowForm(false); setEditing(null); }} />
      )}

      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: 13 }}>Loading popups…</p>
      ) : popups.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, background: "#faf9f7", borderRadius: 8, border: "1px solid var(--line)" }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No popups yet</p>
          <p style={{ fontSize: 12, color: "var(--muted)" }}>Create your first popup to engage visitors with promotions, announcements, or important notices.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {popups.map((p, idx) => (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, padding: "14px 16px", background: "#fff", border: "1px solid var(--line)", borderRadius: 6, alignItems: "center" }}>
              <div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <strong style={{ fontSize: 13 }}>{p.title || p.heading || "Untitled"}</strong>
                  <span style={{ padding: "2px 8px", borderRadius: 3, fontSize: 9, fontWeight: 700, textTransform: "uppercase", background: p.enabled ? "#e8f5e9" : "#f5f5f5", color: p.enabled ? "#2e7d32" : "#999" }}>
                    {p.enabled ? "Active" : "Inactive"}
                  </span>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>{p.placement}</span>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>· {p.trigger}{p.trigger === "delay" ? ` ${p.delay}s` : ""}</span>
                </div>
                {p.heading && <p style={{ margin: "2px 0", fontSize: 12, color: "var(--muted)" }}>{p.heading}</p>}
                {p.text && <p style={{ margin: "2px 0", fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 500 }}>{p.text}</p>}
              </div>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{ padding: "4px 8px", border: "1px solid var(--line)", background: "#fff", cursor: idx === 0 ? "not-allowed" : "pointer", fontSize: 11, borderRadius: 3, opacity: idx === 0 ? 0.4 : 1 }}>↑</button>
                <button onClick={() => moveDown(idx)} disabled={idx === popups.length - 1} style={{ padding: "4px 8px", border: "1px solid var(--line)", background: "#fff", cursor: idx === popups.length - 1 ? "not-allowed" : "pointer", fontSize: 11, borderRadius: 3, opacity: idx === popups.length - 1 ? 0.4 : 1 }}>↓</button>
                <button onClick={() => toggleEnabled(p)} style={{ padding: "4px 10px", border: "1px solid var(--line)", background: p.enabled ? "#fff5f5" : "#f0fff0", cursor: "pointer", fontSize: 10, fontWeight: 600, borderRadius: 3, color: p.enabled ? "#c62828" : "#2e7d32" }}>{p.enabled ? "Disable" : "Enable"}</button>
                <button onClick={() => { setEditing(p); setShowForm(true); }} style={{ padding: "4px 10px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 10, borderRadius: 3 }}>Edit</button>
                {deletingId === p.id ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => deletePopup(p.id)} style={{ padding: "4px 8px", background: "#c62828", color: "#fff", border: "none", cursor: "pointer", fontSize: 10, borderRadius: 3 }}>Yes</button>
                    <button onClick={() => setDeletingId(null)} style={{ padding: "4px 8px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 10, borderRadius: 3 }}>No</button>
                  </div>
                ) : (
                  <button onClick={() => setDeletingId(p.id)} style={{ padding: "4px 10px", border: "1px solid #ffcdd2", background: "#fff", cursor: "pointer", fontSize: 10, borderRadius: 3, color: "#c62828" }}>Del</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   POPUP FORM — Create/Edit popup
   ═══════════════════════════════════════════════════════════════ */

function PopupForm({ popup, onSave, onCancel }: { popup: Popup; onSave: (p: Partial<Popup>) => void; onCancel: () => void }) {
  const [form, setForm] = useState({ ...popup });
  const label: React.CSSProperties = { fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)" };
  const input: React.CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, boxSizing: "border-box" };
  const select: React.CSSProperties = { ...input, background: "#fff" };

  return (
    <div style={{ padding: 20, background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 8, marginBottom: 16 }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 16px" }}>{popup.id ? "Edit Popup" : "New Popup"}</h3>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div><label style={label}>Title</label><input style={input} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Internal name" /></div>
        <div><label style={label}>Heading</label><input style={input} value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} placeholder="Popup heading shown to users" /></div>
      </div>
      <div style={{ marginTop: 12 }}><label style={label}>Text</label><textarea style={{ ...input, minHeight: 80 }} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Popup body text" /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div><label style={label}>Image URL</label><input style={input} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/images/popup.jpg or https://…" /></div>
        <div><label style={label}>Button Text</label><input style={input} value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} placeholder="Shop Now" /></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div><label style={label}>Button URL</label><input style={input} value={form.buttonUrl} onChange={(e) => setForm({ ...form, buttonUrl: e.target.value })} placeholder="/shop" /></div>
        <div><label style={label}>Placement</label><select style={select} value={form.placement} onChange={(e) => setForm({ ...form, placement: e.target.value })}>{PLACEMENTS.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
        <div><label style={label}>Trigger</label><select style={select} value={form.trigger} onChange={(e) => setForm({ ...form, trigger: e.target.value })}>{TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
        {form.trigger === "delay" && <div><label style={label}>Delay (seconds)</label><input type="number" min="1" max="30" style={input} value={form.delay} onChange={(e) => setForm({ ...form, delay: parseInt(e.target.value) || 3 })} /></div>}
        <div><label style={label}>Animation</label><select style={select} value={form.animation} onChange={(e) => setForm({ ...form, animation: e.target.value })}>{ANIMATIONS.map((a) => <option key={a} value={a}>{a}</option>)}</select></div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginTop: 12 }}>
        <div><label style={label}>Width (px)</label><input type="number" min="300" max="800" style={input} value={form.width} onChange={(e) => setForm({ ...form, width: parseInt(e.target.value) || 480 })} /></div>
        <div><label style={label}>Border Radius</label><input type="number" min="0" max="30" style={input} value={form.borderRadius} onChange={(e) => setForm({ ...form, borderRadius: parseInt(e.target.value) || 12 })} /></div>
        <div><label style={label}>Overlay Opacity</label><input type="number" step="0.1" min="0" max="1" style={input} value={form.overlayOpacity} onChange={(e) => setForm({ ...form, overlayOpacity: parseFloat(e.target.value) || 0.5 })} /></div>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={form.desktopOnly} onChange={(e) => setForm({ ...form, desktopOnly: e.target.checked })} />
            Desktop only
          </label>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
        <button onClick={onCancel} style={{ padding: "8px 16px", border: "1px solid var(--line)", background: "#fff", borderRadius: 4, fontSize: 12, cursor: "pointer" }}>Cancel</button>
        <button onClick={() => onSave(form)} style={{ padding: "8px 20px", background: "var(--purple)", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{popup.id ? "Save Changes" : "Create Popup"}</button>
      </div>
    </div>
  );
}
