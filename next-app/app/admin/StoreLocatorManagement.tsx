"use client";

import React, { useState, useEffect } from "react";
import type { StoreLocation, StoreLocatorPageConfig } from "@/lib/commerce/store-extensions";

export default function StoreLocatorManagement() {
  const [activeTab, setActiveTab] = useState<"locations" | "cms-hero" | "cms-types" | "seo-settings" | "import">("locations");
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [pageConfig, setPageConfig] = useState<StoreLocatorPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal state (Add / Edit)
  const [editingLoc, setEditingLoc] = useState<Partial<StoreLocation> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  // Import state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/store-locator");
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
        if (data.pageConfig) setPageConfig(data.pageConfig);
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to load store locator data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleVisible = async (loc: StoreLocation) => {
    try {
      const res = await fetch(`/api/admin/store-locator/${loc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !loc.isVisible }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocations((prev) => prev.map((l) => (l.id === loc.id ? data.location : l)));
        setFeedback({ type: "success", msg: `Location "${loc.name}" visibility updated.` });
        setTimeout(() => setFeedback(null), 2500);
      }
    } catch {}
  };

  const handleToggleFeatured = async (loc: StoreLocation) => {
    try {
      const res = await fetch(`/api/admin/store-locator/${loc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !loc.isFeatured }),
      });
      if (res.ok) {
        const data = await res.json();
        setLocations((prev) => prev.map((l) => (l.id === loc.id ? data.location : l)));
        setFeedback({ type: "success", msg: `Location "${loc.name}" featured status updated.` });
        setTimeout(() => setFeedback(null), 2500);
      }
    } catch {}
  };

  const handleDelete = async (loc: StoreLocation) => {
    if (!confirm(`Are you sure you want to permanently delete "${loc.name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/store-locator/${loc.id}`, { method: "DELETE" });
      if (res.ok) {
        setLocations((prev) => prev.filter((l) => l.id !== loc.id));
        setFeedback({ type: "success", msg: `Deleted "${loc.name}" successfully.` });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {}
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoc || !editingLoc.name || !editingLoc.city || !editingLoc.state) {
      alert("Name, City, and State are required.");
      return;
    }

    setModalSaving(true);
    try {
      let res: Response;
      if (isNew) {
        res = await fetch("/api/admin/store-locator", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingLoc),
        });
      } else {
        res = await fetch(`/api/admin/store-locator/${editingLoc.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingLoc),
        });
      }

      if (res.ok) {
        const data = await res.json();
        if (isNew) {
          setLocations((prev) => [data.location, ...prev]);
        } else {
          setLocations((prev) => prev.map((l) => (l.id === editingLoc.id ? data.location : l)));
        }
        setEditingLoc(null);
        setFeedback({ type: "success", msg: `Location "${data.location.name}" saved successfully.` });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save location.");
      }
    } catch {
      alert("An error occurred while saving.");
    } finally {
      setModalSaving(false);
    }
  };

  const handleSavePageConfig = async () => {
    if (!pageConfig) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/store-locator/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageConfig),
      });
      if (res.ok) {
        setFeedback({ type: "success", msg: "Store Locator CMS settings saved successfully." });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: "error", msg: "Failed to save settings." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    setImporting(true);
    setImportResult(null);

    try {
      let res: Response;
      if (csvFile) {
        const formData = new FormData();
        formData.append("file", csvFile);
        res = await fetch("/api/admin/store-locator/import", {
          method: "POST",
          body: formData,
        });
      } else if (csvText.trim()) {
        res = await fetch("/api/admin/store-locator/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csv: csvText }),
        });
      } else {
        alert("Please select a CSV file or paste CSV text.");
        setImporting(false);
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setImportResult(data);
        await loadData();
        setFeedback({ type: "success", msg: data.message });
      } else {
        alert(data.error || "Failed to import CSV.");
      }
    } catch {
      alert("Error occurred during CSV import.");
    } finally {
      setImporting(false);
    }
  };

  const filteredLocations = locations.filter((loc) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !search ||
      (loc.name && loc.name.toLowerCase().includes(term)) ||
      (loc.city && loc.city.toLowerCase().includes(term)) ||
      (loc.state && loc.state.toLowerCase().includes(term)) ||
      (loc.pincode && loc.pincode.includes(term)) ||
      (loc.address && loc.address.toLowerCase().includes(term)) ||
      (loc.region && loc.region.toLowerCase().includes(term)) ||
      (loc.contactPerson && loc.contactPerson.toLowerCase().includes(term));

    const matchesType = typeFilter === "all" || (loc.type && loc.type.toLowerCase() === typeFilter.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "visible" && loc.isVisible !== false) ||
      (statusFilter === "hidden" && loc.isVisible === false) ||
      (statusFilter === "featured" && loc.isFeatured);

    return matchesSearch && matchesType && matchesStatus;
  });

  if (loading || !pageConfig) {
    return <div style={{ padding: 30, color: "var(--muted)" }}>Loading Store Locator Console…</div>;
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24, borderRadius: 6 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Retail &amp; Distribution Network
          </span>
          <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>
            📍 Store &amp; Distributor Locator Management
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Manage authorized pharmacies, retail stockists, regional distribution warehouses, geolocations, and locator CMS settings.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <a
            href="/store-locator"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: "8px 14px",
              background: "#fff",
              color: "var(--purple)",
              border: "1px solid var(--purple)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>👁️ Live Preview</span>
            <span>↗</span>
          </a>

          <a
            href="/api/admin/export?dataset=stores"
            download
            style={{
              padding: "9px 14px",
              background: "#f0ebfa",
              color: "var(--purple)",
              border: "1px solid rgba(42,15,58,0.2)",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>📥 Export CSV</span>
          </a>

          <button
            type="button"
            onClick={() => {
              setIsNew(true);
              setEditingLoc({
                name: "",
                type: "pharmacy",
                contactPerson: "",
                phone: "",
                whatsapp: "",
                email: "",
                address: "",
                city: "",
                state: "",
                pincode: "",
                country: "India",
                region: "",
                productsHandled: "Full Queens Care Portfolio",
                openingHours: "Mon-Sat: 09:30 AM - 08:30 PM",
                isAuthorized: true,
                isFeatured: false,
                isActive: true,
                isVisible: true,
              });
            }}
            style={{
              padding: "9px 16px",
              background: "var(--purple)",
              color: "#D4AF37",
              border: "none",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 8px rgba(42,15,58,0.15)",
            }}
          >
            <span>+ Add Store / Distributor</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 20,
            borderRadius: 4,
            background: feedback.type === "success" ? "#e9f7e9" : "#fde8e8",
            border: `1px solid ${feedback.type === "success" ? "#c3e6cb" : "#f8b4b4"}`,
            color: feedback.type === "success" ? "#2e7d32" : "#b34141",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {feedback.type === "success" ? "✓ " : "✕ "}
          {feedback.msg}
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: "1px solid var(--line)", paddingBottom: 10, flexWrap: "wrap" }}>
        {[
          { id: "locations", label: "Store Locations", count: locations.length },
          { id: "cms-hero", label: "Locator Page Copy & Search" },
          { id: "cms-types", label: "Store Categories & Badges" },
          { id: "seo-settings", label: "SEO & Visibility" },
          { id: "import", label: "Bulk CSV Import" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as never)}
            style={{
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 700,
              borderRadius: 4,
              border: "none",
              background: activeTab === t.id ? "var(--purple)" : "#f5f3ef",
              color: activeTab === t.id ? "#D4AF37" : "var(--ink)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span
                style={{
                  fontSize: 11,
                  padding: "1px 6px",
                  borderRadius: 10,
                  background: activeTab === t.id ? "#ffffff25" : "rgba(0,0,0,0.08)",
                  color: activeTab === t.id ? "#fff" : "var(--muted)",
                }}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── TAB 1: STORE LOCATIONS ─── */}
      {activeTab === "locations" && (
        <div>
          {/* Filter Bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search by store name, city, state, PIN code, address, contact…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "9px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, minWidth: 280, flex: 1 }}
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
            >
              <option value="all">All Types</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="retailer">Retailer</option>
              <option value="distributor">Distributor</option>
              <option value="stockist">Stockist</option>
              <option value="authorized_partner">Authorized Partner</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
            >
              <option value="all">All Statuses ({locations.length})</option>
              <option value="visible">Visible Only</option>
              <option value="hidden">Hidden Only</option>
              <option value="featured">Featured Only</option>
            </select>
          </div>

          {filteredLocations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#faf8f5", border: "1px dashed var(--line)", borderRadius: 4 }}>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>No store locations found matching your filter.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#faf8f5", borderBottom: "2px solid var(--line)" }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Location &amp; Type</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>City &amp; PIN</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Address &amp; Contact</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Coordinates</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Status</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.map((loc) => (
                    <tr key={loc.id} style={{ borderBottom: "1px solid var(--line)", opacity: loc.isVisible === false ? 0.6 : 1 }}>
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <b style={{ color: "var(--purple)", fontSize: 14 }}>{loc.name}</b>
                          {loc.isFeatured && (
                            <span style={{ fontSize: 10, padding: "1px 6px", background: "#fef3c7", color: "#92400e", borderRadius: 3, fontWeight: 700 }}>
                              ⭐ Featured
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "capitalize", display: "block", marginTop: 2 }}>
                          Type: <b>{loc.type?.replace("_", " ")}</b> {loc.isAuthorized ? "• Authorized" : ""}
                        </span>
                      </td>

                      <td style={{ padding: "12px" }}>
                        <b>{loc.city}</b>, {loc.state}
                        <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>PIN: {loc.pincode}</span>
                      </td>

                      <td style={{ padding: "12px", maxWidth: 260 }}>
                        <span style={{ fontSize: 12, display: "block", lineHeight: 1.4 }}>{loc.address}</span>
                        <span style={{ fontSize: 11, color: "var(--purple)", display: "block", marginTop: 2 }}>📞 {loc.phone}</span>
                        {loc.contactPerson && <span style={{ fontSize: 10, color: "var(--muted)" }}>Contact: {loc.contactPerson}</span>}
                      </td>

                      <td style={{ padding: "12px" }}>
                        {loc.latitude && loc.longitude ? (
                          <a
                            href={loc.directionsUrl || `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 11, color: "#1a73e8", textDecoration: "none" }}
                          >
                            📍 {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)} ↗
                          </a>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>No GPS</span>
                        )}
                      </td>

                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleVisible(loc)}
                            style={{
                              padding: "2px 8px",
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 3,
                              border: "none",
                              cursor: "pointer",
                              background: loc.isVisible !== false ? "#e9f7e9" : "#fee2e2",
                              color: loc.isVisible !== false ? "#2e7d32" : "#b34141",
                            }}
                          >
                            {loc.isVisible !== false ? "Visible" : "Hidden"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleFeatured(loc)}
                            style={{
                              padding: "2px 8px",
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 3,
                              border: "none",
                              cursor: "pointer",
                              background: loc.isFeatured ? "#fef3c7" : "#f5f3ef",
                              color: loc.isFeatured ? "#92400e" : "var(--muted)",
                            }}
                          >
                            {loc.isFeatured ? "★ Top" : "☆ Standard"}
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setIsNew(false);
                              setEditingLoc(loc);
                            }}
                            style={{ padding: "4px 10px", fontSize: 11, background: "#fff", border: "1px solid var(--line)", borderRadius: 3, cursor: "pointer", fontWeight: 700, color: "var(--purple)" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(loc)}
                            style={{ padding: "4px 8px", fontSize: 11, background: "#fff", border: "1px solid #f8b4b4", color: "#b34141", borderRadius: 3, cursor: "pointer" }}
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
        </div>
      )}

      {/* ─── TAB 2: LOCATOR CMS & SEARCH COPY ─── */}
      {activeTab === "cms-hero" && (
        <div style={{ display: "grid", gap: 20, maxWidth: 840 }}>
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 14px" }}>
              Store Locator Hero &amp; Search Copy
            </h4>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Hero Eyebrow</label>
                <input
                  type="text"
                  value={pageConfig.hero.eyebrow}
                  onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, eyebrow: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Main Display Heading</label>
                <input
                  type="text"
                  value={pageConfig.hero.heading}
                  onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, heading: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 14, fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Subtitle</label>
                <input
                  type="text"
                  value={pageConfig.hero.subtitle}
                  onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, subtitle: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Description Body</label>
                <textarea
                  rows={3}
                  value={pageConfig.hero.description}
                  onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, description: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Search Placeholder</label>
                  <input
                    type="text"
                    value={pageConfig.hero.searchPlaceholder}
                    onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, searchPlaceholder: e.target.value } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Search Button Text</label>
                  <input
                    type="text"
                    value={pageConfig.hero.searchButtonText}
                    onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, searchButtonText: e.target.value } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Location Button Text</label>
                  <input
                    type="text"
                    value={pageConfig.hero.locationButtonText}
                    onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, locationButtonText: e.target.value } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* B2B Partnership Banner */}
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 14px" }}>
              B2B Partnership Banner (Store Not Found CTA)
            </h4>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Banner Heading</label>
                <input
                  type="text"
                  value={pageConfig.b2bCta?.heading}
                  onChange={(e) => setPageConfig({ ...pageConfig, b2bCta: { ...pageConfig.b2bCta, heading: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Banner Description</label>
                <textarea
                  rows={2}
                  value={pageConfig.b2bCta?.description}
                  onChange={(e) => setPageConfig({ ...pageConfig, b2bCta: { ...pageConfig.b2bCta, description: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Button Text</label>
                  <input
                    type="text"
                    value={pageConfig.b2bCta?.buttonText}
                    onChange={(e) => setPageConfig({ ...pageConfig, b2bCta: { ...pageConfig.b2bCta, buttonText: e.target.value } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Button Link</label>
                  <input
                    type="text"
                    value={pageConfig.b2bCta?.buttonLink}
                    onChange={(e) => setPageConfig({ ...pageConfig, b2bCta: { ...pageConfig.b2bCta, buttonLink: e.target.value } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleSavePageConfig}
              disabled={saving}
              style={{ padding: "10px 24px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer" }}
            >
              {saving ? "Saving…" : "💾 Save Locator Copy"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 3: CATEGORIES & BADGES ─── */}
      {activeTab === "cms-types" && (
        <div style={{ display: "grid", gap: 20, maxWidth: 840 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: 0 }}>
                Store Categories &amp; Filter Badges
              </h4>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>Manage filter categories and badges shown on the public locator.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newType = {
                  id: `type_${Date.now()}`,
                  label: "New Category",
                  icon: "📍",
                  badgeColor: "#2A0F3A",
                  visible: true,
                };
                setPageConfig({
                  ...pageConfig,
                  types: [...(pageConfig.types || []), newType],
                });
              }}
              style={{ padding: "6px 14px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              + Add Category
            </button>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {(pageConfig.types || []).map((t, idx) => (
              <div key={t.id || idx} style={{ background: "#faf8f5", padding: 14, borderRadius: 6, border: "1px solid var(--line)", display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="text"
                  value={t.icon}
                  onChange={(e) => {
                    const updated = [...pageConfig.types];
                    updated[idx] = { ...updated[idx], icon: e.target.value };
                    setPageConfig({ ...pageConfig, types: updated });
                  }}
                  style={{ width: 44, padding: "6px", textAlign: "center", fontSize: 16, border: "1px solid var(--line)", borderRadius: 4 }}
                />

                <input
                  type="text"
                  value={t.label}
                  onChange={(e) => {
                    const updated = [...pageConfig.types];
                    updated[idx] = { ...updated[idx], label: e.target.value };
                    setPageConfig({ ...pageConfig, types: updated });
                  }}
                  placeholder="Category Label"
                  style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontWeight: 600 }}
                />

                <input
                  type="text"
                  value={t.id}
                  disabled={t.id === "all"}
                  onChange={(e) => {
                    const updated = [...pageConfig.types];
                    updated[idx] = { ...updated[idx], id: e.target.value };
                    setPageConfig({ ...pageConfig, types: updated });
                  }}
                  placeholder="Key (e.g. pharmacy)"
                  style={{ width: 140, padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 12 }}
                />

                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={t.visible !== false}
                    onChange={(e) => {
                      const updated = [...pageConfig.types];
                      updated[idx] = { ...updated[idx], visible: e.target.checked };
                      setPageConfig({ ...pageConfig, types: updated });
                    }}
                  />
                  <span>Visible</span>
                </label>

                {t.id !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = pageConfig.types.filter((_, i) => i !== idx);
                      setPageConfig({ ...pageConfig, types: updated });
                    }}
                    style={{ background: "none", border: "none", color: "#b34141", fontSize: 12, cursor: "pointer" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleSavePageConfig}
              disabled={saving}
              style={{ padding: "10px 24px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer" }}
            >
              {saving ? "Saving…" : "💾 Save Categories"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 4: SEO & PAGE VISIBILITY ─── */}
      {activeTab === "seo-settings" && (
        <div style={{ display: "grid", gap: 20, maxWidth: 840 }}>
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 14px" }}>
              Page Master Visibility &amp; SEO
            </h4>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: 14, borderRadius: 4, border: "1px solid var(--line)" }}>
                <div>
                  <b style={{ fontSize: 13, display: "block" }}>Store Locator Public Access (Published / Hidden)</b>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Controls whether /store-locator is accessible publicly.</span>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: pageConfig.published !== false ? "#2e7d32" : "#b34141" }}>
                    {pageConfig.published !== false ? "PUBLISHED" : "UNPUBLISHED"}
                  </span>
                  <input
                    type="checkbox"
                    checked={pageConfig.published !== false}
                    onChange={(e) => setPageConfig({ ...pageConfig, published: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "var(--purple)" }}
                  />
                </label>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>SEO Meta Title</label>
                <input
                  type="text"
                  value={pageConfig.seo?.metaTitle || ""}
                  onChange={(e) => setPageConfig({ ...pageConfig, seo: { ...pageConfig.seo, metaTitle: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>SEO Meta Description</label>
                <textarea
                  rows={2}
                  value={pageConfig.seo?.metaDescription || ""}
                  onChange={(e) => setPageConfig({ ...pageConfig, seo: { ...pageConfig.seo, metaDescription: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Keywords (Comma-separated)</label>
                <input
                  type="text"
                  value={pageConfig.seo?.keywords || ""}
                  onChange={(e) => setPageConfig({ ...pageConfig, seo: { ...pageConfig.seo, keywords: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleSavePageConfig}
              disabled={saving}
              style={{ padding: "10px 24px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer" }}
            >
              {saving ? "Saving…" : "💾 Save Visibility & SEO"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 5: BULK CSV IMPORT ─── */}
      {activeTab === "import" && (
        <div style={{ display: "grid", gap: 20, maxWidth: 840 }}>
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 10px" }}>
              Bulk CSV Location Importer
            </h4>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px", lineHeight: 1.6 }}>
              Import dozens or hundreds of store and distributor locations in seconds using CSV. Existing locations will not be overwritten.
            </p>

            <form onSubmit={handleImportCSV} style={{ display: "grid", gap: 16 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Option A: Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  style={{ fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Option B: Or Paste CSV Raw Text
                </label>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={`name,type,contact,phone,address,city,state,pincode,latitude,longitude\n"Apollo Clinic","pharmacy","Ramesh","9811122233","Connaught Place","New Delhi","Delhi","110001",28.6315,77.2167`}
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 12, fontFamily: "monospace" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="submit"
                  disabled={importing}
                  style={{ padding: "10px 24px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: importing ? "wait" : "pointer" }}
                >
                  {importing ? "Importing Locations…" : "🚀 Run CSV Import"}
                </button>
              </div>
            </form>

            {importResult && (
              <div style={{ marginTop: 16, padding: 14, background: "#e9f7e9", border: "1px solid #c3e6cb", borderRadius: 4, color: "#2e7d32", fontSize: 13 }}>
                <b>Import Completed:</b> {importResult.importedCount} locations successfully added.
                {importResult.errorsCount > 0 && (
                  <div style={{ color: "#b34141", marginTop: 6, fontSize: 12 }}>
                    <b>Errors ({importResult.errorsCount}):</b>
                    <ul>
                      {importResult.errors.map((err: string, i: number) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT LOCATION MODAL ─── */}
      {editingLoc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setEditingLoc(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 6,
              maxWidth: 740,
              width: "100%",
              padding: 28,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase" }}>
                  {isNew ? "Create Store / Distributor" : "Edit Store Location"}
                </span>
                <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>
                  {editingLoc.name || "New Location"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingLoc(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} style={{ display: "grid", gap: 16, fontSize: 13, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Store / Distributor Name <span style={{ color: "#b34141" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingLoc.name || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, name: e.target.value })}
                    placeholder="e.g. Apex Health Pharmacy"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Type / Category <span style={{ color: "#b34141" }}>*</span>
                  </label>
                  <select
                    value={editingLoc.type || "pharmacy"}
                    onChange={(e) => setEditingLoc({ ...editingLoc, type: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, background: "#fff" }}
                  >
                    <option value="pharmacy">Pharmacy</option>
                    <option value="retailer">Retailer</option>
                    <option value="distributor">Distributor</option>
                    <option value="stockist">Stockist</option>
                    <option value="authorized_partner">Authorized Partner</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>Contact Person</label>
                  <input
                    type="text"
                    value={editingLoc.contactPerson || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, contactPerson: e.target.value })}
                    placeholder="Dr. Rajesh Kumar"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>Phone Number</label>
                  <input
                    type="tel"
                    value={editingLoc.phone || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, phone: e.target.value })}
                    placeholder="+91 98111 22334"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>WhatsApp Number</label>
                  <input
                    type="tel"
                    value={editingLoc.whatsapp || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, whatsapp: e.target.value })}
                    placeholder="+91 98111 22334"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>Email Address</label>
                  <input
                    type="email"
                    value={editingLoc.email || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, email: e.target.value })}
                    placeholder="contact@store.in"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>Full Address</label>
                <input
                  type="text"
                  value={editingLoc.address || ""}
                  onChange={(e) => setEditingLoc({ ...editingLoc, address: e.target.value })}
                  placeholder="Shop No, Building, Road, Locality…"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    City <span style={{ color: "#b34141" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingLoc.city || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, city: e.target.value })}
                    placeholder="Mumbai"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    State <span style={{ color: "#b34141" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingLoc.state || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, state: e.target.value })}
                    placeholder="Maharashtra"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>PIN Code</label>
                  <input
                    type="text"
                    value={editingLoc.pincode || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, pincode: e.target.value })}
                    placeholder="400050"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>Latitude (GPS)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingLoc.latitude !== undefined ? editingLoc.latitude : ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="19.0596"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>Longitude (GPS)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingLoc.longitude !== undefined ? editingLoc.longitude : ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                    placeholder="72.8295"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>Region / Territory</label>
                  <input
                    type="text"
                    value={editingLoc.region || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, region: e.target.value })}
                    placeholder="Western Zone"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>Opening Hours</label>
                  <input
                    type="text"
                    value={editingLoc.openingHours || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, openingHours: e.target.value })}
                    placeholder="Mon-Sat: 09:30 AM - 09:00 PM"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>Custom Directions URL</label>
                  <input
                    type="text"
                    value={editingLoc.directionsUrl || ""}
                    onChange={(e) => setEditingLoc({ ...editingLoc, directionsUrl: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 20, background: "#faf8f5", padding: 12, borderRadius: 4, border: "1px solid var(--line)", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editingLoc.isAuthorized !== false}
                    onChange={(e) => setEditingLoc({ ...editingLoc, isAuthorized: e.target.checked })}
                  />
                  <span>Authorized Partner</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={Boolean(editingLoc.isFeatured)}
                    onChange={(e) => setEditingLoc({ ...editingLoc, isFeatured: e.target.checked })}
                  />
                  <span>Featured ⭐</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={editingLoc.isVisible !== false}
                    onChange={(e) => setEditingLoc({ ...editingLoc, isVisible: e.target.checked })}
                  />
                  <span>Publicly Visible</span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditingLoc(null)}
                  style={{ padding: "8px 16px", background: "#fff", border: "1px solid var(--line)", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={modalSaving}
                  style={{ padding: "8px 24px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontWeight: 700, cursor: modalSaving ? "wait" : "pointer" }}
                >
                  {modalSaving ? "Saving…" : "💾 Save Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
