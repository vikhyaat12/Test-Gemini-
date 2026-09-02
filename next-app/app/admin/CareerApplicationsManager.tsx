"use client";

import React, { useState, useEffect } from "react";
import type { CareerApplication } from "@/lib/commerce/store-extensions";

export default function CareerApplicationsManager() {
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<CareerApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [savingStatus, setSavingStatus] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/careers");
      if (res.ok) {
        const d = await res.json();
        setApplications(d.applications || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: CareerApplication["status"]) => {
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/careers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const d = await res.json();
        setApplications((prev) => prev.map((a) => (a.id === id ? d.application : a)));
        if (selectedApp && selectedApp.id === id) {
          setSelectedApp(d.application);
        }
        setFeedback("Status updated successfully.");
        setTimeout(() => setFeedback(""), 3000);
      }
    } catch {
      setFeedback("Failed to update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this application record?")) return;
    try {
      const res = await fetch(`/api/admin/careers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setApplications((prev) => prev.filter((a) => a.id !== id));
        if (selectedApp?.id === id) setSelectedApp(null);
      }
    } catch {}
  };

  const filtered = applications.filter((app) => {
    const matchesSearch =
      !search ||
      app.name.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase()) ||
      app.position.toLowerCase().includes(search.toLowerCase()) ||
      (app.location && app.location.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24, borderRadius: 6 }}>
      {/* Header & Export */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Talent Acquisition
          </span>
          <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>
            💼 Career Applications & Resumes
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Review candidate applications, download submitted resumes, update hiring status, and export candidate data.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <a
            href="/api/admin/export?dataset=careers"
            download
            style={{
              padding: "9px 16px",
              background: "var(--purple)",
              color: "#fff",
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span>📥 Export to Excel / CSV</span>
          </a>
          <button
            type="button"
            onClick={loadData}
            style={{ padding: "8px 14px", background: "#fff", border: "1px solid var(--line)", borderRadius: 4, fontSize: 12, cursor: "pointer" }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{ padding: "8px 14px", background: "#e9f7e9", border: "1px solid #c3e6cb", color: "#2e7d32", fontSize: 12, borderRadius: 4, marginBottom: 16 }}>
          ✓ {feedback}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search candidates by name, email, role, city, company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "8px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, minWidth: 280, flex: 1 }}
        />

        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Status:</span>
          {["all", "new", "reviewing", "shortlisted", "interview", "selected", "on_hold", "rejected"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "5px 10px",
                fontSize: 11,
                borderRadius: 3,
                border: "none",
                background: statusFilter === st ? "var(--purple)" : "#f0ebfa",
                color: statusFilter === st ? "#fff" : "var(--purple)",
                cursor: "pointer",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table & Modal View */}
      {loading ? (
        <p style={{ color: "var(--muted)", fontSize: 13, padding: 20 }}>Loading candidates…</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", background: "#faf8f5", border: "1px dashed var(--line)", borderRadius: 4 }}>
          <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>No career applications found matching the criteria.</p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#faf8f5", borderBottom: "2px solid var(--line)" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>ID &amp; Date</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Candidate</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Position Applied</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Experience / Org</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Resume</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Status</th>
                <th style={{ textAlign: "right", padding: "10px 12px", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td style={{ padding: "12px" }}>
                    <code style={{ fontSize: 11, color: "var(--purple)", fontWeight: 700 }}>{app.id}</code>
                    <span style={{ display: "block", fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {new Date(app.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </td>

                  <td style={{ padding: "12px" }}>
                    <b style={{ display: "block", color: "var(--purple)" }}>{app.name}</b>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{app.email}</span>
                    <span style={{ display: "block", fontSize: 11, color: "var(--ink)" }}>📞 {app.phone}</span>
                    {app.whatsapp && <span style={{ display: "block", fontSize: 11, color: "#25D366" }}>💬 {app.whatsapp}</span>}
                  </td>

                  <td style={{ padding: "12px" }}>
                    <span style={{ fontWeight: 600 }}>{app.position}</span>
                    {app.department && <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>{app.department}</span>}
                  </td>

                  <td style={{ padding: "12px" }}>
                    <span>{app.experience || "—"}</span>
                    {app.currentCompany && <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>🏢 {app.currentCompany}</span>}
                    {(app.city || app.location) && <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>📍 {app.city || app.location}</span>}
                  </td>

                  <td style={{ padding: "12px" }}>
                    {app.resumeUrl ? (
                      <a
                        href={app.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: "4px 8px",
                          background: "#e8f0fe",
                          color: "#1a73e8",
                          border: "1px solid #c2d7fa",
                          borderRadius: 3,
                          fontSize: 11,
                          fontWeight: 600,
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <span>📄 View Resume</span>
                        <span>↗</span>
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>No file</span>
                    )}
                  </td>

                  <td style={{ padding: "12px" }}>
                    <select
                      value={app.status}
                      disabled={savingStatus}
                      onChange={(e) => handleStatusUpdate(app.id, e.target.value as CareerApplication["status"])}
                      style={{
                        padding: "4px 8px",
                        fontSize: 11,
                        borderRadius: 3,
                        border: "1px solid var(--line)",
                        fontWeight: 600,
                        background:
                          app.status === "selected" ? "#e9f7e9" :
                          app.status === "shortlisted" || app.status === "interview" ? "#fef3c7" :
                          app.status === "rejected" ? "#fee2e2" : "#fff",
                      }}
                    >
                      <option value="new">New</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="interview">Interview</option>
                      <option value="selected">Selected</option>
                      <option value="on_hold">On Hold</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>

                  <td style={{ padding: "12px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={() => setSelectedApp(app)}
                        style={{ padding: "4px 10px", fontSize: 11, background: "#fff", border: "1px solid var(--line)", borderRadius: 3, cursor: "pointer", fontWeight: 600 }}
                      >
                        Dossier
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(app.id)}
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

      {/* Detailed Modal / View */}
      {selectedApp && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
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
              maxWidth: 640,
              width: "100%",
              padding: 26,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase" }}>Candidate Dossier</span>
                <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>{selectedApp.name}</h3>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--muted)" }}>Applied for {selectedApp.position} · Reference: {selectedApp.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gap: 12, fontSize: 13, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><b>Email:</b> <a href={`mailto:${selectedApp.email}`} style={{ color: "var(--purple)" }}>{selectedApp.email}</a></div>
                <div><b>Phone:</b> <a href={`tel:${selectedApp.phone}`} style={{ color: "var(--purple)" }}>{selectedApp.phone}</a></div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><b>City / Location:</b> {selectedApp.city || selectedApp.location || "Not specified"}</div>
                <div><b>WhatsApp:</b> {selectedApp.whatsapp || "Not provided"}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div><b>Total Experience:</b> {selectedApp.experience || "Not specified"}</div>
                <div><b>Highest Qualification:</b> {selectedApp.highestQualification || "Not specified"}</div>
              </div>

              {(selectedApp.currentCompany || selectedApp.currentDesignation) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><b>Current Org:</b> {selectedApp.currentCompany || "—"}</div>
                  <div><b>Current Role:</b> {selectedApp.currentDesignation || "—"}</div>
                </div>
              )}

              {(selectedApp.linkedinUrl || selectedApp.portfolioUrl) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {selectedApp.linkedinUrl && (
                    <div>
                      <b>LinkedIn:</b>{" "}
                      <a href={selectedApp.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#0077b5" }}>
                        View Profile ↗
                      </a>
                    </div>
                  )}
                  {selectedApp.portfolioUrl && (
                    <div>
                      <b>Portfolio:</b>{" "}
                      <a href={selectedApp.portfolioUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#1a73e8" }}>
                        View Portfolio ↗
                      </a>
                    </div>
                  )}
                </div>
              )}

              {selectedApp.message && (
                <div style={{ background: "#faf8f5", padding: 14, borderRadius: 4, border: "1px solid var(--line)" }}>
                  <b style={{ display: "block", marginBottom: 4 }}>Cover Note / Introduction:</b>
                  <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{selectedApp.message}</p>
                </div>
              )}

              {selectedApp.resumeUrl && (
                <div style={{ background: "#f0ebfa", padding: 14, borderRadius: 4, border: "1px solid rgba(42,15,58,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <b style={{ display: "block", color: "var(--purple)" }}>📄 Candidate Resume / CV</b>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{selectedApp.resumeFileName || "Document"}</span>
                  </div>
                  <a
                    href={selectedApp.resumeUrl}
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
                    Open / Download Resume ↗
                  </a>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                <div>
                  <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", fontWeight: 700 }}>Hiring Decision:</span>
                  <select
                    value={selectedApp.status}
                    onChange={(e) => handleStatusUpdate(selectedApp.id, e.target.value as CareerApplication["status"])}
                    style={{ marginLeft: 8, padding: "6px 10px", fontSize: 12, fontWeight: 700, borderRadius: 3, border: "1px solid var(--line)" }}
                  >
                    <option value="new">New</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="interview">Interview</option>
                    <option value="selected">Selected</option>
                    <option value="on_hold">On Hold</option>
                    <option value="rejected">Rejected</option>
                  </select>
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
      )}
    </div>
  );
}
