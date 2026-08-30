"use client";

import { useState, useRef, useCallback } from "react";

/* ─── ENHANCED PRODUCT EDIT FORM — TABBED ──────────────────────────────── */

type SpecRow = { name: string; value: string };
type APlusSection = {
  type: string;
  heading?: string;
  text?: string;
  imageUrl?: string;
  imageAlt?: string;
  videoUrl?: string;
  columns?: string;
  items?: string[];
  ctaText?: string;
  ctaLink?: string;
  published?: boolean;
};

type EditTab = "info" | "images" | "media" | "pricing" | "specs" | "aplus" | "seo";

const APLUS_TYPES: { value: string; label: string; icon: string }[] = [
  { value: "hero", label: "Hero Banner", icon: "🖼️" },
  { value: "fullWidth", label: "Full Width Image", icon: "📐" },
  { value: "imageText", label: "Image + Text", icon: "📰" },
  { value: "richText", label: "Rich Text", icon: "📝" },
  { value: "benefits", label: "Benefits Grid", icon: "✅" },
  { value: "features", label: "Features Grid", icon: "⭐" },
  { value: "comparison", label: "Comparison Table", icon: "📊" },
  { value: "highlights", label: "Highlights", icon: "💡" },
  { value: "video", label: "Video Section", icon: "🎬" },
  { value: "cta", label: "CTA / Button", icon: "🔘" },
];

export function ProductEditFormAdvanced({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [activeTab, setActiveTab] = useState<EditTab>("info");
  const [form, setForm] = useState(item);
  const [aplusSections, setAplusSections] = useState<APlusSection[]>(() => {
    try {
      if (Array.isArray(form.aplusContent)) return form.aplusContent as APlusSection[];
      if (typeof form.aplusContent === "string") return JSON.parse(form.aplusContent);
      return [];
    } catch { return []; }
  });
  const [specs, setSpecs] = useState<SpecRow[]>(() => {
    try {
      if (Array.isArray(form.specifications)) return form.specifications as SpecRow[];
      if (typeof form.specifications === "string") return JSON.parse(form.specifications);
      return [];
    } catch { return []; }
  });
  const [images, setImages] = useState<string[]>(() => {
    const img = form.images || form.gallery;
    if (Array.isArray(img)) return img.map(String);
    return form.image ? [String(form.image)] : [];
  });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isError, setIsError] = useState(false);
  const [aplusExpanded, setAplusExpanded] = useState<number | null>(null);
  const [aplusPublished, setAplusPublished] = useState<boolean>(() => !!form.aplusPublished);
  const [aplusSavedMsg, setAplusSavedMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");

  /* ── FILE UPLOAD HELPER ── */
  const uploadFiles = useCallback(async (files: FileList | File[], folder = "products"): Promise<string[]> => {
    setUploading(true); setUploadProgress("Uploading...");
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append("files", f));
    formData.append("folder", folder);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.files) {
        const urls = data.files.map((f: { url: string }) => f.url);
        setUploadProgress(`Uploaded ${urls.length} file(s) successfully!`);
        setTimeout(() => setUploadProgress(""), 3000);
        return urls;
      }
      setUploadProgress("Upload failed: " + (data.error || "Unknown error"));
      return [];
    } catch {
      setUploadProgress("Upload failed: network error");
      return [];
    } finally { setUploading(false); }
  }, []);

  const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 };
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4 };

  /* ── IMAGE HELPERS ── */
  const addImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl("");
    }
  };
  const removeImage = (idx: number) => setImages(images.filter((_, i) => i !== idx));
  const moveImage = (idx: number, dir: number) => {
    const arr = [...images];
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    setImages(arr);
  };

  /* ── SPEC HELPERS ── */
  const addSpec = () => setSpecs([...specs, { name: "", value: "" }]);
  const updateSpec = (idx: number, field: keyof SpecRow, val: string) => {
    const arr = [...specs]; arr[idx] = { ...arr[idx], [field]: val }; setSpecs(arr);
  };
  const removeSpec = (idx: number) => setSpecs(specs.filter((_, i) => i !== idx));

  /* ── A+ HELPERS ── */
  const addAplusSection = (type: string) => {
    setAplusSections([...aplusSections, {
      type, heading: "", text: "", imageUrl: "", imageAlt: "",
      videoUrl: "", items: [], ctaText: "", ctaLink: "", published: true,
    }]);
    setAplusExpanded(aplusSections.length);
  };
  const updateAplus = (idx: number, patch: Partial<APlusSection>) => {
    const arr = [...aplusSections]; arr[idx] = { ...arr[idx], ...patch }; setAplusSections(arr);
  };
  const removeAplus = (idx: number) => { setAplusSections(aplusSections.filter((_, i) => i !== idx)); if (aplusExpanded === idx) setAplusExpanded(null); };
  const moveAplus = (idx: number, dir: number) => {
    const arr = [...aplusSections]; const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]]; setAplusSections(arr);
    if (aplusExpanded === idx) setAplusExpanded(swap);
    else if (aplusExpanded === swap) setAplusExpanded(idx);
  };

  /* ── SAVE ── */
  const save = async () => {
    setSaving(true); setIsError(false); setMsg("");
    const isNew = Boolean(form.isNew);
    const identifier = String(form.slug || form.id || "");
    const endpoint = isNew ? "/api/products" : `/api/products/${encodeURIComponent(identifier)}`;
    const method = isNew ? "POST" : "PATCH";
    const payload = {
      ...form,
      images: images,
      image: images[0] || form.image,
      specifications: specs,
      aplusContent: aplusSections,
      aplusPublished: aplusPublished,
      price: Number(form.price || 0),
      mrp: form.mrp ? Number(form.mrp) : undefined,
      discount: form.discount ? Number(form.discount) : undefined,
      stock: Number(form.stock || 0),
      lowStockThreshold: Number(form.lowStockThreshold || 10),
    };
    try {
      const res = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { setIsError(false); setMsg("Product saved successfully!"); setTimeout(onSave, 500); }
      else { setIsError(true); setMsg(data.error || "Failed to save product."); }
    } catch { setIsError(true); setMsg("Network error while saving."); }
    setSaving(false);
  };

  /* ── TAB CONFIG ── */
  const tabs: { id: EditTab; label: string; icon: string; badge?: number }[] = [
    { id: "info", label: "Basic Info", icon: "📋" },
    { id: "images", label: "Images", icon: "🖼️", badge: images.length || undefined },
    { id: "media", label: "Media & Content", icon: "🎬" },
    { id: "pricing", label: "Pricing", icon: "💰" },
    { id: "specs", label: "Specifications", icon: "📐", badge: specs.length || undefined },
    { id: "aplus", label: "A+ Content", icon: "✨", badge: aplusSections.length || undefined },
    { id: "seo", label: "SEO", icon: "🔍" },
  ];

  return (
    <div style={{ maxWidth: 900 }}>
      {/* ── UPLOAD PROGRESS ── */}
      {(uploading || uploadProgress) && (
        <div style={{ padding: "10px 14px", marginBottom: 16, fontSize: 12, fontWeight: 500,
          background: uploading ? "#e3f2fd" : "#e9f7e9", color: uploading ? "#1565c0" : "#2e7d32",
          border: `1px solid ${uploading ? "#90caf9" : "#c3e6cb"}`, display: "flex", alignItems: "center", gap: 8 }}>
          {uploading && <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #1565c0", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />}
          {uploadProgress}
        </div>
      )}
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ font: "20px var(--font-display)", margin: 0 }}>
          {form.isNew ? "New Product" : `Edit: ${String(form.name || "Product")}`}
        </h3>
        <button onClick={save} disabled={saving}
          style={{ padding: "10px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          {saving ? "Saving…" : "💾 Save Product"}
        </button>
      </div>

      {/* ── STATUS MESSAGE ── */}
      {msg && (
        <p style={{
          padding: "10px 14px", marginBottom: 16, fontSize: 12, fontWeight: 500,
          background: isError ? "#fde8e8" : "#e9f7e9", color: isError ? "#b34141" : "#2e7d32",
          border: `1px solid ${isError ? "#f8b4b4" : "#c3e6cb"}`,
        }}>{msg}</p>
      )}

      {/* ── TAB BAR ── */}
      <div style={{
        display: "flex", gap: 0, borderBottom: "2px solid var(--line)", marginBottom: 24,
        overflowX: "auto", scrollbarWidth: "thin",
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: "12px 18px", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
              background: activeTab === t.id ? "#fff" : "transparent",
              color: activeTab === t.id ? "var(--purple)" : "var(--muted)",
              borderBottom: activeTab === t.id ? "2px solid var(--purple)" : "2px solid transparent",
              marginBottom: "-2px",
            }}>
            <span>{t.icon}</span> {t.label}
            {t.badge !== undefined && (
              <span style={{
                fontSize: 10, padding: "1px 6px", borderRadius: 10,
                background: activeTab === t.id ? "var(--purple)" : "#e0d8e3",
                color: activeTab === t.id ? "#fff" : "var(--purple)",
              }}>{t.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: BASIC INFO */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "info" && (
        <div style={{ padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Basic Information</h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Product Name *</label><input style={inputStyle} value={String(form.name || "")} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><label style={labelStyle}>Slug</label><input style={inputStyle} value={String(form.slug || "")} onChange={e => setForm({ ...form, slug: e.target.value })} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Category</label><input style={inputStyle} value={String(form.category || "")} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
              <div><label style={labelStyle}>Brand</label><input style={inputStyle} value={String(form.brand || "Queens Care")} onChange={e => setForm({ ...form, brand: e.target.value })} /></div>
              <div><label style={labelStyle}>SKU</label><input style={inputStyle} value={String(form.sku || form.slug || "")} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
            </div>
            <div><label style={labelStyle}>Short Description</label><input style={inputStyle} value={String(form.shortDescription || "")} onChange={e => setForm({ ...form, shortDescription: e.target.value })} /></div>
            <div><label style={labelStyle}>Full Description</label><textarea style={{ ...inputStyle, minHeight: 100 }} value={String(form.description || "")} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><label style={labelStyle}>Benefits (comma separated)</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={Array.isArray(form.benefits) ? form.benefits.join(", ") : String(form.benefits || "")} onChange={e => setForm({ ...form, benefits: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="Visible radiance, Antioxidant shield..." /></div>
            <div><label style={labelStyle}>Ingredients</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.ingredients || "")} onChange={e => setForm({ ...form, ingredients: e.target.value })} /></div>
            <div><label style={labelStyle}>Usage / Directions</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.usage || "")} onChange={e => setForm({ ...form, usage: e.target.value })} /></div>
            <div><label style={labelStyle}>Safety / Warnings</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.safetyInfo || "")} onChange={e => setForm({ ...form, safetyInfo: e.target.value })} /></div>
            <div><label style={labelStyle}>Tags</label><input style={inputStyle} value={String(form.tags || "")} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="serum, vitamin c, skincare (comma separated)" /></div>
            {/* ── BADGES ── */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12, marginTop: 4 }}>
              <label style={{ ...labelStyle, marginBottom: 8, display: "block", fontSize: 12 }}>Product Badges</label>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
                <label><input type="checkbox" checked={!!form.bestSeller} onChange={e => setForm({ ...form, bestSeller: e.target.checked })} /> 🏆 Best Seller</label>
                <label><input type="checkbox" checked={!!form.newArrival} onChange={e => setForm({ ...form, newArrival: e.target.checked })} /> 🆕 New Arrival</label>
                <label><input type="checkbox" checked={!!form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> ⭐ Featured</label>
                <label><input type="checkbox" checked={!!form.trending} onChange={e => setForm({ ...form, trending: e.target.checked })} /> 📈 Trending</label>
                <label><input type="checkbox" checked={!!form.recommended} onChange={e => setForm({ ...form, recommended: e.target.checked })} /> 👍 Recommended</label>
                <label><input type="checkbox" checked={!!form.limitedStock} onChange={e => setForm({ ...form, limitedStock: e.target.checked })} /> ⚡ Limited Stock</label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: IMAGES */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "images" && (
        <div style={{ padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 4, color: "var(--purple)" }}>
            Product Images ({images.length})
          </h4>
          <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
            The first image is the primary/main image. Drag to reorder. All images appear in the product gallery.
          </p>
          <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 14, padding: "6px 10px", background: "#fff", border: "1px solid var(--line)" }}>
            📐 Recommended: <strong>1500 × 1500 px</strong> · Ratio: <strong>1:1</strong> · Formats: <strong>JPG, PNG, WEBP, GIF</strong> · Max: <strong>10 MB</strong>
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            <label style={{ padding: "10px 16px", background: "var(--gold)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
              📤 Upload Image
              <input type="file" accept="image/*" multiple hidden onChange={async e => {
                if (!e.target.files?.length) return;
                const urls = await uploadFiles(e.target.files, "products");
                if (urls.length) setImages([...images, ...urls]);
                e.target.value = "";
              }} />
            </label>
            <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center" }}>or paste a URL:</span>
            <input style={{ ...inputStyle, flex: 1, minWidth: 200 }} value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..." onKeyDown={e => e.key === "Enter" && addImage()} />
            <button onClick={addImage}
              style={{ padding: "10px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Add URL</button>
          </div>
          {images.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
              {images.map((url, idx) => (
                <div key={idx} style={{ border: "2px solid " + (idx === 0 ? "var(--gold)" : "var(--line)"), padding: 8, background: "#fff", position: "relative" }}>
                  {idx === 0 && <span style={{ fontSize: 9, fontWeight: 700, background: "var(--gold)", color: "#fff", padding: "2px 8px", position: "absolute", top: 8, left: 8, letterSpacing: ".05em" }}>★ PRIMARY</span>}
                  <div style={{ height: 120, background: `url(${url}) center/contain no-repeat #f5f0eb`, marginBottom: 6, borderRadius: 2 }} />
                  <p style={{ fontSize: 9, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "0 0 6px" }}>{url}</p>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => moveImage(idx, -1)} disabled={idx === 0} title="Move left" style={{ flex: 1, fontSize: 11, padding: "4px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>◀</button>
                    <button onClick={() => moveImage(idx, 1)} disabled={idx === images.length - 1} title="Move right" style={{ flex: 1, fontSize: 11, padding: "4px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>▶</button>
                    <button onClick={() => removeImage(idx)} title="Remove image" style={{ flex: 1, fontSize: 11, padding: "4px", border: "1px solid #e2c3c3", background: "#fff", color: "#b34141", cursor: "pointer" }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", border: "2px dashed var(--line)", color: "var(--muted)" }}>
              <p style={{ fontSize: 14 }}>No images yet. Paste an image URL above to add.</p>
              <p style={{ fontSize: 12 }}>Supports any image URL (Unsplash, Cloudinary, uploaded files, etc.)</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: MEDIA & CONTENT */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "media" && (
        <div style={{ padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 6, color: "var(--purple)" }}>Video & 3D Model</h4>
          <p style={{ fontSize: 10, color: "var(--muted)", marginBottom: 14, padding: "6px 10px", background: "#fff", border: "1px solid var(--line)" }}>
            🎬 Video recommended: <strong>1920 × 1080 px</strong> · Formats: <strong>MP4, WEBP</strong> · Max: <strong>100 MB</strong>
          </p>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={labelStyle}>Product Video (Upload or URL)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                <label style={{ padding: "10px 16px", background: "var(--gold)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  📤 Upload Video
                  <input type="file" accept="video/*" hidden onChange={async e => {
                    if (!e.target.files?.length) return;
                    const urls = await uploadFiles(e.target.files, "products");
                    if (urls.length) setForm({ ...form, video: urls[0] });
                    e.target.value = "";
                  }} />
                </label>
                <span style={{ fontSize: 11, color: "var(--muted)", alignSelf: "center" }}>or paste a URL:</span>
              </div>
              <input style={inputStyle} value={String(form.video || "")} onChange={e => setForm({ ...form, video: e.target.value })}
                placeholder="https://youtube.com/watch?v=... or uploaded video path" />
              {Boolean(form.video) && (
                <div style={{ marginTop: 8 }}>
                  {String(form.video).includes(".mp4") || String(form.video).includes(".webm") ? (
                    <video src={String(form.video)} controls style={{ width: "100%", maxHeight: 300, background: "#000" }} poster={String(form.videoPoster || "")} />
                  ) : (
                    <p style={{ fontSize: 11, color: "#4caf50" }}>✓ Video URL set — will appear on public product page</p>
                  )}
                </div>
              )}
            </div>
            <div>
              <label style={labelStyle}>Video Thumbnail / Poster (optional)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ padding: "8px 14px", background: "var(--gold)", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                  📤 Upload Thumbnail
                  <input type="file" accept="image/*" hidden onChange={async e => {
                    if (!e.target.files?.length) return;
                    const urls = await uploadFiles(e.target.files, "products");
                    if (urls.length) setForm({ ...form, videoPoster: urls[0] });
                    e.target.value = "";
                  }} />
                </label>
                <input style={{ ...inputStyle, flex: 1 }} value={String(form.videoPoster || "")} onChange={e => setForm({ ...form, videoPoster: e.target.value })}
                  placeholder="Poster/thumbnail URL" />
              </div>
            </div>
            <div>
              <label style={labelStyle}>3D Model URL (GLB / GLTF)</label>
              <input style={inputStyle} value={String(form.modelUrl || "")} onChange={e => setForm({ ...form, modelUrl: e.target.value })}
                placeholder="/models/product.glb" />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: PRICING & INVENTORY */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "pricing" && (
        <div style={{ padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Pricing & Inventory</h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Selling Price (₹)</label><input type="number" style={inputStyle} value={Number(form.price || 0)} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
              <div><label style={labelStyle}>MRP (₹)</label><input type="number" style={inputStyle} value={Number(form.mrp || 0)} onChange={e => setForm({ ...form, mrp: Number(e.target.value) })} /></div>
              <div><label style={labelStyle}>Discount %</label><input type="number" style={inputStyle} value={Number(form.discount || 0)} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
              <div><label style={labelStyle}>Tax/GST %</label><input type="number" style={inputStyle} value={Number(form.taxRate || 18)} onChange={e => setForm({ ...form, taxRate: Number(e.target.value) })} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Stock Quantity</label><input type="number" style={inputStyle} value={Number(form.stock || 0)} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></div>
              <div><label style={labelStyle}>Low Stock Threshold</label><input type="number" style={inputStyle} value={Number(form.lowStockThreshold || 10)} onChange={e => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} /></div>
              <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}><label style={{ fontSize: 13 }}><input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label></div>
              <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}><label style={{ fontSize: 13 }}><input type="checkbox" checked={form.visible !== false} onChange={e => setForm({ ...form, visible: e.target.checked })} /> Visible</label></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}><label style={{ fontSize: 13 }}><input type="checkbox" checked={!!form.homepageVisible} onChange={e => setForm({ ...form, homepageVisible: e.target.checked })} /> Show on Homepage</label></div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: SPECIFICATIONS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "specs" && (
        <div style={{ padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h4 style={{ font: "14px var(--font-display)", color: "var(--purple)", margin: 0 }}>
              Specifications ({specs.length} rows)
            </h4>
            <button onClick={addSpec}
              style={{ padding: "8px 14px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Add Row</button>
          </div>
          {specs.length > 0 ? specs.map((spec, idx) => (
            <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 8 }}>
              <input style={inputStyle} value={spec.name} onChange={e => updateSpec(idx, "name", e.target.value)} placeholder="Specification name (e.g. Pack Size)" />
              <input style={inputStyle} value={spec.value} onChange={e => updateSpec(idx, "value", e.target.value)} placeholder="Value (e.g. 30ml)" />
              <button onClick={() => removeSpec(idx)} style={{ padding: "4px 10px", border: "1px solid #e2c3c3", background: "#fff", color: "#b34141", cursor: "pointer", fontSize: 11 }}>✕</button>
            </div>
          )) : (
            <div style={{ padding: 30, textAlign: "center", border: "2px dashed var(--line)", color: "var(--muted)" }}>
              <p style={{ fontSize: 14 }}>No specifications yet. Click "+ Add Row" to add product specs.</p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: A+ CONTENT ★ ★ ★ THE MAIN FEATURE ★ ★ ★ */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "aplus" && (
        <div style={{ padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
          {/* ── PRODUCT ASSIGNMENT HEADER ── */}
          <div style={{ padding: 16, background: "#fff", border: "2px solid " + (aplusPublished ? "#2e7d32" : "var(--line)"), marginBottom: 20, borderRadius: 4 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ fontSize: 11, textTransform: "uppercase" as const, letterSpacing: ".08em", color: "var(--muted)", margin: 0 }}>A+ Content for:</p>
                <h4 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "4px 0 0" }}>{String(form.name || "Untitled Product")}</h4>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>/products/{String(form.slug || "product-slug")}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: aplusPublished ? "#2e7d32" : "#d4ad65", display: "inline-block" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: aplusPublished ? "#2e7d32" : "#8a6d3b", textTransform: "uppercase" as const, letterSpacing: ".06em" }}>
                    {aplusPublished ? "PUBLISHED" : "DRAFT"}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: "2px 0 0" }}>
                  {aplusSections.length} section{aplusSections.length !== 1 ? "s" : ""} · {aplusSections.filter(s => s.published !== false).length} visible
                </p>
              </div>
            </div>
            {/* ── PUBLISH CONTROLS ── */}
            <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 12, flexWrap: "wrap" }}>
              <button onClick={() => { save(); setAplusSavedMsg("Saved!"); setTimeout(() => setAplusSavedMsg(""), 2000); }}
                style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                💾 Save A+ Content
              </button>
              <a href={`/products/${String(form.slug || "")}`} target="_blank" rel="noopener noreferrer"
                style={{ padding: "8px 16px", background: "#fff", color: "var(--purple)", border: "1px solid var(--purple)", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                👁️ Preview on Public Page
              </a>
              {!aplusPublished ? (
                <button onClick={() => { setAplusPublished(true); setForm({ ...form, aplusPublished: true }); setAplusSavedMsg("Published! Save to persist."); setTimeout(() => setAplusSavedMsg(""), 3000); }}
                  style={{ padding: "8px 16px", background: "#2e7d32", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  ✅ Publish A+ Content
                </button>
              ) : (
                <button onClick={() => { setAplusPublished(false); setForm({ ...form, aplusPublished: false }); setAplusSavedMsg("Unpublished. Save to persist."); setTimeout(() => setAplusSavedMsg(""), 3000); }}
                  style={{ padding: "8px 16px", background: "#b34141", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                  🚫 Unpublish A+ Content
                </button>
              )}
            </div>
            {aplusSavedMsg && (
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#2e7d32", fontWeight: 600 }}>{aplusSavedMsg}</p>
            )}
            <p style={{ fontSize: 11, color: "var(--muted)", margin: "8px 0 0" }}>
              This A+ Content is attached to <strong>{String(form.name || "this product")}</strong> and appears on its public product detail page below the main product information.
            </p>
          </div>

          {/* ── SECTION TYPE PICKER ── */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20, padding: 14, background: "#fff", border: "1px solid var(--line)" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", alignSelf: "center", marginRight: 4 }}>ADD SECTION:</span>
            {APLUS_TYPES.map(t => (
              <button key={t.value} onClick={() => addAplusSection(t.value)}
                style={{
                  padding: "6px 12px", background: "var(--purple)", color: "#fff", border: "none",
                  cursor: "pointer", fontSize: 11, fontWeight: 600, borderRadius: 4,
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* ── SECTION LIST ── */}
          {aplusSections.length > 0 ? (
            <div style={{ display: "grid", gap: 0 }}>
              {aplusSections.map((sec, idx) => {
                const typeConfig = APLUS_TYPES.find(t => t.value === sec.type) || { label: sec.type, icon: "?" };
                const isExpanded = aplusExpanded === idx;
                return (
                  <div key={idx} style={{
                    border: "1px solid var(--line)", borderTop: idx === 0 ? "1px solid var(--line)" : "none",
                    background: "#fff",
                  }}>
                    {/* ── Section Header (always visible, clickable) ── */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", cursor: "pointer",
                      background: isExpanded ? "#f5f0eb" : "transparent",
                      borderBottom: isExpanded ? "1px solid var(--line)" : "none",
                    }} onClick={() => setAplusExpanded(isExpanded ? null : idx)}>
                      <span style={{ fontSize: 10, color: "var(--muted)", minWidth: 20 }}>#{idx + 1}</span>
                      <span style={{ fontSize: 14 }}>{typeConfig.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>
                        {sec.heading || typeConfig.label}
                        {sec.heading && <span style={{ fontWeight: 400, color: "var(--muted)", marginLeft: 6 }}>({typeConfig.label})</span>}
                      </span>
                      <span style={{
                        fontSize: 9, padding: "2px 8px", borderRadius: 3,
                        background: sec.published !== false ? "#e9f7e9" : "#fde8e8",
                        color: sec.published !== false ? "#2e7d32" : "#b34141",
                        textTransform: "uppercase" as const, letterSpacing: ".05em",
                      }}>
                        {sec.published !== false ? "PUBLISHED" : "DRAFT"}
                      </span>
                      <div style={{ display: "flex", gap: 2 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => moveAplus(idx, -1)} disabled={idx === 0} title="Move up" style={{ fontSize: 10, padding: "3px 6px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>▲</button>
                        <button onClick={() => moveAplus(idx, 1)} disabled={idx === aplusSections.length - 1} title="Move down" style={{ fontSize: 10, padding: "3px 6px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>▼</button>
                        <button onClick={() => removeAplus(idx)} title="Delete section" style={{ fontSize: 10, padding: "3px 6px", border: "1px solid #e2c3c3", background: "#fff", color: "#b34141", cursor: "pointer" }}>✕</button>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--muted)" }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>

                    {/* ── Section Editor (expanded) ── */}
                    {isExpanded && (
                      <div style={{ padding: 16, background: "#faf9f7" }}>
                        <div style={{ display: "grid", gap: 10 }}>
                          {/* Published toggle */}
                          <div>
                            <label style={{ fontSize: 12 }}>
                              <input type="checkbox" checked={sec.published !== false} onChange={e => updateAplus(idx, { published: e.target.checked })} />
                              {" "}Published (visible on public product page)
                            </label>
                          </div>

                          {/* Heading */}
                          <div>
                            <label style={labelStyle}>Section Heading</label>
                            <input style={inputStyle} value={sec.heading || ""} onChange={e => updateAplus(idx, { heading: e.target.value })}
                              placeholder="e.g. Why Choose Lumine-C" />
                          </div>

                          {/* Type-specific fields */}
                          {(sec.type === "hero" || sec.type === "fullWidth") && (
                            <>
                              <div>
                                <label style={labelStyle}>Media — Image or Video</label>
                                <p style={{ fontSize: 10, color: "var(--muted)", margin: "0 0 6px" }}>
                                  📐 Recommended: <strong>1464 × 600 px</strong> · Ratio: <strong>~2.4:1</strong> · Formats: <strong>JPG, PNG, WEBP, GIF, MP4</strong> · Max: <strong>10 MB</strong>
                                </p>
                                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                  <label style={{ padding: "8px 14px", background: "var(--gold)", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                                    📤 Upload Image
                                    <input type="file" accept="image/*" hidden onChange={async e => {
                                      if (!e.target.files?.length) return;
                                      const urls = await uploadFiles(e.target.files, "products");
                                      if (urls.length) updateAplus(idx, { imageUrl: urls[0] });
                                      e.target.value = "";
                                    }} />
                                  </label>
                                  <label style={{ padding: "8px 14px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
                                    📤 Upload Video
                                    <input type="file" accept="video/*" hidden onChange={async e => {
                                      if (!e.target.files?.length) return;
                                      const urls = await uploadFiles(e.target.files, "products");
                                      if (urls.length) updateAplus(idx, { videoUrl: urls[0], imageUrl: "" });
                                      e.target.value = "";
                                    }} />
                                  </label>
                                </div>
                                <input style={inputStyle} value={sec.imageUrl || sec.videoUrl || ""} onChange={e => {
                                  const val = e.target.value;
                                  if (val.includes(".mp4") || val.includes(".webm")) updateAplus(idx, { videoUrl: val, imageUrl: "" });
                                  else updateAplus(idx, { imageUrl: val, videoUrl: "" });
                                }}
                                  placeholder="Image URL or Video URL" />
                                {sec.imageUrl && <img src={sec.imageUrl} alt={sec.imageAlt || ""} style={{ width: "100%", maxHeight: 200, objectFit: "cover", marginTop: 8, border: "1px solid var(--line)" }} />}
                                {sec.videoUrl && !sec.imageUrl && (
                                  <video src={sec.videoUrl} controls style={{ width: "100%", maxHeight: 200, marginTop: 8, background: "#000" }} />
                                )}
                              </div>
                              <div>
                                <label style={labelStyle}>Alt Text</label>
                                <input style={inputStyle} value={sec.imageAlt || ""} onChange={e => updateAplus(idx, { imageAlt: e.target.value })} placeholder="Describe the image" />
                              </div>
                              <div>
                                <label style={labelStyle}>Overlay Text (optional)</label>
                                <input style={inputStyle} value={sec.text || ""} onChange={e => updateAplus(idx, { text: e.target.value })} placeholder="Text overlay on the hero image" />
                              </div>
                            </>
                          )}

                          {sec.type === "imageText" && (
                            <>
                              <p style={{ fontSize: 10, color: "var(--muted)", margin: "0 0 8px" }}>
                                📐 Recommended: <strong>732 × 600 px</strong> · Ratio: <strong>~1.2:1</strong> · Formats: <strong>JPG, PNG, WEBP, GIF</strong>
                              </p>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                <div>
                                  <label style={labelStyle}>Image</label>
                                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                    <label style={{ padding: "6px 12px", background: "var(--gold)", color: "#fff", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                                      📤 Upload
                                      <input type="file" accept="image/*,video/*" hidden onChange={async e => {
                                        if (!e.target.files?.length) return;
                                        const urls = await uploadFiles(e.target.files, "products");
                                        if (urls.length) updateAplus(idx, { imageUrl: urls[0] });
                                        e.target.value = "";
                                      }} />
                                    </label>
                                  </div>
                                  <input style={inputStyle} value={sec.imageUrl || ""} onChange={e => updateAplus(idx, { imageUrl: e.target.value })} placeholder="Image URL" />
                                  {sec.imageUrl && <img src={sec.imageUrl} alt={sec.imageAlt || ""} style={{ width: "100%", maxHeight: 150, objectFit: "cover", marginTop: 8, border: "1px solid var(--line)" }} />}
                                </div>
                                <div>
                                  <label style={labelStyle}>Alt Text</label>
                                  <input style={inputStyle} value={sec.imageAlt || ""} onChange={e => updateAplus(idx, { imageAlt: e.target.value })} placeholder="Image description" />
                                </div>
                              </div>
                              <div>
                                <label style={labelStyle}>Text Content</label>
                                <textarea style={{ ...inputStyle, minHeight: 80 }} value={sec.text || ""} onChange={e => updateAplus(idx, { text: e.target.value })}
                                  placeholder="Describe the product feature, benefit, or story..." />
                              </div>
                            </>
                          )}

                          {sec.type === "richText" && (
                            <>
                              <div>
                                <label style={labelStyle}>Rich Text Content (HTML supported)</label>
                                <textarea style={{ ...inputStyle, minHeight: 120, fontFamily: "monospace", fontSize: 12 }} value={sec.text || ""} onChange={e => updateAplus(idx, { text: e.target.value })}
                                  placeholder="Write your editorial content here. HTML tags like &lt;h2&gt;, &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;ul&gt;, &lt;li&gt; are supported." />
                              </div>
                              <div>
                                <label style={labelStyle}>Image (optional)</label>
                                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                  <label style={{ padding: "6px 12px", background: "var(--gold)", color: "#fff", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                                    📤 Upload Image
                                    <input type="file" accept="image/*" hidden onChange={async e => {
                                      if (!e.target.files?.length) return;
                                      const urls = await uploadFiles(e.target.files, "products");
                                      if (urls.length) updateAplus(idx, { imageUrl: urls[0] });
                                      e.target.value = "";
                                    }} />
                                  </label>
                                </div>
                                <input style={inputStyle} value={sec.imageUrl || ""} onChange={e => updateAplus(idx, { imageUrl: e.target.value })} placeholder="Image URL (or use upload button)" />
                                {sec.imageUrl && <img src={sec.imageUrl} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", marginTop: 8, border: "1px solid var(--line)" }} />}
                              </div>
                            </>
                          )}

                          {(sec.type === "benefits" || sec.type === "features" || sec.type === "highlights") && (
                            <>
                              <div>
                                <label style={labelStyle}>Items (one per line — each becomes a card/tile)</label>
                                <textarea style={{ ...inputStyle, minHeight: 100 }} value={(sec.items || []).join("\n")} onChange={e => updateAplus(idx, { items: e.target.value.split("\n").filter(Boolean) })}
                                  placeholder="Clinically tested ingredients&#10;Third-party verified&#10;No parabens or sulfates&#10;Made in India" />
                              </div>
                              <div>
                                <label style={labelStyle}>Image (optional, shown above items)</label>
                                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                  <label style={{ padding: "6px 12px", background: "var(--gold)", color: "#fff", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                                    📤 Upload Image
                                    <input type="file" accept="image/*" hidden onChange={async e => {
                                      if (!e.target.files?.length) return;
                                      const urls = await uploadFiles(e.target.files, "products");
                                      if (urls.length) updateAplus(idx, { imageUrl: urls[0] });
                                      e.target.value = "";
                                    }} />
                                  </label>
                                </div>
                                <input style={inputStyle} value={sec.imageUrl || ""} onChange={e => updateAplus(idx, { imageUrl: e.target.value })} placeholder="Image URL (or use upload button)" />
                                {sec.imageUrl && <img src={sec.imageUrl} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", marginTop: 8, border: "1px solid var(--line)" }} />}
                              </div>
                            </>
                          )}

                          {sec.type === "comparison" && (
                            <>
                              <div>
                                <label style={labelStyle}>Comparison Items (one per line — each becomes a column/card)</label>
                                <textarea style={{ ...inputStyle, minHeight: 100 }} value={(sec.items || []).join("\n")} onChange={e => updateAplus(idx, { items: e.target.value.split("\n").filter(Boolean) })}
                                  placeholder="Lumine-C: 15% Vitamin C, ₹899, 30ml&#10;Competitor A: 10% Vitamin C, ₹1200, 30ml&#10;Competitor B: 5% Vitamin C, ₹750, 30ml" />
                              </div>
                              <div>
                                <label style={labelStyle}>Description text (optional)</label>
                                <textarea style={{ ...inputStyle, minHeight: 60 }} value={sec.text || ""} onChange={e => updateAplus(idx, { text: e.target.value })}
                                  placeholder="Why our product stands out..." />
                              </div>
                            </>
                          )}

                          {sec.type === "video" && (
                            <>
                              <div>
                                <label style={labelStyle}>Video (Upload or URL)</label>
                                <p style={{ fontSize: 10, color: "var(--muted)", margin: "0 0 6px" }}>
                                  🎬 Recommended: <strong>1920 × 1080 px</strong> · Formats: <strong>MP4, WEBP</strong> · Max: <strong>100 MB</strong>
                                </p>
                                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                                  <label style={{ padding: "6px 12px", background: "var(--gold)", color: "#fff", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                                    📤 Upload Video
                                    <input type="file" accept="video/*" hidden onChange={async e => {
                                      if (!e.target.files?.length) return;
                                      const urls = await uploadFiles(e.target.files, "products");
                                      if (urls.length) updateAplus(idx, { videoUrl: urls[0] });
                                      e.target.value = "";
                                    }} />
                                  </label>
                                </div>
                                <input style={inputStyle} value={sec.videoUrl || ""} onChange={e => updateAplus(idx, { videoUrl: e.target.value })}
                                  placeholder="Video URL (YouTube / Vimeo / uploaded file)" />
                                {sec.videoUrl && (sec.videoUrl.includes(".mp4") || sec.videoUrl.includes(".webm") || sec.videoUrl.startsWith("/uploads")) ? (
                                  <video src={sec.videoUrl} controls style={{ width: "100%", maxHeight: 200, marginTop: 8, background: "#000" }} />
                                ) : sec.videoUrl ? (
                                  <p style={{ fontSize: 11, color: "#4caf50", marginTop: 4 }}>✓ Video URL set</p>
                                ) : null}
                              </div>
                              <div>
                                <label style={labelStyle}>Video Thumbnail / Poster (optional)</label>
                                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                  <label style={{ padding: "6px 12px", background: "var(--gold)", color: "#fff", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                                    📤 Upload
                                    <input type="file" accept="image/*" hidden onChange={async e => {
                                      if (!e.target.files?.length) return;
                                      const urls = await uploadFiles(e.target.files, "products");
                                      if (urls.length) updateAplus(idx, { imageUrl: urls[0] });
                                      e.target.value = "";
                                    }} />
                                  </label>
                                </div>
                                <input style={inputStyle} value={sec.imageUrl || ""} onChange={e => updateAplus(idx, { imageUrl: e.target.value })}
                                  placeholder="Poster/thumbnail URL" />
                                {sec.imageUrl && <img src={sec.imageUrl} alt="" style={{ width: "100%", maxHeight: 120, objectFit: "cover", marginTop: 8, border: "1px solid var(--line)" }} />}
                              </div>
                              <div>
                                <label style={labelStyle}>Caption / Description</label>
                                <input style={inputStyle} value={sec.text || ""} onChange={e => updateAplus(idx, { text: e.target.value })}
                                  placeholder="Watch how Lumine-C transforms your skin..." />
                              </div>
                            </>
                          )}

                          {sec.type === "cta" && (
                            <>
                              <div>
                                <label style={labelStyle}>CTA Text / Button Label</label>
                                <input style={inputStyle} value={sec.ctaText || ""} onChange={e => updateAplus(idx, { ctaText: e.target.value })}
                                  placeholder="Shop Now" />
                              </div>
                              <div>
                                <label style={labelStyle}>CTA Link / URL</label>
                                <input style={inputStyle} value={sec.ctaLink || ""} onChange={e => updateAplus(idx, { ctaLink: e.target.value })}
                                  placeholder="/shop or https://..." />
                              </div>
                              <div>
                                <label style={labelStyle}>Background Image</label>
                                <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                                  <label style={{ padding: "6px 12px", background: "var(--gold)", color: "#fff", border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                                    📤 Upload
                                    <input type="file" accept="image/*" hidden onChange={async e => {
                                      if (!e.target.files?.length) return;
                                      const urls = await uploadFiles(e.target.files, "products");
                                      if (urls.length) updateAplus(idx, { imageUrl: urls[0] });
                                      e.target.value = "";
                                    }} />
                                  </label>
                                </div>
                                <input style={inputStyle} value={sec.imageUrl || ""} onChange={e => updateAplus(idx, { imageUrl: e.target.value })}
                                  placeholder="Background image URL" />
                                {sec.imageUrl && <img src={sec.imageUrl} alt="" style={{ width: "100%", maxHeight: 120, objectFit: "cover", marginTop: 8, border: "1px solid var(--line)" }} />}
                              </div>
                              <div>
                                <label style={labelStyle}>Description text</label>
                                <textarea style={{ ...inputStyle, minHeight: 60 }} value={sec.text || ""} onChange={e => updateAplus(idx, { text: e.target.value })}
                                  placeholder="Discover the complete Queens Care range..." />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", border: "2px dashed var(--line)", color: "var(--muted)" }}>
              <p style={{ fontSize: 16, marginBottom: 8 }}>✨ No A+ Content yet</p>
              <p style={{ fontSize: 13 }}>Click any section type above to start building your enhanced product description.</p>
              <p style={{ fontSize: 12, marginTop: 8 }}>A+ Content appears below the main product information on the public product page.</p>
            </div>
          )}

          {/* ── STATUS FOOTER ── */}
          {aplusSections.length > 0 && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: aplusPublished ? "#e9f7e9" : "#fdf6e3", border: aplusPublished ? "1px solid #c3e6cb" : "1px solid #e8d5a3", fontSize: 12, color: aplusPublished ? "#2e7d32" : "#8a6d3b" }}>
              {aplusPublished ? "✅" : "⚠️"} A+ Content is <strong>{aplusPublished ? "PUBLISHED" : "in DRAFT"}</strong> for this product.
              {aplusPublished
                ? ` ${aplusSections.filter(s => s.published !== false).length} of ${aplusSections.length} sections visible on the public page.`
                : ` Only you (the admin) can see this content. Publish it to make it visible on /products/${String(form.slug || "...")}.`}
            </div>
          )}
          {aplusSections.length === 0 && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: "#fdf6e3", border: "1px solid #e8d5a3", fontSize: 12, color: "#8a6d3b" }}>
              ⚠️ No A+ sections added yet. Click any section type above to start building. Then Save and Publish to make it visible on the public product page.
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* TAB: SEO */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "seo" && (
        <div style={{ padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
          <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>SEO & Visibility</h4>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>SEO Title</label><input style={inputStyle} value={String(form.seoTitle || "")} onChange={e => setForm({ ...form, seoTitle: e.target.value })} placeholder="Product name — Queens Care" /></div>
              <div><label style={labelStyle}>SEO Description</label><input style={inputStyle} value={String(form.seoDescription || "")} onChange={e => setForm({ ...form, seoDescription: e.target.value })} placeholder="Short description for search engines" /></div>
            </div>
            <div>
              <label style={labelStyle}>OG Image URL</label>
              <input style={inputStyle} value={String(form.seoOgImage || "")} onChange={e => setForm({ ...form, seoOgImage: e.target.value })} placeholder="https://..." />
            </div>
          </div>
        </div>
      )}

      {/* ── BOTTOM SAVE ── */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          {images.length} images · {specs.length} specs · {aplusSections.length} A+ sections
        </p>
        <button onClick={save} disabled={saving}
          style={{ padding: "12px 32px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
          {saving ? "Saving…" : "💾 Save Product"}
        </button>
      </div>
    </div>
  );
}
