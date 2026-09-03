"use client";

import React, { useState, useEffect, useCallback } from "react";
import { PLATFORM_REGISTRY, SocialBrandIcon, PlatformDefinition } from "../components/SocialIcons";
import GlobalMediaUploader from "../components/GlobalMediaUploader";

// Auto-detect platform from URL
function detectPlatformFromUrl(url: string): { platform: string; category: "social" | "marketplace" | "custom" } {
  const lower = url.toLowerCase();
  if (lower.includes("instagram.com")) return { platform: "instagram", category: "social" };
  if (lower.includes("facebook.com") || lower.includes("fb.com")) return { platform: "facebook", category: "social" };
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return { platform: "youtube", category: "social" };
  if (lower.includes("linkedin.com")) return { platform: "linkedin", category: "social" };
  if (lower.includes("x.com") || lower.includes("twitter.com")) return { platform: "twitter", category: "social" };
  if (lower.includes("wa.me") || lower.includes("whatsapp.com")) return { platform: "whatsapp", category: "social" };
  if (lower.includes("pinterest.com") || lower.includes("pin.it")) return { platform: "pinterest", category: "social" };
  if (lower.includes("amazon.")) return { platform: "amazon", category: "marketplace" };
  if (lower.includes("flipkart.com")) return { platform: "flipkart", category: "marketplace" };
  if (lower.includes("meesho.com")) return { platform: "meesho", category: "marketplace" };
  if (lower.includes("myntra.com")) return { platform: "myntra", category: "marketplace" };
  if (lower.includes("ajio.com")) return { platform: "ajio", category: "marketplace" };
  if (lower.includes("1mg.com")) return { platform: "tata1mg", category: "marketplace" };
  if (lower.includes("pharmeasy")) return { platform: "pharmeasy", category: "marketplace" };
  if (lower.includes("netmeds.com")) return { platform: "netmeds", category: "marketplace" };
  if (lower.includes("apollo247")) return { platform: "apollo247", category: "marketplace" };
  if (lower.includes("indiamart.com")) return { platform: "indiamart", category: "marketplace" };
  if (lower.includes("jiomart.com")) return { platform: "jiomart", category: "marketplace" };
  return { platform: "custom", category: "custom" };
}

export type SocialLink = {
  id: string;
  platform: string;
  category: "social" | "marketplace" | "custom";
  label: string;
  url: string;
  icon: string;
  customIconUrl?: string;
  visible: boolean;
  iconSize: number;
  desktopIconSize: number;
  mobileIconSize: number;
  openNewTab: boolean;
  sortOrder: number;
};

export default function SocialMediaLinksManager() {
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<"all" | "social" | "marketplace" | "hidden">("all");

  const [form, setForm] = useState({
    platform: "instagram",
    category: "social" as "social" | "marketplace" | "custom",
    label: "Instagram",
    url: "",
    customIconUrl: "",
    visible: true,
    desktopIconSize: 22,
    mobileIconSize: 18,
    openNewTab: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/social-links");
      const data = await res.json();
      setLinks(data.links || []);
    } catch {
      setMessage("Failed to load social links.");
      setIsError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const resetForm = () => {
    setForm({
      platform: "instagram",
      category: "social",
      label: "Instagram",
      url: "",
      customIconUrl: "",
      visible: true,
      desktopIconSize: 22,
      mobileIconSize: 18,
      openNewTab: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handlePlatformChange = (platformKey: string) => {
    const def = PLATFORM_REGISTRY[platformKey] || PLATFORM_REGISTRY.custom;
    setForm((prev) => ({
      ...prev,
      platform: platformKey,
      category: def.category,
      label: prev.label === "" || Object.values(PLATFORM_REGISTRY).some((p) => p.label === prev.label) ? def.label : prev.label,
    }));
  };

  const startEdit = (link: SocialLink) => {
    setForm({
      platform: link.platform || "instagram",
      category: link.category || "social",
      label: link.label || "",
      url: link.url || "",
      customIconUrl: link.customIconUrl || "",
      visible: link.visible !== false,
      desktopIconSize: Number(link.desktopIconSize || link.iconSize || 22),
      mobileIconSize: Number(link.mobileIconSize || 18),
      openNewTab: link.openNewTab !== false,
    });
    setEditingId(link.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSave = async () => {
    if (!form.url.trim()) {
      setMessage("URL is required.");
      setIsError(true);
      return;
    }

    const payload = {
      ...form,
      label: form.label.trim() || PLATFORM_REGISTRY[form.platform]?.label || form.platform,
      iconSize: form.desktopIconSize,
    };

    try {
      if (editingId) {
        const res = await fetch("/api/admin/social-links", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        if (!res.ok) throw new Error("Failed to update link");
        setMessage("Social link updated successfully!");
      } else {
        const res = await fetch("/api/admin/social-links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create link");
        setMessage("New link added successfully!");
      }
      setIsError(false);
      resetForm();
      load();
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "Failed to save link.");
      setIsError(true);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Are you sure you want to delete "${label}"?`)) return;
    try {
      const res = await fetch(`/api/admin/social-links?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage(`Deleted "${label}".`);
        setIsError(false);
        load();
      } else {
        throw new Error("Failed to delete");
      }
    } catch {
      setMessage("Failed to delete link.");
      setIsError(true);
    }
  };

  const handleToggleVisible = async (link: SocialLink) => {
    const nextState = !link.visible;
    // Optimistic UI update
    setLinks((prev) => prev.map((l) => (l.id === link.id ? { ...l, visible: nextState } : l)));
    try {
      const res = await fetch("/api/admin/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: link.id, visible: nextState }),
      });
      if (res.ok) {
        setMessage(`"${link.label}" is now ${nextState ? "VISIBLE" : "HIDDEN"} on public website.`);
        setIsError(false);
      } else {
        load();
      }
    } catch {
      load();
    }
  };

  const handleBulkToggle = async (action: "hide_all" | "unhide_all") => {
    const nextState = action === "unhide_all";
    if (!confirm(action === "hide_all" ? "Hide ALL social & marketplace links from public footer?" : "Make ALL links visible?")) return;

    setLinks((prev) => prev.map((l) => ({ ...l, visible: nextState })));
    try {
      const res = await fetch("/api/admin/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setMessage(action === "hide_all" ? "All links are now HIDDEN from public footer." : "All links are now VISIBLE on public website.");
        setIsError(false);
      }
      load();
    } catch {
      load();
    }
  };

  const handleMove = async (id: string, dir: -1 | 1) => {
    const idx = links.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= links.length) return;
    const newLinks = [...links];
    [newLinks[idx], newLinks[swapIdx]] = [newLinks[swapIdx], newLinks[idx]];
    const orderedIds = newLinks.map((l) => l.id);
    setLinks(newLinks);
    try {
      await fetch("/api/admin/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: "reorder", orderedIds }),
      });
    } catch {}
  };

  // Group platforms for select dropdown
  const socialPlatforms = Object.values(PLATFORM_REGISTRY).filter((p) => p.category === "social");
  const marketplacePlatforms = Object.values(PLATFORM_REGISTRY).filter((p) => p.category === "marketplace");
  const customPlatforms = Object.values(PLATFORM_REGISTRY).filter((p) => p.category === "custom");

  // Filtered links view
  const visibleLinks = links.filter((l) => {
    if (activeCategoryFilter === "hidden") return l.visible === false;
    if (activeCategoryFilter === "social") return l.category === "social" || (!l.category && !marketplacePlatforms.some((m) => m.id === l.platform));
    if (activeCategoryFilter === "marketplace") return l.category === "marketplace" || marketplacePlatforms.some((m) => m.id === l.platform);
    return true;
  });

  const publicActiveCount = links.filter((l) => l.visible !== false && Boolean(l.url)).length;

  return (
    <div style={{ maxWidth: 1040, margin: "0 auto" }}>
      {/* Top Banner & Action Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#C19A6B", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Queens Care Laboratories CMS
          </div>
          <h2 style={{ font: "26px var(--font-display)", color: "#2A0F3A", margin: "4px 0 6px 0" }}>
            🔗 Social Media & Marketplace Links
          </h2>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            Manage public footer icons for social channels (Instagram, YouTube, etc.) and online pharmacies/marketplaces (Amazon, Flipkart, Tata 1mg, Apollo 24/7).
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => handleBulkToggle("hide_all")}
            style={{
              padding: "8px 14px",
              background: "#fff",
              color: "#b91c1c",
              border: "1px solid #fca5a5",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Hide all social and marketplace links at once"
          >
            🚫 Hide All Links
          </button>
          <button
            type="button"
            onClick={() => handleBulkToggle("unhide_all")}
            style={{
              padding: "8px 14px",
              background: "#fff",
              color: "#047857",
              border: "1px solid #6ee7b7",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
            title="Make all links visible on public website"
          >
            👁️ Unhide All
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{
              padding: "8px 18px",
              background: "linear-gradient(135deg, #2A0F3A 0%, #4A1A66 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(42,15,58,0.2)",
            }}
          >
            + Add New Link
          </button>
        </div>
      </div>

      {message && (
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
          <span>{message}</span>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div
          style={{
            background: "#ffffff",
            border: "2px solid #2A0F3A",
            borderRadius: 12,
            padding: 24,
            marginBottom: 28,
            boxShadow: "0 12px 35px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: 12, marginBottom: 20 }}>
            <h3 style={{ font: "18px var(--font-display)", color: "#2A0F3A", margin: 0 }}>
              {editingId ? "Edit Link Configuration" : "Add New Social or Marketplace Link"}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              style={{ background: "none", border: "none", fontSize: 18, color: "#6b7280", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            {/* Platform Selection */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#4b5563", marginBottom: 6 }}>
                Platform / Marketplace *
              </label>
              <select
                value={form.platform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, color: "#1f2937", background: "#ffffff" }}
              >
                <optgroup label="── Social Platforms ──">
                  {socialPlatforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="── Online Pharmacies & Marketplaces ──">
                  {marketplacePlatforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="── Custom Channels ──">
                  {customPlatforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Display Label */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#4b5563", marginBottom: 6 }}>
                Display Label
              </label>
              <input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g. Amazon India Store"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, color: "#1f2937" }}
              />
            </div>

            {/* Target URL */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#4b5563", marginBottom: 6 }}>
                Target Link URL *
              </label>
              <input
                value={form.url}
                onChange={(e) => {
                  const url = e.target.value;
                  setForm((prev) => {
                    // Auto-detect platform when URL is pasted (contains a dot)
                    if (url.includes(".")) {
                      const detected = detectPlatformFromUrl(url);
                      const def = PLATFORM_REGISTRY[detected.platform];
                      const shouldUpdateLabel = prev.label === "" || Object.values(PLATFORM_REGISTRY).some((p) => p.label === prev.label);
                      return {
                        ...prev,
                        url,
                        platform: detected.platform,
                        category: detected.category,
                        label: shouldUpdateLabel ? (def?.label || detected.platform) : prev.label,
                        customIconUrl: "", // Clear custom icon so auto-detected SVG shows
                      };
                    }
                    return { ...prev, url };
                  });
                }}
                placeholder="Paste any URL — platform auto-detected (e.g. amazon.in, instagram.com)"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #d1d5db", fontSize: 14, color: "#1f2937" }}
              />
            </div>

            {/* Custom Icon (if custom selected) */}
            {(form.platform === "custom" || form.platform === "custom_marketplace") && (
              <div style={{ gridColumn: "1 / -1", padding: 14, background: "#faf8f5", borderRadius: 8, border: "1px dashed #d1d5db" }}>
                <GlobalMediaUploader
                  label="Custom Brand Logo / Icon (Optional Image / SVG)"
                  value={form.customIconUrl}
                  onChange={(val) => {
                    const url = typeof val === "string" ? val : Array.isArray(val) && val.length > 0 ? (typeof val[0] === "string" ? val[0] : val[0].url) : "";
                    setForm((prev) => ({ ...prev, customIconUrl: url }));
                  }}
                  folder="logos"
                  compact={true}
                />
              </div>
            )}

            {/* Icon Size Sliders */}
            <div style={{ padding: 14, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                <span>Desktop Icon Size</span>
                <span style={{ color: "#C19A6B", fontWeight: 700 }}>{form.desktopIconSize} px</span>
              </div>
              <input
                type="range"
                min="14"
                max="48"
                step="2"
                value={form.desktopIconSize}
                onChange={(e) => setForm({ ...form, desktopIconSize: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "#2A0F3A" }}
              />
            </div>

            <div style={{ padding: 14, background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                <span>Mobile Icon Size</span>
                <span style={{ color: "#C19A6B", fontWeight: 700 }}>{form.mobileIconSize} px</span>
              </div>
              <input
                type="range"
                min="12"
                max="36"
                step="2"
                value={form.mobileIconSize}
                onChange={(e) => setForm({ ...form, mobileIconSize: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "#2A0F3A" }}
              />
            </div>

            {/* Visibility & Link Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.visible}
                  onChange={(e) => setForm({ ...form, visible: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "#2A0F3A" }}
                />
                <span>Visible on Website (Public Footer)</span>
              </label>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={form.openNewTab}
                  onChange={(e) => setForm({ ...form, openNewTab: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "#2A0F3A" }}
                />
                <span>Open in New Browser Tab</span>
              </label>
            </div>
          </div>

          {/* Icon Live Preview Card */}
          <div style={{ marginTop: 20, padding: 16, background: "linear-gradient(135deg, #180524 0%, #2A0F3A 100%)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ background: "rgba(255,255,255,0.1)", padding: 8, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <SocialBrandIcon
                  platform={form.platform}
                  size={form.desktopIconSize}
                  customIconUrl={form.customIconUrl}
                  color="#ffffff"
                />
              </div>
              <div>
                <div style={{ color: "#ffffff", fontWeight: 700, fontSize: 14 }}>{form.label || "Platform Label"}</div>
                <div style={{ color: "#D4AF37", fontSize: 11, marginTop: 2 }}>{form.url || "No URL specified yet"}</div>
              </div>
            </div>

            <div
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                background: form.visible ? "#10b981" : "#6b7280",
                color: "#ffffff",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {form.visible ? "VISIBLE" : "HIDDEN"}
            </div>
          </div>

          {/* Form Action Buttons */}
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              onClick={resetForm}
              style={{ padding: "10px 18px", background: "#ffffff", color: "#6b7280", border: "1px solid #d1d5db", borderRadius: 6, fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              style={{
                padding: "10px 24px",
                background: "linear-gradient(135deg, #2A0F3A 0%, #4A1A66 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(42,15,58,0.25)",
              }}
            >
              {editingId ? "Update Link →" : "Save Link →"}
            </button>
          </div>
        </div>
      )}

      {/* Category Filter Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid #e5e7eb", paddingBottom: 8 }}>
        {[
          { id: "all", label: `All Links (${links.length})` },
          { id: "social", label: `Social Channels (${links.filter((l) => l.category === "social" || !l.category).length})` },
          { id: "marketplace", label: `Marketplaces (${links.filter((l) => l.category === "marketplace").length})` },
          { id: "hidden", label: `Hidden (${links.filter((l) => l.visible === false).length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveCategoryFilter(tab.id as typeof activeCategoryFilter)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              background: activeCategoryFilter === tab.id ? "#2A0F3A" : "transparent",
              color: activeCategoryFilter === tab.id ? "#ffffff" : "#4b5563",
              fontWeight: activeCategoryFilter === tab.id ? 700 : 500,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Links List Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#6b7280" }}>Loading links...</div>
      ) : visibleLinks.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", background: "#f9fafb", borderRadius: 12, border: "1px dashed #d1d5db" }}>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 12px 0" }}>
            {activeCategoryFilter === "hidden" ? "No hidden links found." : "No links found in this category."}
          </p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            style={{ padding: "8px 18px", background: "#2A0F3A", color: "#fff", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
          >
            + Add New Link
          </button>
        </div>
      ) : (
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #e5e7eb", overflow: "hidden", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#faf8f5", borderBottom: "2px solid #eae5db", textAlign: "left" }}>
                <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", width: 60 }}>#</th>
                <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", width: 60 }}>Icon</th>
                <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Platform / Store</th>
                <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>Target URL</th>
                <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", width: 90 }}>Sizes</th>
                <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", width: 140 }}>Status</th>
                <th style={{ padding: "12px 14px", fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", textAlign: "right", width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleLinks.map((link, idx) => (
                <tr
                  key={link.id}
                  style={{
                    borderBottom: "1px solid #f3f4f6",
                    background: link.visible ? "#ffffff" : "#fdf8f8",
                    opacity: link.visible ? 1 : 0.75,
                  }}
                >
                  <td style={{ padding: "12px 14px", color: "#9ca3af", fontWeight: 600 }}>{idx + 1}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 6, background: "#faf8f5", border: "1px solid #eae5db", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SocialBrandIcon
                        platform={link.platform}
                        size={22}
                        customIconUrl={link.customIconUrl}
                      />
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 700, color: "#1f2937" }}>{link.label}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{PLATFORM_REGISTRY[link.platform]?.label || link.platform}</span>
                      {link.category === "marketplace" && (
                        <span style={{ padding: "1px 6px", background: "#fef3c7", color: "#92400e", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                          Marketplace
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: "#2A0F3A", textDecoration: "none", fontSize: 12 }}>
                      {link.url}
                    </a>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#4b5563" }}>
                    <div>D: {link.desktopIconSize || link.iconSize || 22}px</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>M: {link.mobileIconSize || 18}px</div>
                  </td>

                  {/* Explicit Visibility Badge + Quick Toggle Button */}
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          padding: "3px 8px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                          background: link.visible ? "#d1fae5" : "#fee2e2",
                          color: link.visible ? "#065f46" : "#991b1b",
                          border: `1px solid ${link.visible ? "#a7f3d0" : "#fca5a5"}`,
                        }}
                      >
                        {link.visible ? "VISIBLE" : "HIDDEN"}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleVisible(link)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          border: "1px solid #d1d5db",
                          background: link.visible ? "#fee2e2" : "#d1fae5",
                          color: link.visible ? "#991b1b" : "#065f46",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {link.visible ? "Hide" : "Unhide"}
                      </button>
                    </div>
                  </td>

                  {/* Edit, Delete, Reorder Actions */}
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleMove(link.id, -1)}
                        disabled={idx === 0}
                        style={{ padding: "4px 6px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 4, cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1 }}
                        title="Move Up"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(link.id, 1)}
                        disabled={idx === visibleLinks.length - 1}
                        style={{ padding: "4px 6px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 4, cursor: idx === visibleLinks.length - 1 ? "not-allowed" : "pointer", opacity: idx === visibleLinks.length - 1 ? 0.3 : 1 }}
                        title="Move Down"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(link)}
                        style={{ padding: "4px 8px", background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#2A0F3A" }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(link.id, link.label)}
                        style={{ padding: "4px 8px", background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer", color: "#b91c1c" }}
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Live Public Footer Simulation */}
      <div style={{ marginTop: 32, background: "linear-gradient(135deg, #180524 0%, #2A0F3A 100%)", borderRadius: 12, padding: 24, border: "2px solid #D4AF37", color: "#ffffff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(212,175,55,0.3)", paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            👁️ Live Public Footer Preview
          </div>
          <div style={{ fontSize: 12, color: "#d1d5db" }}>
            Active on Public Website: <b>{publicActiveCount}</b> links
          </div>
        </div>

        {publicActiveCount === 0 ? (
          <div style={{ padding: "20px 0", textAlign: "center", color: "#e5e7eb", fontSize: 13, fontStyle: "italic" }}>
            (All links are currently hidden — the social links section will be automatically omitted from the public footer without leaving blank space).
          </div>
        ) : (
          <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            {links
              .filter((l) => l.visible !== false && Boolean(l.url))
              .map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={link.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 20,
                    color: "#ffffff",
                    textDecoration: "none",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <SocialBrandIcon
                    platform={link.platform}
                    size={link.desktopIconSize || link.iconSize || 20}
                    customIconUrl={link.customIconUrl}
                    color="#ffffff"
                  />
                  <span>{link.label}</span>
                </a>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
