"use client";

import React, { useState, useEffect } from "react";
import GlobalMediaUploader from "../components/GlobalMediaUploader";

export default function LogoManager({ onSave }: { onSave?: () => void }) {
  const [logoUrl, setLogoUrl] = useState("");
  const [desktopHeight, setDesktopHeight] = useState("36");
  const [mobileHeight, setMobileHeight] = useState("28");
  const [maxWidth, setMaxWidth] = useState("180");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  const [previewLoaded, setPreviewLoaded] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [testingUrl, setTestingUrl] = useState(false);
  const [urlVerified, setUrlVerified] = useState<boolean | null>(null);

  // Load existing settings
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        const settings = d.settings || [];
        const logo = settings.find((s: Record<string, unknown>) => s.key === "logo_url");
        if (logo?.value) {
          setLogoUrl(String(logo.value));
          setPreviewFailed(false);
        }

        const dh = settings.find((s: Record<string, unknown>) => s.key === "logo_height_desktop");
        if (dh?.value) setDesktopHeight(String(dh.value));

        const mh = settings.find((s: Record<string, unknown>) => s.key === "logo_height_mobile");
        if (mh?.value) setMobileHeight(String(mh.value));

        const mw = settings.find((s: Record<string, unknown>) => s.key === "logo_max_width");
        if (mw?.value) setMaxWidth(String(mw.value));
      })
      .catch(() => {});
  }, []);

  // Verify URL accessibility when logoUrl changes
  useEffect(() => {
    if (!logoUrl) {
      setUrlVerified(null);
      setPreviewFailed(false);
      setPreviewLoaded(false);
      return;
    }

    setPreviewFailed(false);
    setPreviewLoaded(false);
    setTestingUrl(true);

    fetch(logoUrl, { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          setUrlVerified(true);
        } else {
          setUrlVerified(false);
        }
      })
      .catch(() => {
        setUrlVerified(false);
      })
      .finally(() => {
        setTestingUrl(false);
      });
  }, [logoUrl]);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const itemsToSave = [
        { key: "logo_url", value: logoUrl.trim(), group: "branding" },
        { key: "logo_height_desktop", value: String(desktopHeight || 36), group: "branding" },
        { key: "logo_height_mobile", value: String(mobileHeight || 28), group: "branding" },
        { key: "logo_max_width", value: String(maxWidth || 180), group: "branding" },
      ];

      let anyFailed = false;
      let lastError = "";
      for (const item of itemsToSave) {
        const res = await fetch("/api/admin/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });
        if (!res.ok) {
          anyFailed = true;
          try {
            const d = await res.json();
            lastError = d.error || `Server error ${res.status}`;
          } catch {
            lastError = `Server error ${res.status}`;
          }
        }
      }

      if (anyFailed) {
        setFeedback({
          msg: `Save failed: ${lastError || "Check your admin login session and try again."}`,
          type: "error",
        });
      } else {
        setFeedback({
          msg: "Brand logo & dimensions saved successfully! Changes are active across public header, mobile nav, and footer.",
          type: "success",
        });
        if (onSave) onSave();
      }
    } catch {
      setFeedback({ msg: "Network error while saving logo settings.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm("Are you sure you want to remove the custom logo and revert to the default Queens Care brand icon?")) return;
    setSaving(true);
    setLogoUrl("");
    setUrlVerified(null);
    setPreviewFailed(false);
    setPreviewLoaded(false);

    try {
      await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "logo_url", value: "", group: "branding" }),
      });
      setFeedback({ msg: "Custom logo deleted. Reverted to default Queens Care brand icon.", type: "info" });
      if (onSave) onSave();
    } catch {
      setFeedback({ msg: "Failed to reset logo in database.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24, maxWidth: 840, borderRadius: 6 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Brand Identity
          </span>
          <h3 style={{ font: "22px var(--font-display)", color: "#2A0F3A", margin: "2px 0 0" }}>
            👑 Brand Logo & Identity Controls
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Upload, replace, or customize the official Queens Care logo. Changes synchronize across the Header, Mobile Nav, and Footer.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "9px 14px",
              background: "#fff",
              color: "#2A0F3A",
              border: "1px solid var(--line)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span>Preview Site</span>
            <span>↗</span>
          </a>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 24px",
              background: "#2A0F3A",
              color: "#D4AF37",
              border: "none",
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 13,
              cursor: saving ? "wait" : "pointer",
              boxShadow: "0 2px 8px rgba(42, 15, 58, 0.2)",
            }}
          >
            {saving ? "Saving…" : "💾 Save Logo Settings"}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 20,
            borderRadius: 4,
            background: feedback.type === "success" ? "#e9f7e9" : feedback.type === "info" ? "#e3f2fd" : "#fde8e8",
            border: `1px solid ${feedback.type === "success" ? "#c3e6cb" : feedback.type === "info" ? "#bbdefb" : "#f8b4b4"}`,
            color: feedback.type === "success" ? "#2e7d32" : feedback.type === "info" ? "#1565c0" : "#b34141",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {feedback.type === "success" ? "✓ " : feedback.type === "info" ? "ℹ " : "✕ "}
          {feedback.msg}
        </div>
      )}

      {/* Global Media Uploader for Logo */}
      <div style={{ background: "#faf8f5", padding: 18, border: "1px solid var(--line)", borderRadius: 6, marginBottom: 20 }}>
        <GlobalMediaUploader
          label="Official Logo File (PNG, SVG, WebP, JPG — Transparency Preserved)"
          preset="logo"
          value={logoUrl}
          onChange={(val) => {
            if (typeof val === "string") {
              setLogoUrl(val);
            } else if (Array.isArray(val) && val.length > 0) {
              const first = val[0];
              setLogoUrl(typeof first === "string" ? first : (first?.url || ""));
            } else {
              setLogoUrl("");
            }
            setFeedback(null);
          }}
          folder="logos"
        />

        {/* Live URL & Health Status */}
        {logoUrl && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#fff", border: "1px solid var(--line)", borderRadius: 4, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)" }}>
                Public URL:
              </span>
              <code style={{ fontSize: 12, color: "#2A0F3A", background: "#f5f3ef", padding: "2px 6px", borderRadius: 3 }}>
                {logoUrl}
              </code>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {testingUrl ? (
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Verifying image access…</span>
              ) : urlVerified === true ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#2e7d32", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  ● Image Accessible (HTTP 200)
                </span>
              ) : urlVerified === false ? (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#c62828", display: "inline-flex", alignItems: "center", gap: 4 }}>
                  ⚠ Inaccessible Path (Check server route)
                </span>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Sizing Controls */}
      <div style={{ background: "#faf8f5", padding: 18, border: "1px solid var(--line)", borderRadius: 6, marginBottom: 20 }}>
        <h4 style={{ font: "15px var(--font-display)", color: "#2A0F3A", margin: "0 0 14px" }}>
          📐 Logo Dimensions & Mobile Scaling
        </h4>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4, color: "#2A0F3A" }}>
              Desktop Height (px)
            </label>
            <input
              type="number"
              min={20}
              max={100}
              value={desktopHeight}
              onChange={(e) => setDesktopHeight(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4, background: "#fff" }}
            />
            <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "block" }}>Standard: 36px (20px - 80px)</span>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4, color: "#2A0F3A" }}>
              Mobile Height (px)
            </label>
            <input
              type="number"
              min={16}
              max={80}
              value={mobileHeight}
              onChange={(e) => setMobileHeight(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4, background: "#fff" }}
            />
            <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "block" }}>Standard: 28px (16px - 60px)</span>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4, color: "#2A0F3A" }}>
              Max Width (px)
            </label>
            <input
              type="number"
              min={50}
              max={400}
              value={maxWidth}
              onChange={(e) => setMaxWidth(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 13, borderRadius: 4, background: "#fff" }}
            />
            <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "block" }}>Standard: 180px (Prevents overflow)</span>
          </div>
        </div>
      </div>

      {/* Live Preview Container (Light & Dark) */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ font: "15px var(--font-display)", color: "#2A0F3A", margin: "0 0 12px" }}>
          👁️ Live Storefront Previews
        </h4>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {/* Header Preview (Light Background) */}
          <div style={{ border: "1px solid var(--line)", padding: 16, background: "#faf8f5", borderRadius: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--muted)", display: "block", marginBottom: 10 }}>
              Header Preview (Light Canvas)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(251,250,247,.95)", border: "1px solid var(--line)", borderRadius: 4 }}>
              {logoUrl && !previewFailed ? (
                <img
                  src={logoUrl}
                  alt="Logo Header Preview"
                  style={{
                    height: `${desktopHeight}px`,
                    maxWidth: `${maxWidth}px`,
                    width: "auto",
                    objectFit: "contain",
                    background: "transparent",
                  }}
                  onLoad={() => setPreviewLoaded(true)}
                  onError={() => setPreviewFailed(true)}
                />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#2A0F3A", color: "#D4AF37", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", fontSize: 18 }}>
                  Q
                </div>
              )}
              <span style={{ font: "700 13px/1.05 var(--font-display)", color: "#2A0F3A", letterSpacing: ".08em" }}>
                QUEENS<br /><b>CARE</b>
              </span>
            </div>
          </div>

          {/* Footer Preview (Dark Background) */}
          <div style={{ border: "1px solid #333", padding: 16, background: "#1a161f", color: "#fff", borderRadius: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: "#aaa", display: "block", marginBottom: 10 }}>
              Footer Preview (Dark Theme)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 4 }}>
              {logoUrl && !previewFailed ? (
                <img
                  src={logoUrl}
                  alt="Logo Footer Preview"
                  style={{
                    height: `${desktopHeight}px`,
                    maxWidth: `${maxWidth}px`,
                    width: "auto",
                    objectFit: "contain",
                    background: "transparent",
                  }}
                  onError={() => setPreviewFailed(true)}
                />
              ) : (
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#D4AF37", color: "#2A0F3A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontStyle: "italic", fontFamily: "var(--font-display)", fontSize: 18 }}>
                  Q
                </div>
              )}
              <span style={{ font: "700 13px/1.05 var(--font-display)", color: "#fff", letterSpacing: ".08em" }}>
                QUEENS<br /><b>CARE</b>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--line)", paddingTop: 16 }}>
        <button
          type="button"
          onClick={handleDeleteLogo}
          disabled={saving}
          style={{
            padding: "8px 16px",
            background: "#fff",
            color: "#b34141",
            border: "1px solid #f8b4b4",
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 600,
            cursor: saving ? "wait" : "pointer",
          }}
        >
          🗑️ Delete / Reset Custom Logo
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "10px 28px",
            background: "#2A0F3A",
            color: "#D4AF37",
            border: "none",
            borderRadius: 4,
            fontWeight: 700,
            fontSize: 13,
            cursor: saving ? "wait" : "pointer",
            boxShadow: "0 2px 8px rgba(42, 15, 58, 0.2)",
          }}
        >
          {saving ? "Saving…" : "💾 Save All Logo Settings"}
        </button>
      </div>
    </div>
  );
}
