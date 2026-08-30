"use client";

import React, { useState, useEffect } from "react";
import GlobalMediaUploader from "../components/GlobalMediaUploader";

export default function LogoManager({ onSave }: { onSave?: () => void }) {
  const [logoUrl, setLogoUrl] = useState("");
  const [desktopHeight, setDesktopHeight] = useState("36");
  const [mobileHeight, setMobileHeight] = useState("28");
  const [maxWidth, setMaxWidth] = useState("180");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const settings = d.settings || [];
        const logo = settings.find((s: Record<string, unknown>) => s.key === "logo_url");
        if (logo?.value) setLogoUrl(String(logo.value));

        const dh = settings.find((s: Record<string, unknown>) => s.key === "logo_height_desktop");
        if (dh?.value) setDesktopHeight(String(dh.value));

        const mh = settings.find((s: Record<string, unknown>) => s.key === "logo_height_mobile");
        if (mh?.value) setMobileHeight(String(mh.value));

        const mw = settings.find((s: Record<string, unknown>) => s.key === "logo_max_width");
        if (mw?.value) setMaxWidth(String(mw.value));
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const itemsToSave = [
        { key: "logo_url", value: logoUrl, group: "branding" },
        { key: "logo_height_desktop", value: desktopHeight, group: "branding" },
        { key: "logo_height_mobile", value: mobileHeight, group: "branding" },
        { key: "logo_max_width", value: maxWidth, group: "branding" },
      ];

      for (const item of itemsToSave) {
        await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
      }

      setFeedback({ msg: "Brand logo & dimensions saved successfully! Changes are active across public header and footer.", type: "success" });
      if (onSave) onSave();
    } catch {
      setFeedback({ msg: "Network error while saving logo settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset logo to default brand icon?")) return;
    setLogoUrl("");
    setDesktopHeight("36");
    setMobileHeight("28");
    setMaxWidth("180");
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "logo_url", value: "", group: "branding" }),
    });
    setFeedback({ msg: "Logo reset to default fallback icon.", type: "success" });
    if (onSave) onSave();
  };

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24, maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h3 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: 0 }}>
            👑 Brand Logo & Identity Controls
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Upload or replace the Queens Care brand logo. Adjust desktop and mobile sizes for perfect visual balance across the entire website.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{ padding: "10px 24px", background: "var(--gold)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer" }}
        >
          {saving ? "Saving…" : "Save Logo Settings →"}
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 20,
            background: feedback.type === "success" ? "#e9f7e9" : "#fde8e8",
            border: `1px solid ${feedback.type === "success" ? "#c3e6cb" : "#f8b4b4"}`,
            color: feedback.type === "success" ? "#2e7d32" : "#b34141",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          {feedback.type === "success" ? "✓ " : "✕ "}
          {feedback.msg}
        </div>
      )}

      {/* Global Media Uploader for Logo */}
      <GlobalMediaUploader
        label="Brand Logo File / URL (PNG, SVG, WebP with Transparent Background)"
        preset="logo"
        value={logoUrl}
        onChange={(val) => setLogoUrl(typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0]?.url) : "")}
        folder="logos"
      />

      {/* Logo Sizing Controls */}
      <div style={{ marginTop: 20, borderTop: "1px solid var(--line)", paddingTop: 20 }}>
        <h4 style={{ font: "15px var(--font-display)", color: "var(--purple)", margin: "0 0 14px" }}>
          📐 Logo Display Size & Dimensions
        </h4>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              Desktop Height (px)
            </label>
            <input
              type="number"
              min={20}
              max={100}
              value={desktopHeight}
              onChange={(e) => setDesktopHeight(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "block" }}>Default: 36px</span>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              Mobile Height (px)
            </label>
            <input
              type="number"
              min={16}
              max={80}
              value={mobileHeight}
              onChange={(e) => setMobileHeight(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "block" }}>Default: 28px</span>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              Max Width (px)
            </label>
            <input
              type="number"
              min={50}
              max={400}
              value={maxWidth}
              onChange={(e) => setMaxWidth(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "block" }}>Default: 180px</span>
          </div>
        </div>

        {/* Live Preview Container */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          {/* Light Nav Preview */}
          <div style={{ border: "1px solid var(--line)", padding: 16, background: "#faf8f5" }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", display: "block", marginBottom: 10 }}>
              Header Preview (Light Background)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fff", border: "1px solid var(--line)" }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo Preview"
                  style={{ height: `${desktopHeight}px`, maxWidth: `${maxWidth}px`, objectFit: "contain" }}
                />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--purple)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  Q
                </div>
              )}
              <span style={{ font: "700 13px/1 var(--font-display)", color: "var(--purple)", letterSpacing: ".08em" }}>
                QUEENS CARE
              </span>
            </div>
          </div>

          {/* Dark Footer Preview */}
          <div style={{ border: "1px solid #333", padding: 16, background: "#1a161f", color: "#fff" }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#aaa", display: "block", marginBottom: 10 }}>
              Footer Preview (Dark Background)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo Preview Dark"
                  style={{ height: `${desktopHeight}px`, maxWidth: `${maxWidth}px`, objectFit: "contain" }}
                />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--gold)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                  Q
                </div>
              )}
              <span style={{ font: "700 13px/1 var(--font-display)", color: "#fff", letterSpacing: ".08em" }}>
                QUEENS CARE
              </span>
            </div>
          </div>
        </div>

        {/* Reset */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={handleReset}
            style={{ padding: "6px 14px", background: "#fff", color: "#b34141", border: "1px solid #f8b4b4", fontSize: 12, cursor: "pointer" }}
          >
            🔄 Reset to Default Brand Icon
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "8px 22px", background: "var(--purple)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer" }}
          >
            {saving ? "Saving…" : "Save All Changes →"}
          </button>
        </div>
      </div>
    </div>
  );
}
