"use client";

import React, { useState, useEffect } from "react";

type NavItem = { label: string; href: string; visible: boolean; sort: number };
type FooterLinkSection = { section: string; links: NavItem[] };

const DEFAULT_HEADER_NAV: NavItem[] = [
  { label: "Shop", href: "/#collection", visible: true, sort: 0 },
  { label: "About", href: "/about", visible: true, sort: 1 },
  { label: "Our science", href: "/#science", visible: true, sort: 2 },
  { label: "Blog", href: "/blog", visible: true, sort: 3 },
  { label: "Our team", href: "/employee", visible: false, sort: 4 },
  { label: "Contact", href: "/contact", visible: true, sort: 5 },
];

const DEFAULT_FOOTER_LINKS: FooterLinkSection[] = [
  { section: "Shop", links: [
    { label: "All care", href: "/#collection", visible: true, sort: 0 },
    { label: "Best sellers", href: "/shop", visible: true, sort: 1 },
    { label: "Store locator", href: "/store-locator", visible: true, sort: 2 },
    { label: "B2B portal", href: "/b2b", visible: true, sort: 3 },
  ]},
  { section: "About", links: [
    { label: "Our story", href: "/about", visible: true, sort: 0 },
    { label: "Journal", href: "/blog", visible: true, sort: 1 },
    { label: "Our team", href: "/employee", visible: false, sort: 2 },
    { label: "Careers", href: "/careers", visible: true, sort: 3 },
    { label: "Contact", href: "/contact", visible: true, sort: 4 },
  ]},
  { section: "Support", links: [
    { label: "FAQ", href: "/faq", visible: true, sort: 0 },
    { label: "Track order", href: "/track-order", visible: true, sort: 1 },
    { label: "Privacy", href: "/privacy", visible: true, sort: 2 },
    { label: "Terms", href: "/terms", visible: true, sort: 3 },
  ]},
  { section: "Partnerships", links: [
    { label: "Doctor portal", href: "/doctors", visible: true, sort: 0 },
    { label: "Distributor portal", href: "/b2b", visible: true, sort: 1 },
    { label: "Become an Affiliate", href: "/affiliate", visible: true, sort: 2 },
  ]},
];

const S = { width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 4, fontSize: 13, background: "#fff", boxSizing: "border-box" as const };
const L: React.CSSProperties = { display: "block", fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#2A0F3A", marginBottom: 4 };
const B = { padding: "6px 12px", fontSize: 11, border: "1px solid #ddd", background: "#fff", cursor: "pointer", borderRadius: 4 };

export default function FooterSettingsModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({
    footer_tagline: "Care is a practice.\nMake it yours.",
    footer_newsletter_title: "A considered note, once in a while.",
    footer_copyright: "2026 Queens Care Laboratories. All rights reserved.",
    footer_bg: "",
    footer_text_color: "",
  });
  const [headerNav, setHeaderNav] = useState<NavItem[]>(DEFAULT_HEADER_NAV);
  const [footerLinks, setFooterLinks] = useState<FooterLinkSection[]>(DEFAULT_FOOTER_LINKS);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("footer");

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      const obj: Record<string, string> = {};
      (d.settings || []).forEach((s: { key: string; value: string }) => {
        if (s.key in form) obj[s.key] = s.value;
        if (s.key === "header_nav" && s.value) { try { setHeaderNav(JSON.parse(s.value)); } catch { /* ignore */ } }
        if (s.key === "footer_links" && s.value) { try { setFooterLinks(JSON.parse(s.value)); } catch { /* ignore */ } }
      });
      setForm((prev) => ({ ...prev, ...obj }));
    }).catch(() => {});
  }, []);

  const saveAll = async () => {
    setSaving(true);
    setMsg("");
    try {
      for (const [key, value] of Object.entries(form)) {
        await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value, group: "footer" }) });
      }
      await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "header_nav", value: JSON.stringify(headerNav), group: "navigation" }) });
      await fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "footer_links", value: JSON.stringify(footerLinks), group: "navigation" }) });
      setMsg("All settings saved!");
      onSave();
    } catch {
      setMsg("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "footer", label: "Footer Content" },
    { id: "header", label: "Header Navigation" },
    { id: "footerLinks", label: "Footer Links" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", padding: 26, borderRadius: 8, width: "100%", maxWidth: 720, maxHeight: "85vh", overflow: "auto", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, font: "20px var(--font-display)", color: "#2A0F3A" }}>Navigation &amp; Footer CMS</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#999" }}>X</button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "6px 14px", fontSize: 12, fontWeight: 600, border: "1px solid #ddd", background: tab === t.id ? "#2A0F3A" : "#fff", color: tab === t.id ? "#D4AF37" : "#333", cursor: "pointer", borderRadius: 4 }}>{t.label}</button>
          ))}
        </div>
        {msg && <p style={{ padding: "8px 12px", background: msg.includes("failed") ? "#fde8e8" : "#e9f7e9", fontSize: 12, color: msg.includes("failed") ? "#b34141" : "#2e7d32", marginBottom: 12 }}>{msg}</p>}

        {tab === "footer" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div><label style={L}>Footer Tagline</label><textarea style={{ ...S, minHeight: 50 }} value={form.footer_tagline} onChange={(e) => setForm({ ...form, footer_tagline: e.target.value })} /></div>
            <div><label style={L}>Newsletter Title</label><input style={S} value={form.footer_newsletter_title} onChange={(e) => setForm({ ...form, footer_newsletter_title: e.target.value })} /></div>
            <div><label style={L}>Copyright Text</label><input style={S} value={form.footer_copyright} onChange={(e) => setForm({ ...form, footer_copyright: e.target.value })} /></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div><label style={L}>Footer Background</label><input style={S} value={form.footer_bg} onChange={(e) => setForm({ ...form, footer_bg: e.target.value })} placeholder="#2A0F3A" /></div>
              <div><label style={L}>Footer Text Color</label><input style={S} value={form.footer_text_color} onChange={(e) => setForm({ ...form, footer_text_color: e.target.value })} placeholder="#ffffff" /></div>
            </div>
          </div>
        )}

        {tab === "header" && (
          <div>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px" }}>Manage header navigation links. Toggle visible to show or hide each link.</p>
            {headerNav.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, padding: "8px 10px", background: item.visible !== false ? "#f8f7f5" : "#fff0f0", border: "1px solid #eee", borderRadius: 4 }}>
                <input style={{ ...S, width: 100 }} value={item.label} onChange={(e) => { const c = [...headerNav]; c[i] = { ...c[i], label: e.target.value }; setHeaderNav(c); }} placeholder="Label" />
                <input style={{ ...S, width: 160 }} value={item.href} onChange={(e) => { const c = [...headerNav]; c[i] = { ...c[i], href: e.target.value }; setHeaderNav(c); }} placeholder="/about" />
                <button onClick={() => { const c = [...headerNav]; c[i] = { ...c[i], visible: !c[i].visible }; setHeaderNav(c); }} style={{ ...B, background: item.visible !== false ? "#e8f5e9" : "#fff", color: item.visible !== false ? "#2e7d32" : "#999", minWidth: 60 }}>{item.visible !== false ? "VISIBLE" : "HIDDEN"}</button>
                <button onClick={() => setHeaderNav(headerNav.filter((_, j) => j !== i))} style={{ ...B, color: "#b34141" }}>X</button>
              </div>
            ))}
            <button onClick={() => setHeaderNav([...headerNav, { label: "New link", href: "/", visible: true, sort: headerNav.length }])} style={{ ...B, background: "#2A0F3A", color: "#fff", marginTop: 4 }}>+ Add Link</button>
          </div>
        )}

        {tab === "footerLinks" && (
          <div>
            <p style={{ fontSize: 12, color: "#888", margin: "0 0 12px" }}>Manage footer link sections. Each section becomes a column in the footer.</p>
            {footerLinks.map((section, si) => (
              <div key={si} style={{ marginBottom: 16, padding: 12, border: "1px solid #eee", borderRadius: 6, background: "#faf9f7" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                  <input style={{ ...S, width: 200, fontWeight: 700 }} value={section.section} onChange={(e) => { const c = [...footerLinks]; c[si] = { ...c[si], section: e.target.value }; setFooterLinks(c); }} placeholder="Section name" />
                  <button onClick={() => setFooterLinks(footerLinks.filter((_, j) => j !== si))} style={{ ...B, color: "#b34141" }}>Remove Section</button>
                </div>
                {section.links.map((link, li) => (
                  <div key={li} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, marginLeft: 12 }}>
                    <input style={{ ...S, width: 120 }} value={link.label} onChange={(e) => { const c = [...footerLinks]; const l = [...c[si].links]; l[li] = { ...l[li], label: e.target.value }; c[si] = { ...c[si], links: l }; setFooterLinks(c); }} placeholder="Label" />
                    <input style={{ ...S, width: 160 }} value={link.href} onChange={(e) => { const c = [...footerLinks]; const l = [...c[si].links]; l[li] = { ...l[li], href: e.target.value }; c[si] = { ...c[si], links: l }; setFooterLinks(c); }} placeholder="/path" />
                    <button onClick={() => { const c = [...footerLinks]; const l = [...c[si].links]; l[li] = { ...l[li], visible: !l[li].visible }; c[si] = { ...c[si], links: l }; setFooterLinks(c); }} style={{ ...B, background: link.visible !== false ? "#e8f5e9" : "#fff", color: link.visible !== false ? "#2e7d32" : "#999", minWidth: 55, fontSize: 10 }}>{link.visible !== false ? "SHOW" : "HIDE"}</button>
                    <button onClick={() => { const c = [...footerLinks]; c[si] = { ...c[si], links: c[si].links.filter((_, j) => j !== li) }; setFooterLinks(c); }} style={{ ...B, color: "#b34141" }}>X</button>
                  </div>
                ))}
                <button onClick={() => { const c = [...footerLinks]; c[si] = { ...c[si], links: [...c[si].links, { label: "New link", href: "/", visible: true, sort: c[si].links.length }] }; setFooterLinks(c); }} style={{ ...B, marginLeft: 12, marginTop: 4 }}>+ Add Link</button>
              </div>
            ))}
            <button onClick={() => setFooterLinks([...footerLinks, { section: "New Section", links: [] }])} style={{ ...B, background: "#2A0F3A", color: "#fff" }}>+ Add Section</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid #eee" }}>
          <button onClick={saveAll} disabled={saving} style={{ padding: "10px 24px", background: "#2A0F3A", color: "#D4AF37", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{saving ? "Saving..." : "Save All Settings"}</button>
          <button onClick={onClose} style={{ padding: "10px 20px", border: "1px solid #ddd", background: "#fff", cursor: "pointer", borderRadius: 4, fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
