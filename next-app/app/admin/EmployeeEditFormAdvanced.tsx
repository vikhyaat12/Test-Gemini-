"use client";

import React, { useState, useEffect } from "react";
import GlobalMediaUploader, { MediaItem } from "../components/GlobalMediaUploader";

export type PhotoSettings = {
  desktopSize: number;
  mobileSize: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
  objectFit: "cover" | "contain";
  shadow: boolean;
  zoom: number;
  positionX: number;
  positionY: number;
  rotation: number;
};

export type EmployeeFormProps = {
  item: Record<string, unknown>;
  onSave: () => void;
  onCancel?: () => void;
  inputStyle?: React.CSSProperties;
  labelStyle?: React.CSSProperties;
};

export default function EmployeeEditFormAdvanced({
  item,
  onSave,
  onCancel,
  inputStyle: customInputStyle,
  labelStyle: customLabelStyle,
}: EmployeeFormProps) {
  const [form, setForm] = useState<Record<string, unknown>>({
    name: "",
    employeeId: "",
    designation: "",
    department: "",
    email: "",
    phone: "",
    bio: "",
    slug: "",
    active: true,
    photo: "",
    profileImage: "",
    gallery: [],
    videos: [],
    photoSettings: {
      desktopSize: 180,
      mobileSize: 130,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true,
    },
    verified: true,
    themeColors: {
      primary: "",
      gold: "",
      background: "",
      cardBg: "",
      text: "",
      badgeBg: "",
      buttonBg: "",
      gradient: "",
    },
    ...item,
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "photo" | "gallery" | "videos" | "theme">("general");

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      ...item,
      photo: item.photo || item.profileImage || "",
      profileImage: item.photo || item.profileImage || "",
      gallery: Array.isArray(item.gallery) ? item.gallery : [],
      videos: Array.isArray(item.videos) ? item.videos : [],
      photoSettings: {
        desktopSize: 180,
        mobileSize: 130,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true,
      zoom: 1,
      positionX: 50,
      positionY: 50,
      rotation: 0,
      ...((item.photoSettings as Partial<PhotoSettings>) || {}),
      },
      verified: item.verified !== undefined ? item.verified : true,
      themeColors: {
        primary: "",
        gold: "",
        background: "",
        cardBg: "",
        text: "",
        badgeBg: "",
        buttonBg: "",
        gradient: "",
        ...((item.themeColors as Record<string, string>) || {}),
      },
    }));
  }, [item]);

  const photoSettings = (form.photoSettings as PhotoSettings) || {
    desktopSize: 180,
    mobileSize: 130,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#D4AF37",
    objectFit: "cover",
    shadow: true,
  };

  const updatePhotoSettings = (updates: Partial<PhotoSettings>) => {
    setForm((prev) => ({
      ...prev,
      photoSettings: {
        ...(prev.photoSettings as PhotoSettings),
        ...updates,
      },
    }));
  };

  const save = async () => {
    if (!form.name || !String(form.name).trim()) {
      setIsError(true);
      setMsg("Full name is required.");
      return;
    }

    setSaving(true);
    setIsError(false);
    setMsg("");

    const isNew = Boolean(form.isNew);
    const method = isNew ? "POST" : "PATCH";
    const payload = {
      ...form,
      photo: form.photo || form.profileImage || null,
      profileImage: form.photo || form.profileImage || null,
      id: form.id,
    };

    try {
      const res = await fetch("/api/admin/employees", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setIsError(false);
        setMsg("Employee saved successfully!");
        setTimeout(() => {
          onSave();
        }, 500);
      } else {
        setIsError(true);
        setMsg(data.error || "Failed to save employee profile.");
      }
    } catch {
      setIsError(true);
      setMsg("Network connection error.");
    }
    setSaving(false);
  };

  const defaultInputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    background: "#ffffff",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    fontSize: 13,
    color: "#1f2937",
    outline: "none",
    ...customInputStyle,
  };

  const defaultLabelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    color: "#4b5563",
    marginBottom: 6,
    ...customLabelStyle,
  };

  // Gallery Helpers
  const gallery = (Array.isArray(form.gallery) ? form.gallery : []) as Array<string | { url: string; caption?: string }>;
  const addGalleryImage = (url: string) => {
    if (!url) return;
    setForm((prev) => ({
      ...prev,
      gallery: [...(Array.isArray(prev.gallery) ? prev.gallery : []), { url, caption: "" }],
    }));
  };

  const removeGalleryImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      gallery: (Array.isArray(prev.gallery) ? prev.gallery : []).filter((_, i) => i !== index),
    }));
  };

  const moveGalleryImage = (index: number, direction: "up" | "down") => {
    const list = [...(Array.isArray(form.gallery) ? form.gallery : [])];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    setForm((prev) => ({ ...prev, gallery: list }));
  };

  // Video Helpers
  const videos = (Array.isArray(form.videos) ? form.videos : []) as Array<{ id: string; url: string; title?: string; posterUrl?: string }>;
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newVideoTitle, setNewVideoTitle] = useState("");
  const [newVideoPoster, setNewVideoPoster] = useState("");

  const addVideo = () => {
    if (!newVideoUrl.trim()) return;
    const newEntry = {
      id: `vid-${Date.now().toString(36)}`,
      url: newVideoUrl.trim(),
      title: newVideoTitle.trim() || "Professional Profile Feature",
      posterUrl: newVideoPoster.trim() || undefined,
    };
    setForm((prev) => ({
      ...prev,
      videos: [...(Array.isArray(prev.videos) ? prev.videos : []), newEntry],
    }));
    setNewVideoUrl("");
    setNewVideoTitle("");
    setNewVideoPoster("");
  };

  const removeVideo = (id: string) => {
    setForm((prev) => ({
      ...prev,
      videos: (Array.isArray(prev.videos) ? prev.videos : []).filter((v) => v.id !== id),
    }));
  };

  const publicUrl = form.slug ? `/employee/${String(form.slug)}` : "";

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", background: "#ffffff", padding: 24, borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
      {/* Top Banner Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#C19A6B", textTransform: "uppercase", letterSpacing: "0.1em" }}>Queens Care Laboratories</div>
          <h2 style={{ font: "22px var(--font-display)", color: "#2A0F3A", margin: "4px 0 0 0" }}>{form.isNew ? "Create New Employee Profile" : `Edit Profile: ${String(form.name || "Employee")}`}</h2>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {publicUrl && !form.isNew && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                background: "#f3f4f6",
                color: "#2A0F3A",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <span>↗</span> Preview Public Profile
            </a>
          )}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: "8px 14px",
                background: "#ffffff",
                color: "#6b7280",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            style={{
              padding: "8px 20px",
              background: "linear-gradient(135deg, #2A0F3A 0%, #4A1A66 100%)",
              color: "#ffffff",
              border: "1px solid #2A0F3A",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 4px 12px rgba(42,15,58,0.2)",
            }}
          >
            {saving ? "Saving Changes…" : "Save Employee →"}
          </button>
        </div>
      </div>

      {msg && (
        <div
          style={{
            padding: "10px 16px",
            background: isError ? "#fde8e8" : "#ecfdf5",
            color: isError ? "#b91c1c" : "#047857",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            marginBottom: 20,
            border: isError ? "1px solid #fca5a5" : "1px solid #a7f3d0",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span>{isError ? "✕" : "✓"}</span>
          <span>{msg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid #e5e7eb", marginBottom: 24 }}>
        {[
          { id: "general", label: "1. Identity & Info", icon: "👤" },
          { id: "photo", label: "2. Photo & Size Controls", icon: "🖼️" },
          { id: "gallery", label: `3. Gallery (${gallery.length})`, icon: "📸" },
          { id: "videos", label: `4. Videos (${videos.length})`, icon: "🎬" },
          { id: "theme", label: "5. Theme & Branding", icon: "🎨" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              padding: "10px 16px",
              border: "none",
              borderBottom: activeTab === tab.id ? "3px solid #2A0F3A" : "3px solid transparent",
              background: activeTab === tab.id ? "#f9fafb" : "transparent",
              color: activeTab === tab.id ? "#2A0F3A" : "#6b7280",
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              borderRadius: "6px 6px 0 0",
              transition: "all 0.15s ease",
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: GENERAL INFORMATION */}
      {activeTab === "general" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={defaultLabelStyle}>Full Name *</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. Dr. Vikram Singhania"
                value={String(form.name || "")}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label style={defaultLabelStyle}>Employee ID</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. QC-EMP-1048"
                value={String(form.employeeId || "")}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={defaultLabelStyle}>Designation / Role</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. Principal Formulations Lead"
                value={String(form.designation || "")}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
              />
            </div>
            <div>
              <label style={defaultLabelStyle}>Department</label>
              <input
                style={defaultInputStyle}
                placeholder="e.g. Clinical Research & Formulation"
                value={String(form.department || "")}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={defaultLabelStyle}>Email Address</label>
              <input
                type="email"
                style={defaultInputStyle}
                placeholder="e.g. vikram.s@queenscare.in"
                value={String(form.email || "")}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label style={defaultLabelStyle}>Direct Phone Number</label>
              <input
                type="tel"
                style={defaultInputStyle}
                placeholder="e.g. +91 98200 12345"
                value={String(form.phone || "")}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={defaultLabelStyle}>URL Slug</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>/employee/</span>
              <input
                style={{ ...defaultInputStyle, flex: 1 }}
                placeholder="dr-vikram-singhania"
                value={String(form.slug || "")}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "") })}
              />
            </div>
          </div>

          <div>
            <label style={defaultLabelStyle}>Professional Bio & Background</label>
            <textarea
              style={{ ...defaultInputStyle, minHeight: 110, lineHeight: 1.6 }}
              placeholder="Detail the employee's clinical certifications, research publications, education, and pharmaceutical expertise..."
              value={String(form.bio || "")}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          {/* Social Media & Professional Links */}
          <div style={{ padding: 18, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              🔗 Social Media & Professional Links
            </div>
            {([
              { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
              { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/..." },
              { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/..." },
              { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@..." },
              { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/..." },
              { key: "website", label: "Personal Website", placeholder: "https://example.com" },
            ] as const).map((s) => {
              const social = ((form.socialLinks as Record<string, { url: string; enabled: boolean }>) || {})[s.key] || { url: "", enabled: false };
              return (
                <div key={s.key} style={{ marginBottom: 10, display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
                  <input
                    style={{ ...defaultInputStyle, fontSize: 12 }}
                    placeholder={s.placeholder}
                    value={social.url}
                    onChange={(e) => {
                      const sl = { ...((form.socialLinks as Record<string, { url: string; enabled: boolean }>) || {}), [s.key]: { ...social, url: e.target.value } };
                      setForm({ ...form, socialLinks: sl });
                    }}
                  />
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6b7280", cursor: "pointer", whiteSpace: "nowrap" }}>
                    <input
                      type="checkbox"
                      checked={social.enabled}
                      onChange={(e) => {
                        const sl = { ...((form.socialLinks as Record<string, { url: string; enabled: boolean }>) || {}), [s.key]: { ...social, enabled: e.target.checked } };
                        setForm({ ...form, socialLinks: sl });
                      }}
                      style={{ accentColor: "#2A0F3A" }}
                    />
                    Show
                  </label>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#4b5563", minWidth: 80 }}>{s.label}</span>
                </div>
              );
            })}
          </div>

          <div style={{ padding: 14, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1f2937" }}>
              <input
                type="checkbox"
                checked={form.active !== false}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: "#2A0F3A" }}
              />
              <span>Active Employee (Profile is publicly accessible)</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#1f2937" }}>
              <input
                type="checkbox"
                checked={form.verified !== false}
                onChange={(e) => setForm({ ...form, verified: e.target.checked })}
                style={{ width: 18, height: 18, accentColor: "#2A0F3A" }}
              />
              <span>Queens Care Verified Employee (Blue verification badge)</span>
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: PROFILE PHOTO & SIZE CONTROLS */}
      {activeTab === "photo" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          <div>
            <div style={{ marginBottom: 20 }}>
              <GlobalMediaUploader
                label="Profile Photo (Upload from Computer, URL, or Media Library)"
                value={String(form.photo || form.profileImage || "")}
                onChange={(val) => {
                  const url = typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0].url) : "";
                  setForm((prev) => ({ ...prev, photo: url, profileImage: url }));
                }}
                folder="employees"
                preset="employee_photo"
                compact={false}
              />
            </div>

            <div style={{ padding: 18, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🎨 Profile Photo Presentation Controls
              </div>

              {/* Desktop Photo Size */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  <span>Desktop Photo Size</span>
                  <span style={{ color: "#C19A6B", fontWeight: 700 }}>{photoSettings.desktopSize} px</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="300"
                  step="5"
                  value={photoSettings.desktopSize}
                  onChange={(e) => updatePhotoSettings({ desktopSize: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "#2A0F3A" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}>
                  <span>Compact (100px)</span>
                  <span>Standard (180px)</span>
                  <span>Prominent (300px)</span>
                </div>
              </div>

              {/* Mobile Photo Size */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  <span>Mobile Photo Size</span>
                  <span style={{ color: "#C19A6B", fontWeight: 700 }}>{photoSettings.mobileSize} px</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="200"
                  step="5"
                  value={photoSettings.mobileSize}
                  onChange={(e) => updatePhotoSettings({ mobileSize: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "#2A0F3A" }}
                />
              </div>

              {/* Border Radius */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                  <span>Corner Radius / Shape</span>
                  <span style={{ color: "#C19A6B", fontWeight: 700 }}>{photoSettings.borderRadius}% {photoSettings.borderRadius === 50 ? "(Circular)" : photoSettings.borderRadius === 0 ? "(Square)" : "(Rounded Square)"}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="2"
                  value={photoSettings.borderRadius}
                  onChange={(e) => updatePhotoSettings({ borderRadius: Number(e.target.value) })}
                  style={{ width: "100%", accentColor: "#2A0F3A" }}
                />
              </div>

              {/* Border Width & Color */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Border Thickness</label>
                  <select
                    value={photoSettings.borderWidth}
                    onChange={(e) => updatePhotoSettings({ borderWidth: Number(e.target.value) })}
                    style={defaultInputStyle}
                  >
                    <option value="0">None (0px)</option>
                    <option value="1">Thin (1px)</option>
                    <option value="2">Subtle (2px)</option>
                    <option value="3">Gold Ring (3px)</option>
                    <option value="4">Bold (4px)</option>
                    <option value="6">Luxury Heavy (6px)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Border Color</label>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <input
                      type="color"
                      value={photoSettings.borderColor || "#D4AF37"}
                      onChange={(e) => updatePhotoSettings({ borderColor: e.target.value })}
                      style={{ width: 36, height: 36, border: "none", cursor: "pointer", borderRadius: 4 }}
                    />
                    <span style={{ fontSize: 11, fontFamily: "monospace", color: "#4b5563" }}>{photoSettings.borderColor || "#D4AF37"}</span>
                  </div>
                </div>
              </div>

              {/* Photo Adjustment Controls */}
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: 14, marginTop: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#2A0F3A", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  🔧 Photo Adjustment
                </div>

                {/* Zoom */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>Zoom</span>
                    <span style={{ color: "#C19A6B", fontWeight: 700 }}>{((photoSettings.zoom || 1) * 100).toFixed(0)}%</span>
                  </div>
                  <input type="range" min="1" max="2" step="0.05" value={photoSettings.zoom || 1} onChange={(e) => updatePhotoSettings({ zoom: Number(e.target.value) })} style={{ width: "100%", accentColor: "#2A0F3A" }} />
                </div>

                {/* Position X */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>Horizontal Position</span>
                    <span style={{ color: "#C19A6B", fontWeight: 700 }}>{photoSettings.positionX ?? 50}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="1" value={photoSettings.positionX ?? 50} onChange={(e) => updatePhotoSettings({ positionX: Number(e.target.value) })} style={{ width: "100%", accentColor: "#2A0F3A" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}><span>Left</span><span>Center</span><span>Right</span></div>
                </div>

                {/* Position Y */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>Vertical Position</span>
                    <span style={{ color: "#C19A6B", fontWeight: 700 }}>{photoSettings.positionY ?? 50}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="1" value={photoSettings.positionY ?? 50} onChange={(e) => updatePhotoSettings({ positionY: Number(e.target.value) })} style={{ width: "100%", accentColor: "#2A0F3A" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}><span>Top</span><span>Center</span><span>Bottom</span></div>
                </div>

                {/* Rotation */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                    <span>Rotation</span>
                    <span style={{ color: "#C19A6B", fontWeight: 700 }}>{photoSettings.rotation ?? 0}°</span>
                  </div>
                  <input type="range" min="-5" max="5" step="0.5" value={photoSettings.rotation ?? 0} onChange={(e) => updatePhotoSettings({ rotation: Number(e.target.value) })} style={{ width: "100%", accentColor: "#2A0F3A" }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#9ca3af" }}><span>-5°</span><span>0°</span><span>+5°</span></div>
                </div>

                <button
                  type="button"
                  onClick={() => updatePhotoSettings({ zoom: 1, positionX: 50, positionY: 50, rotation: 0 })}
                  style={{ padding: "6px 12px", fontSize: 11, background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 4, cursor: "pointer", color: "#6b7280", width: "100%" }}
                >
                  🔄 Reset Photo Adjustment
                </button>
              </div>

              {/* Object Fit & Shadow */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Image Fit</label>
                  <select
                    value={photoSettings.objectFit || "cover"}
                    onChange={(e) => updatePhotoSettings({ objectFit: e.target.value as "cover" | "contain" })}
                    style={defaultInputStyle}
                  >
                    <option value="cover">Cover (Fill & Crop Center)</option>
                    <option value="contain">Contain (Full Image Visible)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Ambient Shadow</label>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={photoSettings.shadow !== false}
                      onChange={(e) => updatePhotoSettings({ shadow: e.target.checked })}
                      style={{ accentColor: "#2A0F3A" }}
                    />
                    <span>Luxury Ambient Shadow</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: 10 }}>
              👁️ Live Profile Avatar Preview
            </div>
            <div
              style={{
                background: "linear-gradient(135deg, #1c0828 0%, #2A0F3A 50%, #150520 100%)",
                borderRadius: 12,
                padding: 24,
                textAlign: "center",
                color: "#ffffff",
                border: "1px solid rgba(212,175,55,0.3)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
              }}
            >
              <div style={{ position: "relative", display: "inline-block", margin: "0 auto 16px" }}>
                {form.photo || form.profileImage ? (
                  <div style={{ width: photoSettings.desktopSize, height: photoSettings.desktopSize, borderRadius: `${photoSettings.borderRadius}%`, overflow: "hidden", border: `${photoSettings.borderWidth}px solid ${photoSettings.borderColor}`, boxShadow: photoSettings.shadow ? "0 12px 32px rgba(0,0,0,0.4)" : "none", display: "block" }}>
                    <img
                      src={String(form.photo || form.profileImage)}
                      alt={String(form.name || "Preview")}
                      style={{
                        width: `${(photoSettings.zoom || 1) * 100}%`,
                        height: `${(photoSettings.zoom || 1) * 100}%`,
                        objectPosition: `${photoSettings.positionX ?? 50}% ${photoSettings.positionY ?? 50}%`,
                        borderRadius: 0,
                        objectFit: "cover",
                        border: "none",
                        display: "block",
                        transform: `rotate(${photoSettings.rotation ?? 0}deg)`,
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: photoSettings.desktopSize,
                      height: photoSettings.desktopSize,
                      borderRadius: `${photoSettings.borderRadius}%`,
                      background: "linear-gradient(135deg, #4A1A66 0%, #2A0F3A 100%)",
                      color: "#D4AF37",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 48,
                      fontWeight: 700,
                      border: `${photoSettings.borderWidth}px solid ${photoSettings.borderColor}`,
                    }}
                  >
                    {String(form.name || "QC").charAt(0)}
                  </div>
                )}
                {form.active !== false && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 4,
                      right: 4,
                      background: "#10b981",
                      color: "#ffffff",
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: "bold",
                      border: "2px solid #ffffff",
                    }}
                  >
                    ✓
                  </div>
                )}
              </div>

              <div style={{ font: "18px var(--font-display)", fontWeight: 700, color: "#ffffff" }}>{String(form.name || "Employee Name")}</div>
              <div style={{ fontSize: 13, color: "#D4AF37", fontWeight: 600, marginTop: 4 }}>{String(form.designation || "Designation")}</div>
              <div style={{ fontSize: 12, color: "#d1d5db", marginTop: 2 }}>{String(form.department || "Department")}</div>

              <div
                style={{
                  display: "inline-block",
                  marginTop: 14,
                  padding: "4px 12px",
                  background: "rgba(212,175,55,0.15)",
                  border: "1px solid #D4AF37",
                  borderRadius: 20,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: "#D4AF37",
                  textTransform: "uppercase",
                }}
              >
                ID: {String(form.employeeId || form.slug || "QC-EMP")}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PROFESSIONAL GALLERY */}
      {activeTab === "gallery" && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <GlobalMediaUploader
              label="Add Photo to Professional Gallery (Upload from Computer or Media Library)"
              value=""
              onChange={(val) => {
                const url = typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0].url) : "";
                if (url) addGalleryImage(url);
              }}
              folder="employees"
              preset="employee_photo"
              compact={false}
            />
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 12 }}>
            Current Gallery Images ({gallery.length})
          </div>

          {gallery.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", background: "#f9fafb", borderRadius: 8, border: "1px dashed #d1d5db", color: "#6b7280", fontSize: 13 }}>
              No additional gallery images uploaded yet. Use the uploader above to add lab photos, certifications, or clinical field images.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
              {gallery.map((img, idx) => {
                const url = typeof img === "string" ? img : img.url;
                return (
                  <div key={idx} style={{ position: "relative", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden", background: "#ffffff", boxShadow: "0 2px 6px rgba(0,0,0,0.05)" }}>
                    <img src={url} alt={`Gallery ${idx + 1}`} style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
                    <div style={{ padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#6b7280" }}>#{idx + 1}</span>
                      <div style={{ display: "flex", gap: 4 }}>
                        {idx > 0 && (
                          <button type="button" onClick={() => moveGalleryImage(idx, "up")} style={{ padding: "3px 6px", fontSize: 10, background: "#e5e7eb", border: "none", borderRadius: 4, cursor: "pointer" }}>
                            ▲
                          </button>
                        )}
                        {idx < gallery.length - 1 && (
                          <button type="button" onClick={() => moveGalleryImage(idx, "down")} style={{ padding: "3px 6px", fontSize: 10, background: "#e5e7eb", border: "none", borderRadius: 4, cursor: "pointer" }}>
                            ▼
                          </button>
                        )}
                        <button type="button" onClick={() => removeGalleryImage(idx)} style={{ padding: "3px 6px", fontSize: 10, background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 4, cursor: "pointer" }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: VIDEOS */}
      {activeTab === "videos" && (
        <div>
          <div style={{ padding: 18, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb", marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 12 }}>
              Add Professional Video (MP4 / WebM / YouTube / Vimeo)
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={defaultLabelStyle}>Video URL (MP4, YouTube, or Vimeo)</label>
                <input
                  style={defaultInputStyle}
                  placeholder="https://www.youtube.com/watch?v=... or /uploads/employees/video.mp4"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={defaultLabelStyle}>Video Title</label>
                  <input
                    style={defaultInputStyle}
                    placeholder="e.g. Clinical Formulation Walkthrough"
                    value={newVideoTitle}
                    onChange={(e) => setNewVideoTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label style={defaultLabelStyle}>Poster / Thumbnail Image URL</label>
                  <input
                    style={defaultInputStyle}
                    placeholder="https://... (Optional video thumbnail)"
                    value={newVideoPoster}
                    onChange={(e) => setNewVideoPoster(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={addVideo}
                disabled={!newVideoUrl.trim()}
                style={{
                  padding: "8px 16px",
                  background: "#2A0F3A",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: newVideoUrl.trim() ? "pointer" : "not-allowed",
                  width: "fit-content",
                }}
              >
                + Add Video to Profile
              </button>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 12 }}>
            Attached Videos ({videos.length})
          </div>

          {videos.length === 0 ? (
            <div style={{ padding: 30, textAlign: "center", background: "#f9fafb", borderRadius: 8, border: "1px dashed #d1d5db", color: "#6b7280", fontSize: 13 }}>
              No videos added yet. Add interview clips, laboratory demonstrations, or keynote lectures.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {videos.map((vid) => (
                <div key={vid.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#1f2937" }}>🎬 {vid.title || "Video Feature"}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, wordBreak: "break-all" }}>{vid.url}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(vid.id)}
                    style={{ padding: "6px 12px", background: "#fee2e2", color: "#b91c1c", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: THEME & BRANDING */}
      {activeTab === "theme" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          <div>
            <div style={{ padding: 18, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2A0F3A", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                🎨 Employee Profile Theme Colors
              </div>
              <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 16, lineHeight: 1.5 }}>
                Customize the visual theme of this employee's public profile page. Leave empty to use the global Queens Care default theme.
              </p>

              {([
                { key: "primary", label: "Primary Color", default: "#2A0F3A" },
                { key: "gold", label: "Gold / Accent Color", default: "#C19A6B" },
                { key: "background", label: "Background Color", default: "#FAF8F5" },
                { key: "cardBg", label: "Card Background", default: "#FFFFFF" },
                { key: "text", label: "Text Color", default: "#333333" },
                { key: "badgeBg", label: "Badge Color", default: "#D4AF37" },
                { key: "buttonBg", label: "Button Color", default: "#2A0F3A" },
              ] as const).map((c) => {
                const tc = (form.themeColors as Record<string, string>) || {};
                const val = tc[c.key] || "";
                return (
                  <div key={c.key} style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>{c.label}</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="color"
                        value={val || c.default}
                        onChange={(e) => setForm({ ...form, themeColors: { ...((form.themeColors as Record<string, string>) || {}), [c.key]: e.target.value } })}
                        style={{ width: 36, height: 36, border: "none", cursor: "pointer", borderRadius: 4 }}
                      />
                      <input
                        style={{ ...defaultInputStyle, flex: 1 }}
                        placeholder={c.default}
                        value={val}
                        onChange={(e) => setForm({ ...form, themeColors: { ...((form.themeColors as Record<string, string>) || {}), [c.key]: e.target.value } })}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const tc2 = { ...((form.themeColors as Record<string, string>) || {}) };
                          delete tc2[c.key];
                          setForm({ ...form, themeColors: tc2 });
                        }}
                        style={{ padding: "6px 10px", fontSize: 11, background: "#e5e7eb", border: "none", borderRadius: 4, cursor: "pointer", color: "#6b7280" }}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                );
              })}

              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: "#4b5563", display: "block", marginBottom: 4 }}>Optional Gradient CSS</label>
                <input
                  style={defaultInputStyle}
                  placeholder="e.g. linear-gradient(135deg, #2A0F3A 0%, #4A1A66 100%)"
                  value={String(((form.themeColors as Record<string, string>) || {}).gradient || "")}
                  onChange={(e) => setForm({ ...form, themeColors: { ...((form.themeColors as Record<string, string>) || {}), gradient: e.target.value } })}
                />
              </div>

              <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, themeColors: { primary: "#2A0F3A", gold: "#C19A6B", background: "#FAF8F5", cardBg: "#FFFFFF", text: "#333333", badgeBg: "#D4AF37", buttonBg: "#2A0F3A", gradient: "" } })}
                  style={{ padding: "8px 14px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                >
                  🔄 Reset to Queens Care Default
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, themeColors: { primary: "", gold: "", background: "", cardBg: "", text: "", badgeBg: "", buttonBg: "", gradient: "" } })}
                  style={{ padding: "8px 14px", background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 12, cursor: "pointer" }}
                >
                  Clear All (Use Global Theme)
                </button>
              </div>
            </div>
          </div>

          {/* Live Theme Preview */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6b7280", marginBottom: 10 }}>
              👁️ Live Theme Preview
            </div>
            <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
              <div style={{ padding: 16, background: ((form.themeColors as Record<string, string>) || {}).gradient || ((form.themeColors as Record<string, string>) || {}).primary || "#2A0F3A", color: "#fff", textAlign: "center" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", opacity: 0.8 }}>QUEENS CARE LABORATORIES</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{String(form.name || "Employee Name")}</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>{String(form.designation || "Designation")}</div>
              </div>
              <div style={{ padding: 16, background: ((form.themeColors as Record<string, string>) || {}).background || "#FAF8F5" }}>
                <div style={{ background: ((form.themeColors as Record<string, string>) || {}).cardBg || "#FFFFFF", padding: 14, borderRadius: 8, border: "1px solid #eae5db" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ((form.themeColors as Record<string, string>) || {}).primary || "#2A0F3A", marginBottom: 6, textTransform: "uppercase" }}>Employment Verification</div>
                  <div style={{ fontSize: 11, color: ((form.themeColors as Record<string, string>) || {}).text || "#333333", marginBottom: 4 }}>ID: {String(form.employeeId || "QC-EMP")}</div>
                  <div style={{ fontSize: 11, color: ((form.themeColors as Record<string, string>) || {}).text || "#333333", marginBottom: 8 }}>Dept: {String(form.department || "Department")}</div>
                  {form.active !== false && form.verified !== false && (
                    <div style={{ display: "inline-block", padding: "3px 10px", background: ((form.themeColors as Record<string, string>) || {}).badgeBg || "#D4AF37", color: "#fff", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>
                      ✓ VERIFIED
                    </div>
                  )}
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "inline-block", padding: "6px 14px", background: ((form.themeColors as Record<string, string>) || {}).buttonBg || "#2A0F3A", color: "#fff", borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                      Email Employee
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24, paddingTop: 16, borderTop: "1px solid #e5e7eb" }}>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 18px",
              background: "#ffffff",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: 6,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            padding: "10px 24px",
            background: "linear-gradient(135deg, #2A0F3A 0%, #4A1A66 100%)",
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            boxShadow: "0 4px 14px rgba(42,15,58,0.25)",
          }}
        >
          {saving ? "Saving Changes…" : "Save Employee →"}
        </button>
      </div>
    </div>
  );
}
