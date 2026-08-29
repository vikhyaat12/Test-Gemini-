"use client";

import { useState } from "react";

/* ─── ENHANCED PRODUCT EDIT FORM ────────────────────────────────────────── */

type SpecRow = { name: string; value: string };

export function ProductEditFormAdvanced({ item, onSave }: { item: Record<string, unknown>; onSave: () => void }) {
  const [form, setForm] = useState(item);
  const [specs, setSpecs] = useState<SpecRow[]>(() => {
    try { return JSON.parse(String(form.specifications || "[]")); } catch { return []; }
  });
  const [images, setImages] = useState<string[]>(() => {
    const img = form.images || form.gallery;
    if (Array.isArray(img)) return img;
    return form.image ? [String(form.image)] : [];
  });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 };
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4 };

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

  const addSpec = () => setSpecs([...specs, { name: "", value: "" }]);
  const updateSpec = (idx: number, field: keyof SpecRow, val: string) => {
    const arr = [...specs];
    arr[idx] = { ...arr[idx], [field]: val };
    setSpecs(arr);
  };
  const removeSpec = (idx: number) => setSpecs(specs.filter((_, i) => i !== idx));

  const save = async () => {
    setSaving(true);
    const id = String(form.id);
    const payload = {
      ...form,
      images: images,
      image: images[0] || form.image,
      specifications: JSON.stringify(specs),
    };
    try {
      const res = await fetch(`/api/products/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      if (res.ok) { setMsg("Product saved!"); setTimeout(onSave, 500); }
      else { setMsg("Failed to save."); }
    } catch { setMsg("Network error."); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <h3 style={{ font: "20px var(--font-display)", marginBottom: 20 }}>Edit Product</h3>
      {msg && <p style={{ padding: "8px 12px", background: "#e9f7e9", fontSize: 12, color: "#2e7d32", marginBottom: 16 }}>{msg}</p>}
      
      {/* BASIC INFO */}
      <div style={{ marginBottom: 24, padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
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
          <div><label style={labelStyle}>Benefits</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.benefits || "")} onChange={e => setForm({ ...form, benefits: e.target.value })} placeholder="Key product benefits..." /></div>
          <div><label style={labelStyle}>Tags</label><input style={inputStyle} value={String(form.tags || "")} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="serum, vitamin c, skincare (comma separated)" /></div>
        </div>
      </div>

      {/* PRICING & INVENTORY */}
      <div style={{ marginBottom: 24, padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
        <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Pricing & Inventory</h4>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Selling Price (₹)</label><input type="number" style={inputStyle} value={Number(form.price || 0)} onChange={e => setForm({ ...form, price: Number(e.target.value) })} /></div>
            <div><label style={labelStyle}>MRP (₹)</label><input type="number" style={inputStyle} value={Number(form.mrp || 0)} onChange={e => setForm({ ...form, mrp: Number(e.target.value) })} /></div>
            <div><label style={labelStyle}>Discount %</label><input type="number" style={inputStyle} value={Number(form.discount || 0)} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
            <div><label style={labelStyle}>Tax/GST %</label><input type="number" style={inputStyle} value={Number(form.taxRate || 18)} onChange={e => setForm({ ...form, taxRate: Number(e.target.value) })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Stock Quantity</label><input type="number" style={inputStyle} value={Number(form.stock || 0)} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></div>
            <div><label style={labelStyle}>Low Stock Threshold</label><input type="number" style={inputStyle} value={Number(form.lowStockThreshold || 10)} onChange={e => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} /></div>
            <div style={{ display: "flex", alignItems: "end", paddingBottom: 4 }}>
              <label style={{ fontSize: 13 }}><input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label>
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT IMAGES */}
      <div style={{ marginBottom: 24, padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
        <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Product Images ({images.length})</h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, marginBottom: 12 }}>
          <input style={inputStyle} value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="Paste image URL and click Add" onKeyDown={e => e.key === "Enter" && addImage()} />
          <button onClick={addImage} style={{ padding: "10px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>+ Add</button>
        </div>
        {images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {images.map((url, idx) => (
              <div key={idx} style={{ border: "1px solid var(--line)", padding: 8, background: "#fff", position: "relative" }}>
                <div style={{ height: 100, background: `url(${url}) center/cover no-repeat`, marginBottom: 6 }} />
                {idx === 0 && <span style={{ fontSize: 9, background: "var(--purple)", color: "#fff", padding: "2px 6px", position: "absolute", top: 12, left: 12 }}>PRIMARY</span>}
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => moveImage(idx, -1)} disabled={idx === 0} style={{ flex: 1, fontSize: 10, padding: "2px 4px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>←</button>
                  <button onClick={() => moveImage(idx, 1)} disabled={idx === images.length - 1} style={{ flex: 1, fontSize: 10, padding: "2px 4px", border: "1px solid #ddd", background: "#fff", cursor: "pointer" }}>→</button>
                  <button onClick={() => removeImage(idx)} style={{ flex: 1, fontSize: 10, padding: "2px 4px", border: "1px solid #e2c3c3", background: "#fff", color: "#b34141", cursor: "pointer" }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {images.length === 0 && <p style={{ fontSize: 12, color: "var(--muted)" }}>No images added. Paste an image URL above.</p>}
      </div>

      {/* MEDIA */}
      <div style={{ marginBottom: 24, padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
        <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Media & Content</h4>
        <div style={{ display: "grid", gap: 12 }}>
          <div><label style={labelStyle}>Video URL (YouTube/Vimeo)</label><input style={inputStyle} value={String(form.video || "")} onChange={e => setForm({ ...form, video: e.target.value })} placeholder="https://youtube.com/watch?v=..." /></div>
          <div><label style={labelStyle}>3D Model URL (GLB/GLTF)</label><input style={inputStyle} value={String(form.modelUrl || "")} onChange={e => setForm({ ...form, modelUrl: e.target.value })} placeholder="/models/product.glb" /></div>
          <div><label style={labelStyle}>Ingredients / Composition</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.ingredients || "")} onChange={e => setForm({ ...form, ingredients: e.target.value })} /></div>
          <div><label style={labelStyle}>Usage / Directions</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.usage || "")} onChange={e => setForm({ ...form, usage: e.target.value })} /></div>
          <div><label style={labelStyle}>Safety / Warnings</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.safetyInfo || "")} onChange={e => setForm({ ...form, safetyInfo: e.target.value })} /></div>
        </div>
      </div>

      {/* SPECIFICATIONS */}
      <div style={{ marginBottom: 24, padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h4 style={{ font: "14px var(--font-display)", color: "var(--purple)", margin: 0 }}>Specifications ({specs.length} rows)</h4>
          <button onClick={addSpec} style={{ padding: "6px 12px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 11 }}>+ Add Row</button>
        </div>
        {specs.map((spec, idx) => (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 8 }}>
            <input style={inputStyle} value={spec.name} onChange={e => updateSpec(idx, "name", e.target.value)} placeholder="Specification name" />
            <input style={inputStyle} value={spec.value} onChange={e => updateSpec(idx, "value", e.target.value)} placeholder="Value" />
            <button onClick={() => removeSpec(idx)} style={{ padding: "4px 10px", border: "1px solid #e2c3c3", background: "#fff", color: "#b34141", cursor: "pointer", fontSize: 11 }}>✕</button>
          </div>
        ))}
        {specs.length === 0 && <p style={{ fontSize: 12, color: "var(--muted)" }}>No specifications. Click "Add Row" to add.</p>}
      </div>

      {/* SEO */}
      <div style={{ marginBottom: 24, padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
        <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>SEO & Visibility</h4>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>SEO Title</label><input style={inputStyle} value={String(form.seoTitle || "")} onChange={e => setForm({ ...form, seoTitle: e.target.value })} /></div>
            <div><label style={labelStyle}>SEO Description</label><input style={inputStyle} value={String(form.seoDescription || "")} onChange={e => setForm({ ...form, seoDescription: e.target.value })} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, auto)", gap: 16, fontSize: 13 }}>
            <label><input type="checkbox" checked={!!form.active} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label>
            <label><input type="checkbox" checked={!!form.visible} onChange={e => setForm({ ...form, visible: e.target.checked })} /> Visible</label>
            <label><input type="checkbox" checked={!!form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
            <label><input type="checkbox" checked={!!form.homepageVisible} onChange={e => setForm({ ...form, homepageVisible: e.target.checked })} /> Homepage</label>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} style={{ padding: "12px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 }}>{saving ? "Saving…" : "Save Product →"}</button>
    </div>
  );
}
