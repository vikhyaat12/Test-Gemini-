"use client";

import React, { useState, useEffect } from "react";

export default function FooterSettingsModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: () => void;
}) {
  const [form, setForm] = useState({
    footer_tagline: "Care is a practice.\nMake it yours.",
    footer_newsletter_title: "A considered note, once in a while.",
    footer_copyright: "© 2026 Queens Care Laboratories. All rights reserved.",
    footer_bg: "",
    footer_text_color: "",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const obj: Record<string, string> = {};
        (d.settings || []).forEach((s: { key: string; value: string }) => {
          if (s.key in form) obj[s.key] = s.value;
        });
        setForm((prev) => ({ ...prev, ...obj }));
      });
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      for (const [key, value] of Object.entries(form)) {
        await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, value, group: "footer" }),
        });
      }
      setMsg("Footer settings saved successfully!");
      onSave();
    } catch {
      setMsg("Failed to save footer settings.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid var(--line, #ddd)",
    borderRadius: 4,
    fontSize: 13,
    background: "#fff",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "var(--purple, #2A0F3A)",
    marginBottom: 4,
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 26,
          borderRadius: 8,
          width: "100%",
          maxWidth: 540,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, font: "20px var(--font-display)", color: "var(--purple, #2A0F3A)" }}>
              Footer Content & Styling CMS
            </h3>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Customize public footer copy and branding colors</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 18,
              cursor: "pointer",
              color: "var(--muted)",
            }}
          >
            ✕
          </button>
        </div>

        {msg && (
          <p
            style={{
              padding: "8px 12px",
              background: "#e8f5e9",
              color: "#2e7d32",
              fontSize: 12,
              borderRadius: 4,
              marginBottom: 14,
            }}
          >
            {msg}
          </p>
        )}

        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={labelStyle}>Footer Tagline (Multi-line supported)</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60 }}
              value={form.footer_tagline}
              onChange={(e) => setForm({ ...form, footer_tagline: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Newsletter Title / Prompt</label>
            <input
              style={inputStyle}
              value={form.footer_newsletter_title}
              onChange={(e) => setForm({ ...form, footer_newsletter_title: e.target.value })}
            />
          </div>
          <div>
            <label style={labelStyle}>Copyright Line</label>
            <input
              style={inputStyle}
              value={form.footer_copyright}
              onChange={(e) => setForm({ ...form, footer_copyright: e.target.value })}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>Custom Background Color</label>
              <input
                style={inputStyle}
                value={form.footer_bg}
                onChange={(e) => setForm({ ...form, footer_bg: e.target.value })}
                placeholder="e.g. #2A0F3A, #180524"
              />
            </div>
            <div>
              <label style={labelStyle}>Custom Text Color</label>
              <input
                style={inputStyle}
                value={form.footer_text_color}
                onChange={(e) => setForm({ ...form, footer_text_color: e.target.value })}
                placeholder="e.g. #FFFFFF, #FAF8F5"
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22 }}>
          <button
            onClick={onClose}
            style={{
              padding: "8px 16px",
              border: "1px solid var(--line)",
              background: "#fff",
              cursor: "pointer",
              borderRadius: 4,
            }}
          >
            Close
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              padding: "8px 20px",
              background: "var(--purple, #2A0F3A)",
              color: "#D4AF37",
              border: "none",
              cursor: saving ? "default" : "pointer",
              borderRadius: 4,
              fontWeight: 700,
            }}
          >
            {saving ? "Saving…" : "💾 Save Footer"}
          </button>
        </div>
      </div>
    </div>
  );
}
