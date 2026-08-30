"use client";

import { useState, useEffect, useRef } from "react";

const DEFAULT_LOGO = ""; // empty = use fallback "Q" icon

export default function LogoManager({ onSave }: { onSave: () => void }) {
  const [currentLogo, setCurrentLogo] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(d => {
        const logo = d.settings?.find((s: Record<string, unknown>) => s.key === "logo_url");
        if (logo?.value) setCurrentLogo(String(logo.value));
      })
      .catch(() => {});
  }, []);

  const saveLogo = async (value: string) => {
    setSaving(true);
    setIsError(false);
    setMsg("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "logo_url", value, group: "branding" }),
      });
      if (res.ok) {
        setCurrentLogo(value);
        setMsg("Logo saved successfully!");
        setTimeout(() => { onSave(); }, 300);
      } else {
        setIsError(true);
        setMsg("Failed to save logo.");
      }
    } catch {
      setIsError(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append("files", f));
    formData.append("folder", "logos");
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.files?.length) {
        const url = data.files[0].url;
        setNewUrl(url);
        await saveLogo(url);
      } else {
        setIsError(true);
        setMsg("Upload failed: " + (data.error || "Unknown error"));
      }
    } catch {
      setIsError(true);
      setMsg("Upload failed: network error");
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSaveUrl = async () => {
    if (!newUrl.trim()) {
      setIsError(true);
      setMsg("Please enter a logo URL.");
      return;
    }
    await saveLogo(newUrl.trim());
  };

  const handleReset = async () => {
    await saveLogo(DEFAULT_LOGO);
    setNewUrl("");
    setMsg("Logo reset to default. The site will show the fallback brand icon.");
  };

  return (
    <div style={{
      padding: 24, background: "#fff", border: "2px solid var(--line)", marginBottom: 24, maxWidth: 700,
    }}>
      <h3 style={{ font: "18px var(--font-display)", margin: "0 0 4px", color: "var(--purple)" }}>
        🖼️ Logo Management
      </h3>
      <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 20px" }}>
        Upload a new logo or enter a URL. Changes appear on the public website header and footer immediately.
      </p>

      {msg && (
        <p style={{
          padding: "8px 12px", marginBottom: 16, fontSize: 12, fontWeight: 500,
          background: isError ? "#fde8e8" : "#e9f7e9", color: isError ? "#b34141" : "#2e7d32",
          border: `1px solid ${isError ? "#f8b4b4" : "#c3e6cb"}`,
        }}>{msg}</p>
      )}

      {/* Current Logo Preview */}
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em", color: "var(--muted)" }}>
            Current Logo
          </p>
          <div style={{
            width: 80, height: 80, border: "2px solid var(--line)", borderRadius: 8,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: currentLogo ? "#fff" : "#f5f0eb", overflow: "hidden",
          }}>
            {currentLogo ? (
              <img src={currentLogo} alt="Current logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <span style={{ fontSize: 32, fontWeight: 700, color: "var(--purple)" }}>Q</span>
            )}
          </div>
          <p style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, maxWidth: 80, wordBreak: "break-all" }}>
            {currentLogo || "(default fallback)"}
          </p>
        </div>

        <div style={{ flex: 1 }}>
          {/* Upload Section */}
          <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em", color: "var(--muted)" }}>
            Upload New Logo
          </p>
          <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 6, lineHeight: 1.4 }}>
            📐 Recommended: <strong>400 × 120 px</strong> · Transparent PNG/WebP preferred · Keep original ratio
          </p>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <label style={{
              padding: "10px 20px", background: "var(--gold, #b8860b)", color: "#fff", border: "none",
              cursor: "pointer", fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              📤 {uploading ? "Uploading…" : "Choose File"}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                hidden
                onChange={e => handleUpload(e.target.files)}
              />
            </label>
            <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center" }}>PNG, JPG, WebP, SVG</span>
          </div>

          {/* URL Input */}
          <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: ".06em", color: "var(--muted)" }}>
            Or Enter Logo URL
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="https://example.com/logo.png or /uploads/logos/my-logo.png"
              style={{
                flex: 1, padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13,
              }}
            />
            <button
              onClick={handleSaveUrl}
              disabled={saving || !newUrl.trim()}
              style={{
                padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none",
                cursor: saving ? "wait" : "pointer", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
              }}
            >
              {saving ? "Saving…" : "💾 Save URL"}
            </button>
          </div>
        </div>
      </div>

      {/* Preview of new URL */}
      {newUrl && (
        <div style={{ marginBottom: 16, padding: "10px 14px", background: "#f5f0eb", border: "1px solid var(--line)" }}>
          <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>New Logo Preview</p>
          <div style={{ width: 80, height: 80, border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
            <img src={newUrl} alt="New logo preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
        <button
          onClick={handleReset}
          disabled={saving}
          style={{
            padding: "10px 20px", background: "#fff", color: "#b34141", border: "1px solid #e2c3c3",
            cursor: saving ? "wait" : "pointer", fontSize: 12, fontWeight: 600,
          }}
        >
          🔄 Reset to Default
        </button>
        <p style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center", margin: 0 }}>
          Reset removes the custom logo and restores the fallback "Q" brand icon.
        </p>
      </div>
    </div>
  );
}
