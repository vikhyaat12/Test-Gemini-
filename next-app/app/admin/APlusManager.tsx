"use client";

import React, { useState, useEffect } from "react";
import GlobalMediaUploader from "../components/GlobalMediaUploader";

type APlusSection = {
  id?: string;
  type: string;
  heading?: string;
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  items?: string[];
  ctaText?: string;
  ctaLink?: string;
  published?: boolean;
};

type APlusTemplate = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  published: boolean;
  sections: APlusSection[];
  createdAt?: string;
  updatedAt?: string;
};

type ProductSimple = {
  id: string;
  slug: string;
  name: string;
  aplusTemplateId?: string | null;
  aplusPublished?: boolean;
};

const APLUS_TYPES: { value: string; label: string; icon: string; desc: string }[] = [
  { value: "hero", label: "Hero Banner / Video", icon: "🖼️", desc: "Large widescreen banner with headline, image/video background" },
  { value: "imageText", label: "Image + Text", icon: "📰", desc: "Side-by-side image and explanatory text" },
  { value: "video", label: "Video Showcase", icon: "🎬", desc: "YouTube, Vimeo or MP4 player with description" },
  { value: "benefits", label: "Benefits Grid", icon: "✅", desc: "Key highlights and clinical benefits checkmarks" },
  { value: "comparison", label: "Comparison Table", icon: "📊", desc: "Compare Queens Care vs standard generic alternatives" },
  { value: "features", label: "Features Breakdown", icon: "⭐", desc: "Multi-column feature specifications" },
  { value: "highlights", label: "Highlights Callout", icon: "💡", desc: "Distinctive badges and callout points" },
  { value: "richText", label: "Rich Text / HTML", icon: "📝", desc: "Custom formatted text and paragraphs" },
  { value: "cta", label: "Call To Action", icon: "🔘", desc: "Promotional CTA box with button link" },
];

export default function APlusManager() {
  const [templates, setTemplates] = useState<APlusTemplate[]>([]);
  const [products, setProducts] = useState<ProductSimple[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<APlusTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  // Attach modal state
  const [attachModalTemplate, setAttachModalTemplate] = useState<APlusTemplate | null>(null);
  const [selectedProductSlug, setSelectedProductSlug] = useState("");
  const [attaching, setAttaching] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/aplus");
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
      if (data.products) setProducts(data.products);
    } catch {
      setFeedback({ msg: "Failed to load A+ Content data.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNew = () => {
    const newTpl: APlusTemplate = {
      id: `aplus-${Date.now().toString(36)}`,
      title: "New A+ Content Module",
      description: "Custom rich product storytelling template",
      category: "Science & Clinical",
      published: true,
      sections: [
        {
          id: `sec-${Date.now()}-1`,
          type: "hero",
          heading: "Advanced Pharmaceutical Science",
          text: "Clinically validated formulations manufactured under rigorous pharmaceutical protocols.",
          imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=1600&q=85",
          published: true,
        },
        {
          id: `sec-${Date.now()}-2`,
          type: "benefits",
          heading: "Clinical Highlights",
          items: [
            "✦ High-Bioavailability Active Formulations",
            "✦ Zero Synthetic Fillers or Artificial Dyes",
            "✦ Batch Traceability via QR Certification",
          ],
          published: true,
        },
      ],
    };
    setSelectedTemplate(newTpl);
    setIsEditing(true);
    setExpandedSection(0);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    if (!selectedTemplate.title.trim()) {
      setFeedback({ msg: "Please provide a template title.", type: "error" });
      return;
    }

    setSaving(true);
    setFeedback(null);
    try {
      const isExisting = templates.some((t) => t.id === selectedTemplate.id);
      const url = "/api/admin/aplus";
      const method = isExisting ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedTemplate),
      });

      const data = await res.json();
      if (res.ok) {
        setFeedback({ msg: `A+ Template "${selectedTemplate.title}" saved successfully!`, type: "success" });
        setIsEditing(false);
        loadData();
      } else {
        setFeedback({ msg: data.error || "Failed to save template.", type: "error" });
      }
    } catch {
      setFeedback({ msg: "Network error while saving template.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this A+ template?")) return;
    try {
      const res = await fetch(`/api/admin/aplus?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setFeedback({ msg: "A+ Template deleted.", type: "success" });
        if (selectedTemplate?.id === id) {
          setSelectedTemplate(null);
          setIsEditing(false);
        }
        loadData();
      }
    } catch {
      setFeedback({ msg: "Failed to delete template.", type: "error" });
    }
  };

  const handleAttachToProduct = async () => {
    if (!attachModalTemplate || !selectedProductSlug) return;
    setAttaching(true);
    try {
      const res = await fetch("/api/admin/aplus", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "attach",
          productId: selectedProductSlug,
          templateId: attachModalTemplate.id,
          sections: attachModalTemplate.sections,
          published: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          msg: `Attached A+ Content "${attachModalTemplate.title}" to product successfully! Open the public product page to verify.`,
          type: "success",
        });
        setAttachModalTemplate(null);
        setSelectedProductSlug("");
        loadData();
      } else {
        setFeedback({ msg: data.error || "Failed to attach A+ Content.", type: "error" });
      }
    } catch {
      setFeedback({ msg: "Network error attaching A+ Content.", type: "error" });
    } finally {
      setAttaching(false);
    }
  };

  // Section builders
  const addSection = (type: string) => {
    if (!selectedTemplate) return;
    const newSec: APlusSection = {
      id: `sec-${Date.now()}`,
      type,
      heading: "",
      text: "",
      imageUrl: "",
      videoUrl: "",
      items: type === "benefits" || type === "features" || type === "comparison" || type === "highlights" ? ["", ""] : undefined,
      published: true,
    };
    const updated = [...selectedTemplate.sections, newSec];
    setSelectedTemplate({ ...selectedTemplate, sections: updated });
    setExpandedSection(updated.length - 1);
  };

  const updateSection = (idx: number, patch: Partial<APlusSection>) => {
    if (!selectedTemplate) return;
    const updated = [...selectedTemplate.sections];
    updated[idx] = { ...updated[idx], ...patch };
    setSelectedTemplate({ ...selectedTemplate, sections: updated });
  };

  const removeSection = (idx: number) => {
    if (!selectedTemplate) return;
    const updated = selectedTemplate.sections.filter((_, i) => i !== idx);
    setSelectedTemplate({ ...selectedTemplate, sections: updated });
    setExpandedSection(null);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    if (!selectedTemplate) return;
    const swap = idx + dir;
    if (swap < 0 || swap >= selectedTemplate.sections.length) return;
    const updated = [...selectedTemplate.sections];
    [updated[idx], updated[swap]] = [updated[swap], updated[idx]];
    setSelectedTemplate({ ...selectedTemplate, sections: updated });
    setExpandedSection(swap);
  };

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ font: "24px var(--font-display)", color: "var(--purple)", margin: 0 }}>
            ✨ A+ Content Management & Brand Storytelling
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Build immersive Amazon-style A+ sections (Hero banners, Video showcases, Comparison tables, Clinical proof) and attach them to products.
          </p>
        </div>
        {!isEditing && (
          <button
            type="button"
            onClick={handleCreateNew}
            style={{
              padding: "10px 20px",
              background: "var(--gold)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            ＋ Create New A+ Template
          </button>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          style={{
            padding: "12px 16px",
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

      {/* MAIN VIEW: Template List vs Template Editor */}
      {!isEditing ? (
        <div>
          {loading ? (
            <p style={{ color: "var(--muted)", padding: 24, textAlign: "center" }}>Loading A+ Content templates…</p>
          ) : templates.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", background: "#fff", border: "1px solid var(--line)" }}>
              <p style={{ fontSize: 16, color: "var(--muted)", margin: "0 0 16px" }}>No A+ templates created yet.</p>
              <button
                type="button"
                onClick={handleCreateNew}
                style={{ padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none", fontWeight: 600, cursor: "pointer" }}
              >
                Create First A+ Template →
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
              {templates.map((tpl) => {
                const attachedCount = products.filter((p) => p.aplusTemplateId === tpl.id).length;
                return (
                  <div
                    key={tpl.id}
                    style={{
                      background: "#fff",
                      border: "1px solid var(--line)",
                      padding: 20,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 16,
                      boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <span style={{ fontSize: 10, background: "var(--paper)", border: "1px solid var(--line)", padding: "2px 8px", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--purple)" }}>
                          {tpl.category || "General"}
                        </span>
                        <span style={{ fontSize: 11, color: tpl.published ? "#2e7d32" : "var(--muted)", fontWeight: 600 }}>
                          {tpl.published ? "● Published" : "○ Draft"}
                        </span>
                      </div>
                      <h3 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "10px 0 6px" }}>
                        {tpl.title}
                      </h3>
                      <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
                        {tpl.description || "No description provided."}
                      </p>
                      <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--ink)", background: "#faf8f5", padding: "8px 12px", border: "1px solid var(--line)" }}>
                        <span>📑 <b>{tpl.sections?.length || 0}</b> sections</span>
                        <span>🔗 <b>{attachedCount}</b> product{attachedCount === 1 ? "" : "s"} linked</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTemplate(tpl);
                          setIsEditing(true);
                          setExpandedSection(0);
                        }}
                        style={{ padding: "6px 14px", background: "var(--purple)", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Edit Sections ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachModalTemplate(tpl);
                          setSelectedProductSlug(products[0]?.slug || "");
                        }}
                        style={{ padding: "6px 14px", background: "var(--gold)", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >
                        Attach to Product 🔗
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTemplate(tpl.id)}
                        style={{ padding: "6px 12px", background: "#fff", color: "#b34141", border: "1px solid #f8b4b4", fontSize: 12, cursor: "pointer", marginLeft: "auto" }}
                      >
                        Delete ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TEMPLATE EDITOR */
        selectedTemplate && (
          <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24 }}>
            {/* Action Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid var(--line)", paddingBottom: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ background: "none", border: "none", color: "var(--purple)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
                >
                  ← Back to Templates
                </button>
                <span style={{ color: "var(--muted)" }}>|</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>Editing: {selectedTemplate.title}</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  style={{ padding: "8px 16px", background: previewMode ? "var(--purple)" : "#fff", color: previewMode ? "#fff" : "var(--purple)", border: "1px solid var(--purple)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  {previewMode ? "Exit Preview ✕" : "Live Preview 👁️"}
                </button>
                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  style={{ padding: "8px 22px", background: "var(--gold)", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
                >
                  {saving ? "Saving…" : "Save A+ Content →"}
                </button>
              </div>
            </div>

            {/* Template Meta */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Template Title *
                </label>
                <input
                  type="text"
                  value={selectedTemplate.title}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, title: e.target.value })}
                  placeholder="e.g. Pharmaceutical Rigor & Clinical Protocol"
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Category
                </label>
                <select
                  value={selectedTemplate.category || "Science & Clinical"}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, category: e.target.value })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13 }}
                >
                  <option value="Science & Clinical">Science & Clinical</option>
                  <option value="Ingredients & Sourcing">Ingredients & Sourcing</option>
                  <option value="Ritual & Application">Ritual & Application</option>
                  <option value="Quality & Certifications">Quality & Certifications</option>
                  <option value="General Story">General Story</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Status
                </label>
                <select
                  value={selectedTemplate.published ? "true" : "false"}
                  onChange={(e) => setSelectedTemplate({ ...selectedTemplate, published: e.target.value === "true" })}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 13 }}
                >
                  <option value="true">Published (Live)</option>
                  <option value="false">Draft (Hidden)</option>
                </select>
              </div>
            </div>

            {/* SECTIONS LIST BUILDER */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ margin: 0, font: "18px var(--font-display)", color: "var(--purple)" }}>
                  A+ Content Sections ({selectedTemplate.sections.length})
                </h4>
              </div>

              {selectedTemplate.sections.length === 0 ? (
                <p style={{ color: "var(--muted)", padding: 20, textAlign: "center", border: "1px dashed var(--line)", background: "#faf8f5" }}>
                  No sections in this template yet. Choose a section type below to add.
                </p>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {selectedTemplate.sections.map((sec, idx) => {
                    const secTypeInfo = APLUS_TYPES.find((t) => t.value === sec.type) || { label: sec.type, icon: "📄" };
                    const isExp = expandedSection === idx;

                    return (
                      <div key={sec.id || idx} style={{ border: "1px solid var(--line)", background: isExp ? "#fff" : "#faf8f5" }}>
                        {/* Section Header Accordion */}
                        <div
                          onClick={() => setExpandedSection(isExp ? null : idx)}
                          style={{
                            padding: "12px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            cursor: "pointer",
                            borderBottom: isExp ? "1px solid var(--line)" : "none",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 16 }}>{secTypeInfo.icon}</span>
                            <span style={{ fontSize: 11, background: "var(--paper)", border: "1px solid var(--line)", padding: "2px 6px", fontWeight: 700, textTransform: "uppercase" }}>
                              {secTypeInfo.label}
                            </span>
                            <b style={{ fontSize: 13, color: "var(--ink)" }}>
                              {sec.heading || `Section ${idx + 1}`}
                            </b>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moveSection(idx, -1); }}
                              disabled={idx === 0}
                              style={{ padding: "2px 6px", fontSize: 11, background: "#fff", border: "1px solid var(--line)", cursor: idx === 0 ? "not-allowed" : "pointer" }}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); moveSection(idx, 1); }}
                              disabled={idx === selectedTemplate.sections.length - 1}
                              style={{ padding: "2px 6px", fontSize: 11, background: "#fff", border: "1px solid var(--line)", cursor: idx === selectedTemplate.sections.length - 1 ? "not-allowed" : "pointer" }}
                            >
                              ▼
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeSection(idx); }}
                              style={{ padding: "2px 8px", fontSize: 11, background: "#fff", color: "#b34141", border: "1px solid #f8b4b4", cursor: "pointer" }}
                            >
                              ✕
                            </button>
                            <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 4 }}>{isExp ? "▲" : "▼"}</span>
                          </div>
                        </div>

                        {/* Section Body (Expanded) */}
                        {isExp && (
                          <div style={{ padding: 16, display: "grid", gap: 14 }}>
                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                                Section Heading
                              </label>
                              <input
                                type="text"
                                value={sec.heading || ""}
                                onChange={(e) => updateSection(idx, { heading: e.target.value })}
                                placeholder="e.g. Science with Soul: Pharmaceutical Rigor"
                                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 13 }}
                              />
                            </div>

                            <div>
                              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                                Body Text / Description
                              </label>
                              <textarea
                                rows={3}
                                value={sec.text || ""}
                                onChange={(e) => updateSection(idx, { text: e.target.value })}
                                placeholder="Detailed scientific context, methodology, clinical description..."
                                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 13 }}
                              />
                            </div>

                            {/* Media: Image or Video */}
                            <GlobalMediaUploader
                              label="Section Media (Image, Video, YouTube, Vimeo, or GIF)"
                              preset={sec.type === "hero" ? "aplus_hero" : "general"}
                              value={sec.imageUrl || sec.videoUrl || ""}
                              onChange={(val) => {
                                const url = typeof val === "string" ? val : Array.isArray(val) ? (typeof val[0] === "string" ? val[0] : val[0]?.url) : "";
                                if (url.includes(".mp4") || url.includes("youtu") || url.includes("vimeo")) {
                                  updateSection(idx, { videoUrl: url, imageUrl: url });
                                } else {
                                  updateSection(idx, { imageUrl: url });
                                }
                              }}
                              folder="aplus"
                            />

                            {/* List items for Benefits / Features / Comparison */}
                            {(sec.type === "benefits" || sec.type === "features" || sec.type === "comparison" || sec.type === "highlights") && (
                              <div>
                                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                                  List Points / Table Items
                                </label>
                                {(sec.items || []).map((itemStr, itemIdx) => (
                                  <div key={itemIdx} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                                    <input
                                      type="text"
                                      value={itemStr}
                                      onChange={(e) => {
                                        const newItems = [...(sec.items || [])];
                                        newItems[itemIdx] = e.target.value;
                                        updateSection(idx, { items: newItems });
                                      }}
                                      placeholder={`Item ${itemIdx + 1}`}
                                      style={{ flex: 1, padding: "6px 10px", border: "1px solid var(--line)", fontSize: 12 }}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newItems = (sec.items || []).filter((_, i) => i !== itemIdx);
                                        updateSection(idx, { items: newItems });
                                      }}
                                      style={{ padding: "4px 8px", background: "#fff", color: "#b34141", border: "1px solid var(--line)", cursor: "pointer" }}
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => updateSection(idx, { items: [...(sec.items || []), ""] })}
                                  style={{ padding: "4px 10px", background: "var(--paper)", border: "1px solid var(--line)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                                >
                                  ＋ Add Point
                                </button>
                              </div>
                            )}

                            {/* CTA fields */}
                            {sec.type === "cta" && (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 2 }}>Button Text</label>
                                  <input
                                    type="text"
                                    value={sec.ctaText || ""}
                                    onChange={(e) => updateSection(idx, { ctaText: e.target.value })}
                                    placeholder="Explore Full Regimen →"
                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 12 }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", display: "block", marginBottom: 2 }}>Button Link</label>
                                  <input
                                    type="text"
                                    value={sec.ctaLink || ""}
                                    onChange={(e) => updateSection(idx, { ctaLink: e.target.value })}
                                    placeholder="/shop or /products/radiance-serum"
                                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", fontSize: 12 }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ADD SECTION SELECTOR */}
            <div style={{ border: "1px dashed var(--line)", padding: 16, background: "#faf8f5", marginBottom: 24 }}>
              <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--purple)" }}>
                ＋ Add New Section To Template
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
                {APLUS_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => addSection(t.value)}
                    style={{
                      padding: "8px 12px",
                      background: "#fff",
                      border: "1px solid var(--line)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{t.icon}</span>
                    <div>
                      <b style={{ fontSize: 12, display: "block", color: "var(--ink)" }}>{t.label}</b>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>{t.desc.slice(0, 30)}…</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {/* ATTACH TO PRODUCT MODAL */}
      {attachModalTemplate && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div style={{ background: "#fff", maxWidth: 500, width: "100%", padding: 24, border: "2px solid var(--line)" }}>
            <h3 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "0 0 8px" }}>
              Attach A+ Content to Product
            </h3>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
              Selected Template: <b>{attachModalTemplate.title}</b> ({attachModalTemplate.sections.length} sections)
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Select Target Product
              </label>
              <select
                value={selectedProductSlug}
                onChange={(e) => setSelectedProductSlug(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }}
              >
                {products.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name} ({p.slug}) {p.aplusTemplateId === attachModalTemplate.id ? "— [Already Attached]" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setAttachModalTemplate(null)}
                style={{ padding: "8px 16px", background: "#fff", border: "1px solid var(--line)", fontSize: 13, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={attaching || !selectedProductSlug}
                onClick={handleAttachToProduct}
                style={{ padding: "8px 20px", background: "var(--gold)", color: "#fff", border: "none", fontWeight: 700, fontSize: 13, cursor: attaching ? "wait" : "pointer" }}
              >
                {attaching ? "Attaching…" : "Confirm & Attach →"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
