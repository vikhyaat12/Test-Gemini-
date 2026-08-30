"use client";

import { useState, useEffect, useCallback } from "react";

type MarketingItem = Record<string, unknown> & { id: string; type?: string; active?: boolean };

const MARKETING_TABS = [
  { id: "flash", label: "Flash Deals", icon: "⚡" },
  { id: "lightning", label: "Lightning Deals", icon: "🌩️" },
  { id: "limited", label: "Limited Offers", icon: "⏰" },
  { id: "coupons", label: "Coupons", icon: "🎫" },
  { id: "bxgy", label: "Buy X Get Y", icon: "🎁" },
  { id: "qty", label: "Qty Discounts", icon: "📦" },
  { id: "shipping", label: "Free Shipping", icon: "🚚" },
  { id: "banners", label: "Promo Banners", icon: "🖼️" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "campaigns", label: "Campaigns", icon: "📣" },
];

const TYPE_MAP: Record<string, string> = {
  flash: "flash_deal",
  lightning: "lightning_deal",
  limited: "limited_offer",
  bxgy: "buy_x_get_y",
  qty: "qty_discount",
  shipping: "free_shipping",
  campaigns: "campaign",
};

export default function MarketingPanel() {
  const [activeTab, setActiveTab] = useState("flash");
  const [items, setItems] = useState<MarketingItem[]>([]);
  const [editing, setEditing] = useState<MarketingItem | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [isErr, setIsErr] = useState(false);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 };
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4 };

  const load = useCallback(async () => {
    try {
      const kind = activeTab === "notifications" ? "notifications" : activeTab === "banners" ? "promoBanners" : "marketing";
      const type = TYPE_MAP[activeTab];
      const params = new URLSearchParams({ kind });
      if (type) params.set("type", type);
      const r = await fetch(`/api/admin/marketing?${params}`);
      const d = await r.json();
      setItems(d.items || []);
    } catch { setItems([]); }
  }, [activeTab]);

  useEffect(() => { load(); setEditing(null); setForm({}); }, [load]);

  const startNew = () => {
    setIsNew(true);
    setEditing({ id: "new", type: TYPE_MAP[activeTab] || activeTab, active: true } as MarketingItem);
    setForm({ type: TYPE_MAP[activeTab] || activeTab, active: true });
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const kind = activeTab === "notifications" ? "notifications" : activeTab === "banners" ? "promoBanners" : "marketing";
      const endpoint = "/api/admin/marketing";
      const method = isNew ? "POST" : "PATCH";
      const payload = { ...form, _kind: kind, id: isNew ? undefined : form.id };
      const r = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (r.ok) {
        setIsErr(false);
        setMsg("Saved successfully!");
        setEditing(null);
        setIsNew(false);
        load();
      } else {
        setIsErr(true);
        setMsg(d.error || "Failed to save.");
      }
    } catch {
      setIsErr(true);
      setMsg("Network error.");
    }
    setSaving(false);
  };

  const del = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    const kind = activeTab === "notifications" ? "notifications" : activeTab === "banners" ? "promoBanners" : "marketing";
    await fetch(`/api/admin/marketing?id=${id}&kind=${kind}`, { method: "DELETE" });
    load();
  };

  const toggle = async (item: MarketingItem) => {
    const kind = activeTab === "notifications" ? "notifications" : activeTab === "banners" ? "promoBanners" : "marketing";
    await fetch("/api/admin/marketing", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: item.id, active: !item.active, _kind: kind }) });
    load();
  };

  // ─── EDITOR FORM ──────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div style={{ maxWidth: 700 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, font: "20px var(--font-display)" }}>{isNew ? "New" : "Edit"} {MARKETING_TABS.find(t => t.id === activeTab)?.label}</h3>
          <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ padding: "8px 16px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>← Back</button>
        </div>
        {msg && <p style={{ padding: "8px 12px", background: isErr ? "#fde8e8" : "#e9f7e9", fontSize: 12, color: isErr ? "#b34141" : "#2e7d32", marginBottom: 16 }}>{msg}</p>}

        <div style={{ padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <div><label style={labelStyle}>Title *</label><input style={inputStyle} value={String(form.title || "")} onChange={e => setForm({ ...form, title: e.target.value })} /></div>

            {(activeTab === "flash" || activeTab === "lightning") && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Deal Price (₹)</label><input type="number" style={inputStyle} value={Number(form.dealPrice || 0)} onChange={e => setForm({ ...form, dealPrice: Number(e.target.value) })} /></div>
                  <div><label style={labelStyle}>Original Price (₹)</label><input type="number" style={inputStyle} value={Number(form.originalPrice || 0)} onChange={e => setForm({ ...form, originalPrice: Number(e.target.value) })} /></div>
                  <div><label style={labelStyle}>Discount %</label><input type="number" style={inputStyle} value={Number(form.discount || 0)} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Start Date/Time</label><input type="datetime-local" style={inputStyle} value={String(form.startDate || "").slice(0, 16)} onChange={e => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })} /></div>
                  <div><label style={labelStyle}>End Date/Time</label><input type="datetime-local" style={inputStyle} value={String(form.endDate || "").slice(0, 16)} onChange={e => setForm({ ...form, endDate: new Date(e.target.value).toISOString() })} /></div>
                  <div><label style={labelStyle}>Quantity Limit</label><input type="number" style={inputStyle} value={Number(form.quantityLimit || 0)} onChange={e => setForm({ ...form, quantityLimit: Number(e.target.value) })} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Max Per User</label><input type="number" style={inputStyle} value={Number(form.maxPerUser || 1)} onChange={e => setForm({ ...form, maxPerUser: Number(e.target.value) })} /></div>
                  <div><label style={labelStyle}>Badge Text</label><input style={inputStyle} value={String(form.badge || "")} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="FLASH DEAL" /></div>
                  <div><label style={labelStyle}>Products (comma-separated slugs)</label><input style={inputStyle} value={Array.isArray(form.products) ? (form.products as string[]).join(", ") : String(form.products || "")} onChange={e => setForm({ ...form, products: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} placeholder="lumine-c-serum, biome-balance" /></div>
                </div>
              </>
            )}

            {activeTab === "limited" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Discount %</label><input type="number" style={inputStyle} value={Number(form.discount || 0)} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
                  <div><label style={labelStyle}>Coupon Code</label><input style={inputStyle} value={String(form.couponCode || "")} onChange={e => setForm({ ...form, couponCode: e.target.value.toUpperCase() })} placeholder="WELCOME10" /></div>
                  <div><label style={labelStyle}>Badge</label><input style={inputStyle} value={String(form.badge || "")} onChange={e => setForm({ ...form, badge: e.target.value })} placeholder="10% OFF" /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Start Date</label><input type="datetime-local" style={inputStyle} value={String(form.startDate || "").slice(0, 16)} onChange={e => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })} /></div>
                  <div><label style={labelStyle}>End Date</label><input type="datetime-local" style={inputStyle} value={String(form.endDate || "").slice(0, 16)} onChange={e => setForm({ ...form, endDate: new Date(e.target.value).toISOString() })} /></div>
                </div>
                <div><label style={labelStyle}>Products (comma-separated slugs, empty = all)</label><input style={inputStyle} value={Array.isArray(form.products) ? (form.products as string[]).join(", ") : String(form.products || "")} onChange={e => setForm({ ...form, products: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} /></div>
              </>
            )}

            {activeTab === "coupons" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Coupon Code *</label><input style={inputStyle} value={String(form.code || "")} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" /></div>
                  <div><label style={labelStyle}>Type</label><select style={inputStyle} value={String(form.type || "percentage")} onChange={e => setForm({ ...form, type: e.target.value })}><option value="percentage">Percentage</option><option value="flat">Flat (₹)</option></select></div>
                  <div><label style={labelStyle}>Discount Value</label><input type="number" style={inputStyle} value={Number(form.discount || 0)} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Min Order (₹)</label><input type="number" style={inputStyle} value={Number(form.minOrder || 0)} onChange={e => setForm({ ...form, minOrder: Number(e.target.value) })} /></div>
                  <div><label style={labelStyle}>Max Discount (₹)</label><input type="number" style={inputStyle} value={Number(form.maxDiscount || 0)} onChange={e => setForm({ ...form, maxDiscount: Number(e.target.value) })} /></div>
                  <div><label style={labelStyle}>Usage Limit</label><input type="number" style={inputStyle} value={Number(form.usageLimit || 0)} onChange={e => setForm({ ...form, usageLimit: Number(e.target.value) })} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Per User Limit</label><input type="number" style={inputStyle} value={Number(form.perUserLimit || 1)} onChange={e => setForm({ ...form, perUserLimit: Number(e.target.value) })} /></div>
                  <div><label style={labelStyle}>Start Date</label><input type="datetime-local" style={inputStyle} value={String(form.startDate || "").slice(0, 16)} onChange={e => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })} /></div>
                  <div><label style={labelStyle}>End Date</label><input type="datetime-local" style={inputStyle} value={String(form.endDate || "").slice(0, 16)} onChange={e => setForm({ ...form, endDate: new Date(e.target.value).toISOString() })} /></div>
                </div>
                <div><label style={labelStyle}>Description</label><input style={inputStyle} value={String(form.description || "")} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="10% off on first order" /></div>
              </>
            )}

            {activeTab === "bxgy" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Buy Quantity</label><input type="number" style={inputStyle} value={Number(form.buyQty || 2)} onChange={e => setForm({ ...form, buyQty: Number(e.target.value) })} /></div>
                  <div><label style={labelStyle}>Get Quantity</label><input type="number" style={inputStyle} value={Number(form.getQty || 1)} onChange={e => setForm({ ...form, getQty: Number(e.target.value) })} /></div>
                  <div><label style={labelStyle}>Discount % (on free item)</label><input type="number" style={inputStyle} value={Number(form.discount || 100)} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Start Date</label><input type="datetime-local" style={inputStyle} value={String(form.startDate || "").slice(0, 16)} onChange={e => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })} /></div>
                  <div><label style={labelStyle}>End Date</label><input type="datetime-local" style={inputStyle} value={String(form.endDate || "").slice(0, 16)} onChange={e => setForm({ ...form, endDate: new Date(e.target.value).toISOString() })} /></div>
                </div>
                <div><label style={labelStyle}>Products (comma-separated slugs)</label><input style={inputStyle} value={Array.isArray(form.products) ? (form.products as string[]).join(", ") : String(form.products || "")} onChange={e => setForm({ ...form, products: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} /></div>
              </>
            )}

            {activeTab === "qty" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Min Quantity</label><input type="number" style={inputStyle} value={Number(form.minQty || 2)} onChange={e => setForm({ ...form, minQty: Number(e.target.value) })} /></div>
                  <div><label style={labelStyle}>Discount %</label><input type="number" style={inputStyle} value={Number(form.discount || 10)} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} /></div>
                  <div><label style={labelStyle}>Flat Discount (₹)</label><input type="number" style={inputStyle} value={Number(form.flatDiscount || 0)} onChange={e => setForm({ ...form, flatDiscount: Number(e.target.value) })} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Start Date</label><input type="datetime-local" style={inputStyle} value={String(form.startDate || "").slice(0, 16)} onChange={e => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })} /></div>
                  <div><label style={labelStyle}>End Date</label><input type="datetime-local" style={inputStyle} value={String(form.endDate || "").slice(0, 16)} onChange={e => setForm({ ...form, endDate: new Date(e.target.value).toISOString() })} /></div>
                </div>
                <div><label style={labelStyle}>Products (comma-separated slugs, empty = all)</label><input style={inputStyle} value={Array.isArray(form.products) ? (form.products as string[]).join(", ") : String(form.products || "")} onChange={e => setForm({ ...form, products: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} /></div>
              </>
            )}

            {activeTab === "shipping" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Minimum Cart Value (₹)</label><input type="number" style={inputStyle} value={Number(form.minCartValue || 0)} onChange={e => setForm({ ...form, minCartValue: Number(e.target.value) })} /></div>
                  <div><label style={labelStyle}>Products (comma-separated slugs, empty = all)</label><input style={inputStyle} value={Array.isArray(form.products) ? (form.products as string[]).join(", ") : String(form.products || "")} onChange={e => setForm({ ...form, products: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Start Date</label><input type="datetime-local" style={inputStyle} value={String(form.startDate || "").slice(0, 16)} onChange={e => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })} /></div>
                  <div><label style={labelStyle}>End Date</label><input type="datetime-local" style={inputStyle} value={String(form.endDate || "").slice(0, 16)} onChange={e => setForm({ ...form, endDate: new Date(e.target.value).toISOString() })} /></div>
                </div>
              </>
            )}

            {activeTab === "banners" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Heading</label><input style={inputStyle} value={String(form.heading || "")} onChange={e => setForm({ ...form, heading: e.target.value })} /></div>
                  <div><label style={labelStyle}>Subheading</label><input style={inputStyle} value={String(form.subheading || "")} onChange={e => setForm({ ...form, subheading: e.target.value })} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Image URL</label><input style={inputStyle} value={String(form.imageUrl || "")} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." /></div>
                  <div><label style={labelStyle}>Placement</label><select style={inputStyle} value={String(form.placement || "homepage")} onChange={e => setForm({ ...form, placement: e.target.value })}><option value="homepage">Homepage</option><option value="shop">Shop</option><option value="product">Product Page</option><option value="all">All Pages</option></select></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>CTA Text</label><input style={inputStyle} value={String(form.ctaText || "")} onChange={e => setForm({ ...form, ctaText: e.target.value })} placeholder="Shop Now" /></div>
                  <div><label style={labelStyle}>CTA URL</label><input style={inputStyle} value={String(form.ctaUrl || "")} onChange={e => setForm({ ...form, ctaUrl: e.target.value })} placeholder="/shop" /></div>
                  <div><label style={labelStyle}>Sort Order</label><input type="number" style={inputStyle} value={Number(form.sort || 0)} onChange={e => setForm({ ...form, sort: Number(e.target.value) })} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label style={labelStyle}>Start Date</label><input type="datetime-local" style={inputStyle} value={String(form.startDate || "").slice(0, 16)} onChange={e => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })} /></div>
                  <div><label style={labelStyle}>End Date</label><input type="datetime-local" style={inputStyle} value={String(form.endDate || "").slice(0, 16)} onChange={e => setForm({ ...form, endDate: new Date(e.target.value).toISOString() })} /></div>
                </div>
              </>
            )}

            {(activeTab === "notifications" || activeTab === "campaigns") && (
              <>
                {activeTab === "notifications" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div><label style={labelStyle}>Type</label><select style={inputStyle} value={String(form.type || "promotion")} onChange={e => setForm({ ...form, type: e.target.value })}><option value="promotion">Promotional</option><option value="announcement">Announcement</option><option value="offer">Offer</option><option value="new_product">New Product</option><option value="sale_ending">Sale Ending</option></select></div>
                      <div><label style={labelStyle}>Link/CTA URL</label><input style={inputStyle} value={String(form.link || "")} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="/shop" /></div>
                    </div>
                    <div><label style={labelStyle}>Message</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.message || "")} onChange={e => setForm({ ...form, message: e.target.value })} /></div>
                  </>
                )}
                {activeTab === "campaigns" && (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div><label style={labelStyle}>Start Date</label><input type="datetime-local" style={inputStyle} value={String(form.startDate || "").slice(0, 16)} onChange={e => setForm({ ...form, startDate: new Date(e.target.value).toISOString() })} /></div>
                      <div><label style={labelStyle}>End Date</label><input type="datetime-local" style={inputStyle} value={String(form.endDate || "").slice(0, 16)} onChange={e => setForm({ ...form, endDate: new Date(e.target.value).toISOString() })} /></div>
                    </div>
                    <div><label style={labelStyle}>Products (comma-separated slugs)</label><input style={inputStyle} value={Array.isArray(form.products) ? (form.products as string[]).join(", ") : String(form.products || "")} onChange={e => setForm({ ...form, products: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} /></div>
                    <div><label style={labelStyle}>Description</label><textarea style={{ ...inputStyle, minHeight: 60 }} value={String(form.description || "")} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                  </>
                )}
              </>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <input type="checkbox" checked={form.active !== false} onChange={e => setForm({ ...form, active: e.target.checked })} /> Active
              </label>
              <div />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button onClick={save} disabled={saving} style={{ padding: "12px 24px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13 }}>{saving ? "Saving…" : "Save →"}</button>
          <button onClick={() => { setEditing(null); setIsNew(false); }} style={{ padding: "12px 24px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    );
  }

  // ─── LIST VIEW ────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
        {MARKETING_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: "6px 12px", fontSize: 11, border: activeTab === t.id ? "1px solid var(--purple)" : "1px solid var(--line)", background: activeTab === t.id ? "var(--purple)" : "#fff", color: activeTab === t.id ? "#fff" : "var(--ink)", cursor: "pointer" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, font: "18px var(--font-display)" }}>{MARKETING_TABS.find(t => t.id === activeTab)?.label} ({items.length})</h3>
        <button onClick={startNew} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>+ Add {MARKETING_TABS.find(t => t.id === activeTab)?.label?.replace(/s$/, "")}</button>
      </div>

      {items.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: 13, padding: "30px 0", textAlign: "center" }}>No items yet. Click "Add" to create one.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Title</th>
              {activeTab !== "banners" && <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Type</th>}
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Status</th>
              <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Active</th>
              <th style={{ padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={String(item.id)} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "10px 12px" }}>{String(item.title || item.heading || item.code || "—")}</td>
                {activeTab !== "banners" && <td style={{ padding: "10px 12px" }}><code style={{ fontSize: 11 }}>{String(item.type || TYPE_MAP[activeTab] || "—")}</code></td>}
                <td style={{ padding: "10px 12px" }}>
                  {item.startDate && item.endDate ? (
                    <span style={{ fontSize: 11, color: new Date(String(item.endDate)) < new Date() ? "#b34141" : "#4caf50" }}>
                      {new Date(String(item.endDate)) < new Date() ? "Expired" : "Scheduled"}
                    </span>
                  ) : "—"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button onClick={() => toggle(item)} style={{ padding: "3px 10px", fontSize: 11, border: "1px solid var(--line)", background: item.active !== false ? "#e8f5e9" : "#fff", color: item.active !== false ? "#2e7d32" : "var(--muted)", cursor: "pointer" }}>
                    {item.active !== false ? "ON" : "OFF"}
                  </button>
                </td>
                <td style={{ padding: "10px 12px", display: "flex", gap: 6 }}>
                  <button onClick={() => { setEditing(item); setForm({ ...item }); setIsNew(false); }} style={{ padding: "4px 10px", fontSize: 11, border: "1px solid var(--line)", background: "#fff", cursor: "pointer" }}>Edit</button>
                  <button onClick={() => del(String(item.id))} style={{ padding: "4px 10px", fontSize: 11, border: "1px solid #e2c3c3", background: "#fff", color: "#b34141", cursor: "pointer" }}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
