"use client";

import React, { useState, useEffect } from "react";
import type { B2BApplication, B2BPageConfig, B2BCustomSection } from "@/lib/commerce/store-extensions";

export default function B2BManagement() {
  const [activeTab, setActiveTab] = useState<"enquiries" | "cms-hero" | "cms-advantages" | "cms-models" | "cms-process" | "cms-custom" | "form-seo" | "distributors">("enquiries");
  const [applications, setApplications] = useState<B2BApplication[]>([]);
  const [distributors, setDistributors] = useState<Record<string, unknown>[]>([]);
  const [pageConfig, setPageConfig] = useState<B2BPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Search, Filter & Sort state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "company" | "status">("newest");

  // Selected application for Dossier modal
  const [selectedApp, setSelectedApp] = useState<B2BApplication | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [dossierNotes, setDossierNotes] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/b2b");
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setDistributors(data.distributors || []);
        if (data.pageConfig) setPageConfig(data.pageConfig);
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to load B2B data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: string, notes?: string) => {
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/b2b/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });
      if (res.ok) {
        const data = await res.json();
        setApplications((prev) => prev.map((a) => (a.id === id ? data.application : a)));
        if (selectedApp && selectedApp.id === id) {
          setSelectedApp(data.application);
        }
        setFeedback({ type: "success", msg: `Status updated to "${newStatus}".` });
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to update status." });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async (id: string, company: string) => {
    if (!confirm(`Are you sure you want to permanently delete the enquiry from "${company}"?`)) return;
    try {
      const res = await fetch(`/api/admin/b2b/${id}`, { method: "DELETE" });
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== id));
        if (selectedApp?.id === id) setSelectedApp(null);
        setFeedback({ type: "success", msg: "Enquiry record deleted successfully." });
      }
    } catch {}
  };

  const handleSavePageConfig = async () => {
    if (!pageConfig) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/b2b/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageConfig),
      });
      if (res.ok) {
        setFeedback({ type: "success", msg: "B2B Page CMS settings saved successfully." });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: "error", msg: "Failed to save B2B page settings." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  // Filter & Sort applications
  const filteredApps = applications
    .filter((app) => {
      const term = search.toLowerCase();
      const matchesSearch =
        !search ||
        (app.company && app.company.toLowerCase().includes(term)) ||
        (app.name && app.name.toLowerCase().includes(term)) ||
        (app.email && app.email.toLowerCase().includes(term)) ||
        (app.phone && app.phone.toLowerCase().includes(term)) ||
        (app.id && app.id.toLowerCase().includes(term)) ||
        (app.city && app.city.toLowerCase().includes(term)) ||
        (app.state && app.state.toLowerCase().includes(term)) ||
        (app.pincode && app.pincode.toLowerCase().includes(term)) ||
        (app.gstNumber && app.gstNumber.toLowerCase().includes(term)) ||
        (app.panNumber && app.panNumber.toLowerCase().includes(term));

      const matchesStatus =
        statusFilter === "all" ||
        app.status === statusFilter ||
        (statusFilter === "new" && (app.status === "pending" || !app.status));

      const matchesType =
        typeFilter === "all" ||
        (app.partnershipType && app.partnershipType.toLowerCase() === typeFilter.toLowerCase()) ||
        (app.businessType && app.businessType.toLowerCase() === typeFilter.toLowerCase()) ||
        (app.type && app.type.toLowerCase() === typeFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "company") return (a.company || "").localeCompare(b.company || "");
      if (sortBy === "status") return (a.status || "").localeCompare(b.status || "");
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return sortBy === "newest" ? timeB - timeA : timeA - timeB;
    });

  if (loading || !pageConfig) {
    return <div style={{ padding: 30, color: "var(--muted)" }}>Loading B2B Management console…</div>;
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24, borderRadius: 6 }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Commercial &amp; Wholesale Division
          </span>
          <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>
            🏢 B2B &amp; Distribution Management
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Review distributor enquiries, manage commercial territory leads, configure complete public B2B CMS sections, and export partner records.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <a
            href="/b2b"
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
            href="/api/admin/export?dataset=b2b"
            download
            style={{
              padding: "9px 16px",
              background: "var(--purple)",
              color: "#D4AF37",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 2px 8px rgba(42,15,58,0.15)",
            }}
          >
            <span>📥 Export B2B Leads (Excel / CSV)</span>
          </a>
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
          { id: "enquiries", label: "Partnership Enquiries", count: applications.length },
          { id: "distributors", label: "Approved Distributors", count: distributors.length },
          { id: "cms-hero", label: "Hero & Trust Badges" },
          { id: "cms-advantages", label: `Advantages (${pageConfig.benefits.cards.length})` },
          { id: "cms-models", label: `Models (${pageConfig.partnershipTypes.types.length})` },
          { id: "cms-process", label: `Process Steps (${pageConfig.process.steps.length})` },
          { id: "cms-custom", label: `Custom Sections (${(pageConfig.customSections || []).length})` },
          { id: "form-seo", label: "Form, Store Locator & SEO" },
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

      {/* ─── TAB 1: PARTNERSHIP ENQUIRIES ─── */}
      {activeTab === "enquiries" && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search by company, contact person, email, phone, city, GST, PAN, ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: "9px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, minWidth: 280, flex: 1 }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
            >
              <option value="all">All Statuses ({applications.length})</option>
              <option value="new">New</option>
              <option value="pending">Pending</option>
              <option value="reviewing">Reviewing</option>
              <option value="contacted">Contacted</option>
              <option value="approved">Approved</option>
              <option value="on_hold">On Hold</option>
              <option value="closed">Closed / Completed</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
            >
              <option value="all">All Partnership Types</option>
              <option value="distributor">Distributor</option>
              <option value="stockist">Stockist</option>
              <option value="wholesaler">Wholesaler</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="clinic">Clinic / Hospital</option>
              <option value="doctor">Doctor / Healthcare</option>
              <option value="retailer">Retailer</option>
              <option value="corporate">Corporate</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{ padding: "9px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="company">Sort: Company Name</option>
              <option value="status">Sort: Status</option>
            </select>
          </div>

          {filteredApps.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#faf8f5", border: "1px dashed var(--line)", borderRadius: 4 }}>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>No B2B partnership enquiries found matching the criteria.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#faf8f5", borderBottom: "2px solid var(--line)" }}>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Enquiry ID &amp; Date</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Company / Business</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Contact Person</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Location &amp; Territory</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Partnership Interest</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Document</th>
                    <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Status</th>
                    <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.map((app) => (
                    <tr key={app.id} style={{ borderBottom: "1px solid var(--line)", background: app.status === "approved" ? "#fbfdfb" : "#fff" }}>
                      <td style={{ padding: "12px" }}>
                        <code style={{ fontSize: 11, color: "var(--purple)", fontWeight: 700 }}>{app.id}</code>
                        <span style={{ display: "block", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                          {new Date(app.createdAt || Date.now()).toLocaleDateString("en-IN")}
                        </span>
                      </td>

                      <td style={{ padding: "12px" }}>
                        <b style={{ display: "block", color: "var(--purple)", fontSize: 14 }}>{app.company}</b>
                        <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "capitalize" }}>
                          {app.businessType || "Business"}
                        </span>
                        {app.gstNumber && (
                          <span style={{ display: "block", fontSize: 10, color: "var(--muted)" }}>
                            GST: {app.gstNumber}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "12px" }}>
                        <span style={{ fontWeight: 600 }}>{app.name}</span>
                        {app.designation && <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>{app.designation}</span>}
                        <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>{app.email}</span>
                        <span style={{ display: "block", fontSize: 11, color: "var(--ink)" }}>📞 {app.phone}</span>
                        {app.whatsapp && <span style={{ display: "block", fontSize: 11, color: "#25D366" }}>💬 {app.whatsapp}</span>}
                      </td>

                      <td style={{ padding: "12px" }}>
                        <span>{app.city ? `${app.city}, ${app.state || "India"}` : app.state || "India"}</span>
                        {app.territory && (
                          <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>
                            Territory: {app.territory}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "12px" }}>
                        <span style={{ fontWeight: 600, textTransform: "capitalize", color: "var(--purple)" }}>
                          {app.partnershipType || app.type || "Distributor"}
                        </span>
                        {app.productInterest && (
                          <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>
                            Range: {app.productInterest}
                          </span>
                        )}
                        {app.requirementVolume && (
                          <span style={{ display: "block", fontSize: 10, color: "var(--ink)", fontWeight: 600 }}>
                            Vol: {app.requirementVolume}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "12px" }}>
                        {app.documentUrl ? (
                          <a
                            href={app.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: "4px 8px",
                              background: "#f0ebfa",
                              color: "var(--purple)",
                              border: "1px solid rgba(42,15,58,0.15)",
                              borderRadius: 3,
                              fontSize: 11,
                              fontWeight: 600,
                              textDecoration: "none",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <span>📑 Doc</span>
                            <span>↗</span>
                          </a>
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--muted)" }}>None</span>
                        )}
                      </td>

                      <td style={{ padding: "12px" }}>
                        <select
                          value={app.status || "new"}
                          disabled={savingStatus}
                          onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                          style={{
                            padding: "4px 8px",
                            fontSize: 11,
                            borderRadius: 3,
                            border: "1px solid var(--line)",
                            fontWeight: 700,
                            background:
                              app.status === "approved" ? "#e9f7e9" :
                              app.status === "reviewing" || app.status === "contacted" || app.status === "pending" ? "#fef3c7" :
                              app.status === "rejected" ? "#fee2e2" :
                              app.status === "closed" || app.status === "completed" ? "#e8f0fe" : "#fff",
                            color:
                              app.status === "approved" ? "#2e7d32" :
                              app.status === "rejected" ? "#b34141" : "var(--ink)",
                          }}
                        >
                          <option value="new">New</option>
                          <option value="pending">Pending</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="contacted">Contacted</option>
                          <option value="approved">Approved</option>
                          <option value="on_hold">On Hold</option>
                          <option value="closed">Closed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>

                      <td style={{ padding: "12px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedApp(app);
                              setDossierNotes(app.notes || "");
                            }}
                            style={{ padding: "4px 10px", fontSize: 11, background: "#fff", border: "1px solid var(--line)", borderRadius: 3, cursor: "pointer", fontWeight: 700, color: "var(--purple)" }}
                          >
                            Dossier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(app.id, app.company)}
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

      {/* ─── TAB 2: APPROVED DISTRIBUTORS ─── */}
      {activeTab === "distributors" && (
        <div>
          <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 16px" }}>
            Active Commercial Distributors &amp; Stockists
          </h4>
          {distributors.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", background: "#faf8f5", border: "1px dashed var(--line)", borderRadius: 4 }}>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>No approved distributors yet. Approve a partnership enquiry to onboard a distributor.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#faf8f5", borderBottom: "2px solid var(--line)" }}>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase" }}>Company</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase" }}>Contact Person</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase" }}>Email &amp; Phone</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase" }}>Pricing Tier</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {distributors.map((d: any) => (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "12px" }}><b style={{ color: "var(--purple)" }}>{d.company}</b></td>
                    <td style={{ padding: "12px" }}>{d.contactName || d.name}</td>
                    <td style={{ padding: "12px" }}>{d.email} · {d.phone || "—"}</td>
                    <td style={{ padding: "12px" }}><span style={{ padding: "2px 8px", background: "#f0ebfa", color: "var(--purple)", borderRadius: 3, fontWeight: 700, fontSize: 11 }}>{d.pricingTier || "Tier 1 - Wholesale"}</span></td>
                    <td style={{ padding: "12px" }}><span style={{ padding: "2px 8px", background: "#e9f7e9", color: "#2e7d32", borderRadius: 3, fontWeight: 700, fontSize: 11 }}>ACTIVE</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─── TAB 3: HERO & TRUST BADGES ─── */}
      {activeTab === "cms-hero" && (
        <div style={{ display: "grid", gap: 24, maxWidth: 840 }}>
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: 0 }}>
                Hero Section Copy &amp; Media
              </h4>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <span>Section Visible:</span>
                <input
                  type="checkbox"
                  checked={pageConfig.hero.visible !== false}
                  onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, visible: e.target.checked } })}
                  style={{ accentColor: "var(--purple)" }}
                />
              </label>
            </div>

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
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Subtitle / Clinical Subheading</label>
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

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Primary CTA Text</label>
                  <input
                    type="text"
                    value={pageConfig.hero.primaryCta?.text || pageConfig.hero.ctaText || "Apply for Partnership"}
                    onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, ctaText: e.target.value, primaryCta: { ...(pageConfig.hero.primaryCta || { link: "#enquiry-form", visible: true }), text: e.target.value } } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Primary CTA Link</label>
                  <input
                    type="text"
                    value={pageConfig.hero.primaryCta?.link || pageConfig.hero.ctaLink || "#enquiry-form"}
                    onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, ctaLink: e.target.value, primaryCta: { ...(pageConfig.hero.primaryCta || { text: "Apply for Partnership", visible: true }), link: e.target.value } } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: 0 }}>
                Hero Metric Badges ({pageConfig.hero.trustBadges?.length || 0})
              </h4>
              <button
                type="button"
                onClick={() => {
                  const updated = [...(pageConfig.hero.trustBadges || []), { top: "New Badge", bottom: "Description", icon: "💎" }];
                  setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, trustBadges: updated } });
                }}
                style={{ padding: "4px 10px", fontSize: 11, background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 3, cursor: "pointer", fontWeight: 700 }}
              >
                + Add Badge
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
              {(pageConfig.hero.trustBadges || []).map((badge, idx) => (
                <div key={idx} style={{ background: "#fff", padding: 10, borderRadius: 4, border: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)" }}>Badge #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (pageConfig.hero.trustBadges || []).filter((_, i) => i !== idx);
                        setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, trustBadges: updated } });
                      }}
                      style={{ background: "none", border: "none", color: "#b34141", fontSize: 11, cursor: "pointer" }}
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    value={badge.top}
                    onChange={(e) => {
                      const updated = [...(pageConfig.hero.trustBadges || [])];
                      updated[idx] = { ...updated[idx], top: e.target.value };
                      setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, trustBadges: updated } });
                    }}
                    placeholder="Top Text"
                    style={{ width: "100%", padding: "4px 8px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 12, fontWeight: 700, marginBottom: 4 }}
                  />
                  <input
                    type="text"
                    value={badge.bottom}
                    onChange={(e) => {
                      const updated = [...(pageConfig.hero.trustBadges || [])];
                      updated[idx] = { ...updated[idx], bottom: e.target.value };
                      setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, trustBadges: updated } });
                    }}
                    placeholder="Bottom Label"
                    style={{ width: "100%", padding: "4px 8px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 11 }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleSavePageConfig}
              disabled={saving}
              style={{ padding: "10px 24px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer" }}
            >
              {saving ? "Saving…" : "💾 Save Hero CMS"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 4: ADVANTAGES CARDS ─── */}
      {activeTab === "cms-advantages" && (
        <div style={{ display: "grid", gap: 20, maxWidth: 840 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: 0 }}>
                Wholesale &amp; Distribution Advantages
              </h4>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>Add, reorder, show/hide or edit advantage cards.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newCard = {
                  id: `b2b-ben-${Date.now()}`,
                  icon: "✨",
                  title: "New Commercial Advantage",
                  description: "Describe this commercial or distribution advantage in detail.",
                  visible: true,
                  sortOrder: pageConfig.benefits.cards.length + 1,
                };
                setPageConfig({
                  ...pageConfig,
                  benefits: { ...pageConfig.benefits, cards: [...pageConfig.benefits.cards, newCard] },
                });
              }}
              style={{ padding: "6px 14px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              + Add Advantage Card
            </button>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Section Heading</label>
              <input
                type="text"
                value={pageConfig.benefits.heading}
                onChange={(e) => setPageConfig({ ...pageConfig, benefits: { ...pageConfig.benefits, heading: e.target.value } })}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Section Description</label>
              <input
                type="text"
                value={pageConfig.benefits.description}
                onChange={(e) => setPageConfig({ ...pageConfig, benefits: { ...pageConfig.benefits, description: e.target.value } })}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {pageConfig.benefits.cards.map((card, idx) => (
              <div key={card.id || idx} style={{ background: "#faf8f5", padding: 16, borderRadius: 6, border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--purple)" }}>Card #{idx + 1}</span>
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        const updated = [...pageConfig.benefits.cards];
                        const temp = updated[idx];
                        updated[idx] = updated[idx - 1];
                        updated[idx - 1] = temp;
                        setPageConfig({ ...pageConfig, benefits: { ...pageConfig.benefits, cards: updated } });
                      }}
                      style={{ padding: "2px 6px", fontSize: 10, cursor: idx === 0 ? "not-allowed" : "pointer" }}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      disabled={idx === pageConfig.benefits.cards.length - 1}
                      onClick={() => {
                        const updated = [...pageConfig.benefits.cards];
                        const temp = updated[idx];
                        updated[idx] = updated[idx + 1];
                        updated[idx + 1] = temp;
                        setPageConfig({ ...pageConfig, benefits: { ...pageConfig.benefits, cards: updated } });
                      }}
                      style={{ padding: "2px 6px", fontSize: 10, cursor: idx === pageConfig.benefits.cards.length - 1 ? "not-allowed" : "pointer" }}
                    >
                      ▼
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={card.visible !== false}
                        onChange={(e) => {
                          const updated = [...pageConfig.benefits.cards];
                          updated[idx] = { ...updated[idx], visible: e.target.checked };
                          setPageConfig({ ...pageConfig, benefits: { ...pageConfig.benefits, cards: updated } });
                        }}
                      />
                      <span>Visible</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = pageConfig.benefits.cards.filter((_, i) => i !== idx);
                        setPageConfig({ ...pageConfig, benefits: { ...pageConfig.benefits, cards: updated } });
                      }}
                      style={{ background: "none", border: "none", color: "#b34141", fontSize: 12, cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 10, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Icon</label>
                    <input
                      type="text"
                      value={card.icon}
                      onChange={(e) => {
                        const updated = [...pageConfig.benefits.cards];
                        updated[idx] = { ...updated[idx], icon: e.target.value };
                        setPageConfig({ ...pageConfig, benefits: { ...pageConfig.benefits, cards: updated } });
                      }}
                      style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 3, textAlign: "center", fontSize: 16 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Card Title</label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => {
                        const updated = [...pageConfig.benefits.cards];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setPageConfig({ ...pageConfig, benefits: { ...pageConfig.benefits, cards: updated } });
                      }}
                      style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 13, fontWeight: 600 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Description</label>
                  <textarea
                    rows={2}
                    value={card.description}
                    onChange={(e) => {
                      const updated = [...pageConfig.benefits.cards];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      setPageConfig({ ...pageConfig, benefits: { ...pageConfig.benefits, cards: updated } });
                    }}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 12, fontFamily: "inherit" }}
                  />
                </div>
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
              {saving ? "Saving…" : "💾 Save Advantages"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 5: PARTNERSHIP MODELS ─── */}
      {activeTab === "cms-models" && (
        <div style={{ display: "grid", gap: 20, maxWidth: 840 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: 0 }}>
                Partnership Ecosystems &amp; Collaboration Models
              </h4>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>Manage partnership tiers and collaboration perks.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newModel = {
                  id: `pt-${Date.now()}`,
                  title: "New Collaboration Tier",
                  badge: "Exclusive",
                  description: "Model description and scope of partnership.",
                  perks: ["Dedicated perk 1", "Dedicated perk 2"],
                  visible: true,
                  sortOrder: pageConfig.partnershipTypes.types.length + 1,
                };
                setPageConfig({
                  ...pageConfig,
                  partnershipTypes: { ...pageConfig.partnershipTypes, types: [...pageConfig.partnershipTypes.types, newModel] },
                });
              }}
              style={{ padding: "6px 14px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              + Add Partnership Model
            </button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {pageConfig.partnershipTypes.types.map((pt, idx) => (
              <div key={pt.id || idx} style={{ background: "#faf8f5", padding: 16, borderRadius: 6, border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--purple)" }}>Model #{idx + 1}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={pt.visible !== false}
                        onChange={(e) => {
                          const updated = [...pageConfig.partnershipTypes.types];
                          updated[idx] = { ...updated[idx], visible: e.target.checked };
                          setPageConfig({ ...pageConfig, partnershipTypes: { ...pageConfig.partnershipTypes, types: updated } });
                        }}
                      />
                      <span>Visible</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = pageConfig.partnershipTypes.types.filter((_, i) => i !== idx);
                        setPageConfig({ ...pageConfig, partnershipTypes: { ...pageConfig.partnershipTypes, types: updated } });
                      }}
                      style={{ background: "none", border: "none", color: "#b34141", fontSize: 12, cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 10, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Model Title</label>
                    <input
                      type="text"
                      value={pt.title}
                      onChange={(e) => {
                        const updated = [...pageConfig.partnershipTypes.types];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setPageConfig({ ...pageConfig, partnershipTypes: { ...pageConfig.partnershipTypes, types: updated } });
                      }}
                      style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 13, fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Badge / Tier</label>
                    <input
                      type="text"
                      value={pt.badge}
                      onChange={(e) => {
                        const updated = [...pageConfig.partnershipTypes.types];
                        updated[idx] = { ...updated[idx], badge: e.target.value };
                        setPageConfig({ ...pageConfig, partnershipTypes: { ...pageConfig.partnershipTypes, types: updated } });
                      }}
                      style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 12 }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Description</label>
                  <textarea
                    rows={2}
                    value={pt.description}
                    onChange={(e) => {
                      const updated = [...pageConfig.partnershipTypes.types];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      setPageConfig({ ...pageConfig, partnershipTypes: { ...pageConfig.partnershipTypes, types: updated } });
                    }}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 12, fontFamily: "inherit" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Perks (Comma-separated)</label>
                  <input
                    type="text"
                    value={(pt.perks || []).join(", ")}
                    onChange={(e) => {
                      const updated = [...pageConfig.partnershipTypes.types];
                      updated[idx] = { ...updated[idx], perks: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) };
                      setPageConfig({ ...pageConfig, partnershipTypes: { ...pageConfig.partnershipTypes, types: updated } });
                    }}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 12 }}
                  />
                </div>
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
              {saving ? "Saving…" : "💾 Save Partnership Models"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 6: PROCESS STEPS ─── */}
      {activeTab === "cms-process" && (
        <div style={{ display: "grid", gap: 20, maxWidth: 840 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: 0 }}>
                Onboarding Roadmap Steps
              </h4>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>Edit structured onboarding pathway for new distributors.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextNum = pageConfig.process.steps.length + 1;
                const newStep = {
                  stepNumber: nextNum,
                  title: `Step ${nextNum}: Onboarding Action`,
                  description: "Description of onboarding verification and terms.",
                  icon: "📝",
                  visible: true,
                };
                setPageConfig({
                  ...pageConfig,
                  process: { ...pageConfig.process, steps: [...pageConfig.process.steps, newStep] },
                });
              }}
              style={{ padding: "6px 14px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              + Add Step
            </button>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {pageConfig.process.steps.map((step, idx) => (
              <div key={idx} style={{ background: "#faf8f5", padding: 16, borderRadius: 6, border: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--purple)" }}>Step #{idx + 1}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={step.visible !== false}
                        onChange={(e) => {
                          const updated = [...pageConfig.process.steps];
                          updated[idx] = { ...updated[idx], visible: e.target.checked };
                          setPageConfig({ ...pageConfig, process: { ...pageConfig.process, steps: updated } });
                        }}
                      />
                      <span>Visible</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = pageConfig.process.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, stepNumber: i + 1 }));
                        setPageConfig({ ...pageConfig, process: { ...pageConfig.process, steps: updated } });
                      }}
                      style={{ background: "none", border: "none", color: "#b34141", fontSize: 12, cursor: "pointer" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 10, marginBottom: 8 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Icon</label>
                    <input
                      type="text"
                      value={step.icon}
                      onChange={(e) => {
                        const updated = [...pageConfig.process.steps];
                        updated[idx] = { ...updated[idx], icon: e.target.value };
                        setPageConfig({ ...pageConfig, process: { ...pageConfig.process, steps: updated } });
                      }}
                      style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 3, textAlign: "center", fontSize: 16 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Step Heading</label>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        const updated = [...pageConfig.process.steps];
                        updated[idx] = { ...updated[idx], title: e.target.value };
                        setPageConfig({ ...pageConfig, process: { ...pageConfig.process, steps: updated } });
                      }}
                      style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 13, fontWeight: 600 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Description</label>
                  <textarea
                    rows={2}
                    value={step.description}
                    onChange={(e) => {
                      const updated = [...pageConfig.process.steps];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      setPageConfig({ ...pageConfig, process: { ...pageConfig.process, steps: updated } });
                    }}
                    style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 12, fontFamily: "inherit" }}
                  />
                </div>
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
              {saving ? "Saving…" : "💾 Save Process Roadmap"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 7: CUSTOM SECTIONS ─── */}
      {activeTab === "cms-custom" && (
        <div style={{ display: "grid", gap: 20, maxWidth: 840 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: 0 }}>
                Custom B2B Content Sections
              </h4>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>Create additional custom clinical, facility, or distribution sections.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newSection: B2BCustomSection = {
                  id: `sec-${Date.now()}`,
                  heading: "Quality & Cold Chain Integrity",
                  subheading: "Validated Pharmaceutical Logistics",
                  content: "All batches are dispatched in insulated temperature-monitored packaging with tamper-evident digital tracking.",
                  layout: "text_only",
                  visible: true,
                  sortOrder: (pageConfig.customSections || []).length + 1,
                };
                setPageConfig({
                  ...pageConfig,
                  customSections: [...(pageConfig.customSections || []), newSection],
                });
              }}
              style={{ padding: "6px 14px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              + Create Custom Section
            </button>
          </div>

          {(pageConfig.customSections || []).length === 0 ? (
            <div style={{ padding: "30px 20px", background: "#faf8f5", border: "1px dashed var(--line)", borderRadius: 6, textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>No custom sections created yet. Click above to add custom sections to the B2B portal.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {(pageConfig.customSections || []).map((sec, idx) => (
                <div key={sec.id || idx} style={{ background: "#faf8f5", padding: 16, borderRadius: 6, border: "1px solid var(--line)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--purple)" }}>Custom Section #{idx + 1}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={sec.visible !== false}
                          onChange={(e) => {
                            const updated = [...(pageConfig.customSections || [])];
                            updated[idx] = { ...updated[idx], visible: e.target.checked };
                            setPageConfig({ ...pageConfig, customSections: updated });
                          }}
                        />
                        <span>Visible</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (pageConfig.customSections || []).filter((_, i) => i !== idx);
                          setPageConfig({ ...pageConfig, customSections: updated });
                        }}
                        style={{ background: "none", border: "none", color: "#b34141", fontSize: 12, cursor: "pointer" }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Section Heading</label>
                      <input
                        type="text"
                        value={sec.heading}
                        onChange={(e) => {
                          const updated = [...(pageConfig.customSections || [])];
                          updated[idx] = { ...updated[idx], heading: e.target.value };
                          setPageConfig({ ...pageConfig, customSections: updated });
                        }}
                        style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 13, fontWeight: 600 }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Subheading</label>
                      <input
                        type="text"
                        value={sec.subheading || ""}
                        onChange={(e) => {
                          const updated = [...(pageConfig.customSections || [])];
                          updated[idx] = { ...updated[idx], subheading: e.target.value };
                          setPageConfig({ ...pageConfig, customSections: updated });
                        }}
                        style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 12 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, display: "block", marginBottom: 2 }}>Content</label>
                    <textarea
                      rows={3}
                      value={sec.content}
                      onChange={(e) => {
                        const updated = [...(pageConfig.customSections || [])];
                        updated[idx] = { ...updated[idx], content: e.target.value };
                        setPageConfig({ ...pageConfig, customSections: updated });
                      }}
                      style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 12, fontFamily: "inherit" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleSavePageConfig}
              disabled={saving}
              style={{ padding: "10px 24px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontWeight: 700, fontSize: 13, cursor: saving ? "wait" : "pointer" }}
            >
              {saving ? "Saving…" : "💾 Save Custom Sections"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 8: FORM, STORE LOCATOR CTA & SEO ─── */}
      {activeTab === "form-seo" && (
        <div style={{ display: "grid", gap: 24, maxWidth: 840 }}>
          {/* Master Page Published Toggle */}
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 14px" }}>
              1. B2B Page Master Visibility &amp; Form Controls
            </h4>

            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: 14, borderRadius: 4, border: "1px solid var(--line)" }}>
                <div>
                  <b style={{ fontSize: 13, display: "block" }}>B2B Page Public Status (Published / Hidden)</b>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Controls whether the /b2b public route is accessible.</span>
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

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: 14, borderRadius: 4, border: "1px solid var(--line)" }}>
                <div>
                  <b style={{ fontSize: 13, display: "block" }}>Accepting B2B Enquiries (Form ON / OFF)</b>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>When OFF, form displays scheduled review notice and API blocks submissions.</span>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: pageConfig.formConfig.enabled ? "#2e7d32" : "#b34141" }}>
                    {pageConfig.formConfig.enabled ? "FORM ON" : "FORM OFF"}
                  </span>
                  <input
                    type="checkbox"
                    checked={pageConfig.formConfig.enabled}
                    onChange={(e) => setPageConfig({ ...pageConfig, formConfig: { ...pageConfig.formConfig, enabled: e.target.checked } })}
                    style={{ width: 18, height: 18, accentColor: "var(--purple)" }}
                  />
                </label>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Contact Email</label>
                  <input
                    type="email"
                    value={pageConfig.formConfig.contactEmail}
                    onChange={(e) => setPageConfig({ ...pageConfig, formConfig: { ...pageConfig.formConfig, contactEmail: e.target.value } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Contact Phone</label>
                  <input
                    type="text"
                    value={pageConfig.formConfig.contactPhone}
                    onChange={(e) => setPageConfig({ ...pageConfig, formConfig: { ...pageConfig.formConfig, contactPhone: e.target.value } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Store Locator CTA Banner Control */}
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: 0 }}>
                2. Store Locator CTA Banner
              </h4>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                <span>Visible:</span>
                <input
                  type="checkbox"
                  checked={pageConfig.storeLocatorCta?.visible !== false}
                  onChange={(e) => setPageConfig({ ...pageConfig, storeLocatorCta: { ...pageConfig.storeLocatorCta, visible: e.target.checked } })}
                  style={{ accentColor: "var(--purple)" }}
                />
              </label>
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Banner Heading</label>
                <input
                  type="text"
                  value={pageConfig.storeLocatorCta?.heading || "Find a Store / Distributor Near You"}
                  onChange={(e) => setPageConfig({ ...pageConfig, storeLocatorCta: { ...pageConfig.storeLocatorCta, heading: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Banner Description</label>
                <textarea
                  rows={2}
                  value={pageConfig.storeLocatorCta?.description || "Locate verified Queens Care retail pharmacies, authorized clinics, and regional stockists near you."}
                  onChange={(e) => setPageConfig({ ...pageConfig, storeLocatorCta: { ...pageConfig.storeLocatorCta, description: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Button Text</label>
                  <input
                    type="text"
                    value={pageConfig.storeLocatorCta?.buttonText || "Find a Store / Distributor Near You →"}
                    onChange={(e) => setPageConfig({ ...pageConfig, storeLocatorCta: { ...pageConfig.storeLocatorCta, buttonText: e.target.value } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Button Link</label>
                  <input
                    type="text"
                    value={pageConfig.storeLocatorCta?.buttonLink || "/store-locator"}
                    onChange={(e) => setPageConfig({ ...pageConfig, storeLocatorCta: { ...pageConfig.storeLocatorCta, buttonLink: e.target.value } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEO Metadata */}
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 14px" }}>
              3. Search Engine &amp; Social Metadata (SEO)
            </h4>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>SEO Meta Title</label>
                <input
                  type="text"
                  value={pageConfig.seo.metaTitle}
                  onChange={(e) => setPageConfig({ ...pageConfig, seo: { ...pageConfig.seo, metaTitle: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>SEO Meta Description</label>
                <textarea
                  rows={2}
                  value={pageConfig.seo.metaDescription}
                  onChange={(e) => setPageConfig({ ...pageConfig, seo: { ...pageConfig.seo, metaDescription: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 12, fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Keywords (Comma-separated)</label>
                <input
                  type="text"
                  value={pageConfig.seo.keywords}
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
              {saving ? "Saving…" : "💾 Save Settings & SEO"}
            </button>
          </div>
        </div>
      )}

      {/* ─── COMPLETE CANDIDATE / LEAD DOSSIER MODAL ─── */}
      {selectedApp && (
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
          onClick={() => setSelectedApp(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 6,
              maxWidth: 760,
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
                  B2B Commercial Partnership Dossier
                </span>
                <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>
                  {selectedApp.company}
                </h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>
                  Enquiry ID: <code>{selectedApp.id}</code> · Received: {new Date(selectedApp.createdAt || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: 14, fontSize: 13, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              {/* Section 1: Contact Info */}
              <div style={{ background: "#faf8f5", padding: 14, borderRadius: 4, border: "1px solid var(--line)" }}>
                <b style={{ display: "block", color: "var(--purple)", marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  1. Contact Information
                </b>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><b>Contact Person:</b> {selectedApp.name} {selectedApp.designation ? `(${selectedApp.designation})` : ""}</div>
                  <div><b>Email:</b> <a href={`mailto:${selectedApp.email}`} style={{ color: "var(--purple)" }}>{selectedApp.email}</a></div>
                  <div><b>Phone:</b> <a href={`tel:${selectedApp.phone}`} style={{ color: "var(--purple)" }}>{selectedApp.phone}</a></div>
                  <div><b>WhatsApp:</b> {selectedApp.whatsapp || "Not provided"}</div>
                  {selectedApp.website && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <b>Website:</b> <a href={selectedApp.website.startsWith("http") ? selectedApp.website : `https://${selectedApp.website}`} target="_blank" rel="noopener noreferrer" style={{ color: "#1a73e8" }}>{selectedApp.website} ↗</a>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 2: Business & Territory Credentials */}
              <div style={{ background: "#faf8f5", padding: 14, borderRadius: 4, border: "1px solid var(--line)" }}>
                <b style={{ display: "block", color: "var(--purple)", marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em" }}>
                  2. Business &amp; Territory Credentials
                </b>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div><b>Business Type:</b> <span style={{ textTransform: "capitalize" }}>{selectedApp.businessType || "Distributor"}</span></div>
                  <div><b>Partnership Type:</b> <span style={{ textTransform: "capitalize", color: "var(--purple)", fontWeight: 700 }}>{selectedApp.partnershipType || selectedApp.type}</span></div>
                  <div><b>City &amp; State:</b> {selectedApp.city ? `${selectedApp.city}, ${selectedApp.state || "India"}` : selectedApp.state || "India"}</div>
                  <div><b>PIN Code:</b> {selectedApp.pincode || "—"}</div>
                  <div><b>GST Number:</b> {selectedApp.gstNumber || "Not provided"}</div>
                  <div><b>Drug Licence:</b> {selectedApp.drugLicence || "Not provided"}</div>
                  <div><b>PAN Number:</b> {selectedApp.panNumber || "Not provided"}</div>
                  <div><b>Years in Business:</b> {selectedApp.yearsInBusiness || "—"}</div>
                  <div><b>Stores/Clinics Covered:</b> {selectedApp.storeCount || "—"}</div>
                  {selectedApp.address && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <b>Business Address:</b> {selectedApp.address}
                    </div>
                  )}
                  {selectedApp.territory && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <b>Requested Territory:</b> <span style={{ fontWeight: 600 }}>{selectedApp.territory}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Commercial & Product Interest */}
              {(selectedApp.productInterest || selectedApp.requirementVolume || selectedApp.existingBrands) && (
                <div style={{ background: "#faf8f5", padding: 14, borderRadius: 4, border: "1px solid var(--line)" }}>
                  <b style={{ display: "block", color: "var(--purple)", marginBottom: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em" }}>
                    3. Commercial Interest &amp; Volume
                  </b>
                  <div style={{ display: "grid", gap: 6 }}>
                    {selectedApp.productInterest && <div><b>Product/Category Interest:</b> {selectedApp.productInterest}</div>}
                    {selectedApp.requirementVolume && <div><b>Expected Monthly Requirement:</b> <span style={{ fontWeight: 700 }}>{selectedApp.requirementVolume}</span></div>}
                    {selectedApp.existingBrands && <div><b>Existing Brands Handled:</b> {selectedApp.existingBrands}</div>}
                  </div>
                </div>
              )}

              {/* Message */}
              {selectedApp.message && (
                <div>
                  <b>Partnership Requirement Note:</b>
                  <p style={{ margin: "4px 0 0", background: "#fcfcfc", padding: 12, border: "1px solid var(--line)", borderRadius: 4, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                    {selectedApp.message}
                  </p>
                </div>
              )}

              {/* Uploaded Document */}
              {selectedApp.documentUrl && (
                <div style={{ background: "#f0ebfa", padding: 14, borderRadius: 4, border: "1px solid rgba(42,15,58,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <b style={{ display: "block", color: "var(--purple)" }}>📑 Attached Partner Document</b>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{selectedApp.documentFileName || "Document"}</span>
                  </div>
                  <a
                    href={selectedApp.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: "6px 14px",
                      background: "var(--purple)",
                      color: "#D4AF37",
                      borderRadius: 3,
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Open / Download Document ↗
                  </a>
                </div>
              )}

              {/* Review Notes & Status Editor */}
              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14, display: "grid", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Internal Commercial Review Notes:
                  </label>
                  <textarea
                    rows={2}
                    value={dossierNotes}
                    onChange={(e) => setDossierNotes(e.target.value)}
                    placeholder="Add territory notes, credit verification status, follow-up date…"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Status:</span>
                    <select
                      value={selectedApp.status || "new"}
                      onChange={(e) => {
                        handleStatusUpdate(selectedApp.id, e.target.value, dossierNotes);
                      }}
                      style={{ padding: "6px 10px", fontSize: 12, fontWeight: 700, borderRadius: 3, border: "1px solid var(--line)" }}
                    >
                      <option value="new">New</option>
                      <option value="pending">Pending</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="contacted">Contacted</option>
                      <option value="approved">Approved</option>
                      <option value="on_hold">On Hold</option>
                      <option value="closed">Closed</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedApp.id, selectedApp.status, dossierNotes)}
                      style={{ padding: "6px 12px", background: "#f0ebfa", color: "var(--purple)", border: "1px solid rgba(42,15,58,0.2)", borderRadius: 3, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      Save Notes
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedApp(null)}
                    style={{ padding: "8px 18px", background: "var(--purple)", color: "#fff", border: "none", borderRadius: 4, fontWeight: 700, cursor: "pointer" }}
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
