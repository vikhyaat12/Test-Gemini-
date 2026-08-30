"use client";

import { useState } from "react";

const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 };
const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4 };

type SectionType = "hero" | "trust" | "collection" | "science" | "ritual" | "testimonial" | "newsletter" | "consult" | "banner" | "affiliate" | "heroVisual" | "custom";

const SECTION_TYPES: { value: SectionType; label: string }[] = [
  { value: "hero", label: "Hero Banner" },
  { value: "heroVisual", label: "Hero 3D Visual (LUMINE-C™)" },
  { value: "trust", label: "Trust Strip" },
  { value: "collection", label: "Product Collection" },
  { value: "science", label: "Science / Brand" },
  { value: "ritual", label: "Ritual / Category Cards" },
  { value: "testimonial", label: "Testimonial Quote" },
  { value: "newsletter", label: "Newsletter CTA" },
  { value: "consult", label: "Talk to Team" },
  { value: "affiliate", label: "Partnership / Affiliate" },
  { value: "banner", label: "Announcement Bar" },
  { value: "custom", label: "Custom Section" },
];

interface Props {
  item: Record<string, unknown>;
  onSave: () => void;
}

export default function HomepageSectionEdit({ item, onSave }: Props) {
  const [form, setForm] = useState(item);
  const [content, setContent] = useState<Record<string, unknown>>(() => {
    try { return typeof item.content === "string" ? JSON.parse(item.content as string) : (item.content as Record<string, unknown>) || {}; } catch { return {}; }
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async () => {
    setSaving(true);
    const method = form.isNew ? "POST" : "PATCH";
    const payload = { ...form, content, id: form.isNew ? undefined : form.id };
    try {
      const res = await fetch("/api/admin/homepage", { method, body: JSON.stringify(payload) });
      if (res.ok) { setMsg("Saved!"); setTimeout(onSave, 400); }
      else { const d = await res.json(); setMsg(d.error || "Failed."); }
    } catch { setMsg("Network error."); }
    setSaving(false);
  };

  const updateContent = (key: string, value: unknown) => setContent({ ...content, [key]: value });

  return (
    <div style={{ maxWidth: 800 }}>
      <h3 style={{ font: "20px var(--font-display)", marginBottom: 20 }}>{form.isNew ? "New Homepage Section" : "Edit Homepage Section"}</h3>
      {msg && <p style={{ padding: "8px 12px", background: "#e9f7e9", fontSize: 12, color: "#2e7d32", marginBottom: 16 }}>{msg}</p>}

      {/* BASIC FIELDS */}
      <div style={{ marginBottom: 24, padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
        <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Section Settings</h4>
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div><label style={labelStyle}>Section Title *</label><input style={inputStyle} value={String(form.title || "")} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><label style={labelStyle}>Type</label><select style={inputStyle} value={String(form.type || "custom")} onChange={e => setForm({ ...form, type: e.target.value })}>
              {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select></div>
            <div><label style={labelStyle}>Sort Order</label><input type="number" style={inputStyle} value={Number(form.sort || 0)} onChange={e => setForm({ ...form, sort: Number(e.target.value) })} /></div>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
            <label><input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active</label>
            <label><input type="checkbox" checked={form.visible !== false} onChange={e => setForm({ ...form, visible: e.target.checked })} /> Visible</label>
          </div>
        </div>
      </div>

      {/* TYPE-SPECIFIC CONTENT FIELDS */}
      <div style={{ marginBottom: 24, padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
        <h4 style={{ font: "14px var(--font-display)", marginBottom: 14, color: "var(--purple)" }}>Content</h4>

        {/* HERO */}
        {form.type === "hero" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div><label style={labelStyle}>Eyebrow</label><input style={inputStyle} value={String(content.eyebrow || "")} onChange={e => updateContent("eyebrow", e.target.value)} /></div>
            <div><label style={labelStyle}>Heading (supports &lt;em&gt; for italic)</label><input style={inputStyle} value={String(content.heading || "")} onChange={e => updateContent("heading", e.target.value)} /></div>
            <div><label style={labelStyle}>Subtitle</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(content.subtitle || "")} onChange={e => updateContent("subtitle", e.target.value)} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Primary CTA Text</label><input style={inputStyle} value={String(content.ctaText || "")} onChange={e => updateContent("ctaText", e.target.value)} /></div>
              <div><label style={labelStyle}>Primary CTA Link</label><input style={inputStyle} value={String(content.ctaLink || "")} onChange={e => updateContent("ctaLink", e.target.value)} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Secondary CTA Text</label><input style={inputStyle} value={String(content.secondaryText || "")} onChange={e => updateContent("secondaryText", e.target.value)} /></div>
              <div><label style={labelStyle}>Secondary CTA Link</label><input style={inputStyle} value={String(content.secondaryLink || "")} onChange={e => updateContent("secondaryLink", e.target.value)} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Rating Text</label><input style={inputStyle} value={String(content.rating || "")} onChange={e => updateContent("rating", e.target.value)} /></div>
              <div><label style={labelStyle}>Rating Count Text</label><input style={inputStyle} value={String(content.ratingCount || "")} onChange={e => updateContent("ratingCount", e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* HERO 3D VISUAL (LUMINE-C™) */}
        {form.type === "heroVisual" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>3D Visual Enabled</label>
              <button onClick={() => updateContent("enabled", !content.enabled)} style={{ padding: "6px 14px", border: "1px solid var(--line)", background: content.enabled !== false ? "var(--purple)" : "#eee", color: content.enabled !== false ? "#fff" : "#666", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
                {content.enabled !== false ? "ENABLED" : "DISABLED"}
              </button>
            </div>
            <div><label style={labelStyle}>Product Name (e.g. LUMINE-C™)</label><input style={inputStyle} value={String(content.productName || "")} onChange={e => updateContent("productName", e.target.value)} /></div>
            <div><label style={labelStyle}>Subtitle (e.g. Radiance serum)</label><input style={inputStyle} value={String(content.subtitle || "")} onChange={e => updateContent("subtitle", e.target.value)} /></div>
            <div><label style={labelStyle}>Vertical Label (e.g. FORMULATED WITH INTENTION)</label><input style={inputStyle} value={String(content.verticalLabel || "")} onChange={e => updateContent("verticalLabel", e.target.value)} /></div>
            <div style={{ padding: 12, background: "#fff", border: "1px solid var(--line)", fontSize: 12, color: "var(--muted)" }}>
              ℹ️ The 3D LUMINE-C™ product visual is rendered via CSS 3D transforms (bottle, orbs, ring). Product name, subtitle and vertical label are CMS-editable here. The visual styling is in the CSS for pixel-perfect pharmaceutical design.
            </div>
          </div>
        )}

        {/* TRUST */}
        {form.type === "trust" && (
          <div style={{ display: "grid", gap: 12 }}>
            {([0, 1, 2, 3, 4, 5] as const).map(i => (
              <div key={i}><label style={labelStyle}>Badge {i + 1}</label><input style={inputStyle} value={String((content.badges as string[])?.[i] || "")} onChange={e => { const b = [...((content.badges as string[]) || ["", "", "", ""])]; b[i] = e.target.value; updateContent("badges", b); }} /></div>
            ))}
            <p style={{ fontSize: 11, color: "var(--muted)" }}>Leave empty to hide a badge slot.</p>
          </div>
        )}

        {/* COLLECTION */}
        {form.type === "collection" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div><label style={labelStyle}>Eyebrow</label><input style={inputStyle} value={String(content.eyebrow || "")} onChange={e => updateContent("eyebrow", e.target.value)} /></div>
            <div><label style={labelStyle}>Heading (supports &lt;em&gt;)</label><input style={inputStyle} value={String(content.heading || "")} onChange={e => updateContent("heading", e.target.value)} /></div>
            <div><label style={labelStyle}>CTA Text</label><input style={inputStyle} value={String(content.ctaText || "")} onChange={e => updateContent("ctaText", e.target.value)} /></div>
          </div>
        )}

        {/* SCIENCE */}
        {form.type === "science" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div><label style={labelStyle}>Background Image URL</label><input style={inputStyle} value={String(content.imageUrl || "")} onChange={e => updateContent("imageUrl", e.target.value)} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Stat (e.g. 97%)</label><input style={inputStyle} value={String(content.stat || "")} onChange={e => updateContent("stat", e.target.value)} /></div>
              <div><label style={labelStyle}>Stat Description</label><input style={inputStyle} value={String(content.statText || "")} onChange={e => updateContent("statText", e.target.value)} /></div>
            </div>
            <div><label style={labelStyle}>Eyebrow</label><input style={inputStyle} value={String(content.eyebrow || "")} onChange={e => updateContent("eyebrow", e.target.value)} /></div>
            <div><label style={labelStyle}>Heading (supports &lt;em&gt;)</label><input style={inputStyle} value={String(content.heading || "")} onChange={e => updateContent("heading", e.target.value)} /></div>
            <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 80 }} value={String(content.description || "")} onChange={e => updateContent("description", e.target.value)} /></div>
            {/* Principles */}
            <div>
              <label style={{ ...labelStyle, fontSize: 12, fontWeight: 700 }}>Principles (numbered features)</label>
              {((content.principles as Array<Record<string, string>>) || []).map((p, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 8, marginBottom: 8, padding: 8, background: "#fff", border: "1px solid var(--line)" }}>
                  <input style={{ ...inputStyle, textAlign: "center" }} value={p.number || ""} onChange={e => { const ps = [...(content.principles as Array<Record<string, string>>) || []]; ps[i] = { ...ps[i], number: e.target.value }; updateContent("principles", ps); }} placeholder="#" />
                  <div style={{ display: "grid", gap: 4 }}>
                    <input style={inputStyle} value={p.title || ""} onChange={e => { const ps = [...(content.principles as Array<Record<string, string>>) || []]; ps[i] = { ...ps[i], title: e.target.value }; updateContent("principles", ps); }} placeholder="Title" />
                    <input style={inputStyle} value={p.text || ""} onChange={e => { const ps = [...(content.principles as Array<Record<string, string>>) || []]; ps[i] = { ...ps[i], text: e.target.value }; updateContent("principles", ps); }} placeholder="Description" />
                  </div>
                </div>
              ))}
              <button onClick={() => { const ps = [...(content.principles as Array<Record<string, string>>) || []]; ps.push({ number: String(ps.length + 1).padStart(2, "0"), title: "", text: "" }); updateContent("principles", ps); }} style={{ border: "1px dashed var(--line)", background: "transparent", padding: "8px 16px", fontSize: 12, cursor: "pointer", color: "var(--purple)" }}>+ Add Principle</button>
            </div>
            <div><label style={labelStyle}>CTA Text</label><input style={inputStyle} value={String(content.ctaText || "")} onChange={e => updateContent("ctaText", e.target.value)} /></div>
            <div><label style={labelStyle}>CTA Link</label><input style={inputStyle} value={String(content.ctaLink || "")} onChange={e => updateContent("ctaLink", e.target.value)} /></div>
          </div>
        )}

        {/* RITUAL */}
        {form.type === "ritual" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div><label style={labelStyle}>Eyebrow</label><input style={inputStyle} value={String(content.eyebrow || "")} onChange={e => updateContent("eyebrow", e.target.value)} /></div>
            <div><label style={labelStyle}>Heading (supports &lt;em&gt;)</label><input style={inputStyle} value={String(content.heading || "")} onChange={e => updateContent("heading", e.target.value)} /></div>
            <div><label style={labelStyle}>Side Text</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(content.sideText || "")} onChange={e => updateContent("sideText", e.target.value)} /></div>
            <label style={{ ...labelStyle, fontSize: 12, fontWeight: 700, marginTop: 8 }}>Ritual Cards</label>
            {((content.cards as Array<Record<string, string>>) || []).map((card, i) => (
              <div key={i} style={{ padding: 12, background: "#fff", border: "1px solid var(--line)", display: "grid", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px", gap: 8 }}>
                  <input style={inputStyle} value={card.number || ""} onChange={e => { const cs = [...(content.cards as Array<Record<string, string>>) || []]; cs[i] = { ...cs[i], number: e.target.value }; updateContent("cards", cs); }} placeholder="01" />
                  <input style={inputStyle} value={card.heading || ""} onChange={e => { const cs = [...(content.cards as Array<Record<string, string>>) || []]; cs[i] = { ...cs[i], heading: e.target.value }; updateContent("cards", cs); }} placeholder="Heading (HTML OK)" />
                  <select style={inputStyle} value={card.color || "amber"} onChange={e => { const cs = [...(content.cards as Array<Record<string, string>>) || []]; cs[i] = { ...cs[i], color: e.target.value }; updateContent("cards", cs); }}>
                    <option value="amber">Amber</option><option value="lavender">Lavender</option><option value="rose">Rose</option>
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input style={inputStyle} value={card.cta || ""} onChange={e => { const cs = [...(content.cards as Array<Record<string, string>>) || []]; cs[i] = { ...cs[i], cta: e.target.value }; updateContent("cards", cs); }} placeholder="CTA text" />
                  <input style={inputStyle} value={card.link || ""} onChange={e => { const cs = [...(content.cards as Array<Record<string, string>>) || []]; cs[i] = { ...cs[i], link: e.target.value }; updateContent("cards", cs); }} placeholder="CTA link" />
                </div>
                <button onClick={() => { const cs = (content.cards as Array<Record<string, string>>) || []; updateContent("cards", cs.filter((_, j) => j !== i)); }} style={{ border: "1px solid #e2c3c3", background: "#fff", padding: "4px 10px", fontSize: 11, cursor: "pointer", color: "#b34141", alignSelf: "start" }}>Remove Card</button>
              </div>
            ))}
            <button onClick={() => { const cs = [...(content.cards as Array<Record<string, string>>) || []]; cs.push({ number: String(cs.length + 1).padStart(2, "0"), heading: "", cta: "", link: "#collection", color: "amber" }); updateContent("cards", cs); }} style={{ border: "1px dashed var(--line)", background: "transparent", padding: "8px 16px", fontSize: 12, cursor: "pointer", color: "var(--purple)" }}>+ Add Card</button>
          </div>
        )}

        {/* AFFILIATE */}
        {form.type === "affiliate" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div><label style={labelStyle}>Eyebrow</label><input style={inputStyle} value={String(content.eyebrow || "")} onChange={e => updateContent("eyebrow", e.target.value)} /></div>
            <div><label style={labelStyle}>Heading</label><input style={inputStyle} value={String(content.heading || "")} onChange={e => updateContent("heading", e.target.value)} /></div>
            <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(content.description || "")} onChange={e => updateContent("description", e.target.value)} /></div>
            <label style={{ ...labelStyle, fontSize: 12, fontWeight: 700, marginTop: 8 }}>Stats (up to 3)</label>
            {((content.stats as Array<Record<string, string>>) || []).map((stat, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <input style={inputStyle} value={stat.value || ""} onChange={e => { const ss = [...(content.stats as Array<Record<string, string>>) || []]; ss[i] = { ...ss[i], value: e.target.value }; updateContent("stats", ss); }} placeholder="Value (e.g. 10%)" />
                <input style={inputStyle} value={stat.label || ""} onChange={e => { const ss = [...(content.stats as Array<Record<string, string>>) || []]; ss[i] = { ...ss[i], label: e.target.value }; updateContent("stats", ss); }} placeholder="Label (e.g. Commission)" />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>CTA Text</label><input style={inputStyle} value={String(content.ctaText || "")} onChange={e => updateContent("ctaText", e.target.value)} /></div>
              <div><label style={labelStyle}>CTA Link</label><input style={inputStyle} value={String(content.ctaLink || "")} onChange={e => updateContent("ctaLink", e.target.value)} /></div>
            </div>
            <div><label style={labelStyle}>Image URL</label><input style={inputStyle} value={String(content.imageUrl || "")} onChange={e => updateContent("imageUrl", e.target.value)} /></div>
          </div>
        )}

        {/* TESTIMONIAL */}
        {form.type === "testimonial" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div><label style={labelStyle}>Quote</label><textarea style={{ ...inputStyle, minHeight: 80 }} value={String(content.quote || "")} onChange={e => updateContent("quote", e.target.value)} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Author</label><input style={inputStyle} value={String(content.author || "")} onChange={e => updateContent("author", e.target.value)} /></div>
              <div><label style={labelStyle}>Attribution</label><input style={inputStyle} value={String(content.attribution || "")} onChange={e => updateContent("attribution", e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* NEWSLETTER */}
        {form.type === "newsletter" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div><label style={labelStyle}>Eyebrow</label><input style={inputStyle} value={String(content.eyebrow || "")} onChange={e => updateContent("eyebrow", e.target.value)} /></div>
            <div><label style={labelStyle}>Heading</label><input style={inputStyle} value={String(content.heading || "")} onChange={e => updateContent("heading", e.target.value)} /></div>
            <div><label style={labelStyle}>Subtitle</label><input style={inputStyle} value={String(content.subtitle || "")} onChange={e => updateContent("subtitle", e.target.value)} /></div>
          </div>
        )}

        {/* CONSULT */}
        {form.type === "consult" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div><label style={labelStyle}>Eyebrow</label><input style={inputStyle} value={String(content.eyebrow || "")} onChange={e => updateContent("eyebrow", e.target.value)} /></div>
            <div><label style={labelStyle}>Heading (supports &lt;br/&gt;)</label><input style={inputStyle} value={String(content.heading || "")} onChange={e => updateContent("heading", e.target.value)} /></div>
            <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(content.description || "")} onChange={e => updateContent("description", e.target.value)} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Primary CTA Text</label><input style={inputStyle} value={String(content.ctaText || "")} onChange={e => updateContent("ctaText", e.target.value)} /></div>
              <div><label style={labelStyle}>Primary CTA Link</label><input style={inputStyle} value={String(content.ctaLink || "")} onChange={e => updateContent("ctaLink", e.target.value)} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Secondary CTA Text</label><input style={inputStyle} value={String(content.secondaryCtaText || "")} onChange={e => updateContent("secondaryCtaText", e.target.value)} placeholder="For healthcare professionals" /></div>
              <div><label style={labelStyle}>Secondary CTA Link</label><input style={inputStyle} value={String(content.secondaryCtaLink || "")} onChange={e => updateContent("secondaryCtaLink", e.target.value)} placeholder="/doctors" /></div>
            </div>
            <div><label style={labelStyle}>Image URL</label><input style={inputStyle} value={String(content.imageUrl || "")} onChange={e => updateContent("imageUrl", e.target.value)} /></div>
          </div>
        )}

        {/* BANNER / ANNOUNCEMENT */}
        {form.type === "banner" && (
          <div style={{ display: "grid", gap: 12 }}>
            <div><label style={labelStyle}>Main Text</label><input style={inputStyle} value={String(content.text || "")} onChange={e => updateContent("text", e.target.value)} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Secondary Text</label><input style={inputStyle} value={String(content.secondaryText || "")} onChange={e => updateContent("secondaryText", e.target.value)} /></div>
              <div><label style={labelStyle}>Secondary Link</label><input style={inputStyle} value={String(content.secondaryLink || "")} onChange={e => updateContent("secondaryLink", e.target.value)} /></div>
            </div>
          </div>
        )}

        {/* CUSTOM */}
        {form.type === "custom" && (
          <div style={{ display: "grid", gap: 12 }}>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>Custom section — edit the JSON content field directly.</p>
            <div><label style={labelStyle}>Content JSON</label><textarea style={{ ...inputStyle, minHeight: 200, fontFamily: "monospace", fontSize: 12 }} value={JSON.stringify(content, null, 2)} onChange={e => { try { setContent(JSON.parse(e.target.value)); } catch {} }} /></div>
          </div>
        )}
      </div>

      <button onClick={save} disabled={saving} style={{ padding: "12px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 }}>{saving ? "Saving…" : "Save Section →"}</button>
    </div>
  );
}
