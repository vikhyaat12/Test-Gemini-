"use client";

import React, { useState, useEffect } from "react";
import type { CareerJob, CareerPageConfig } from "@/lib/commerce/store-extensions";

export default function CareersCMSManager() {
  const [activeTab, setActiveTab] = useState<"content" | "jobs" | "seo">("jobs");
  const [pageConfig, setPageConfig] = useState<CareerPageConfig | null>(null);
  const [jobs, setJobs] = useState<CareerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Job editing modal state
  const [editingJob, setEditingJob] = useState<Partial<CareerJob> | null>(null);
  const [isNewJob, setIsNewJob] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");

  const loadData = async () => {
    try {
      setLoading(true);
      const [configRes, jobsRes] = await Promise.all([
        fetch("/api/admin/careers/page"),
        fetch("/api/admin/careers/jobs"),
      ]);

      if (configRes.ok) {
        const cd = await configRes.json();
        setPageConfig(cd.config);
      }
      if (jobsRes.ok) {
        const jd = await jobsRes.json();
        setJobs(jd.jobs || []);
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to load Careers CMS data." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePageConfig = async () => {
    if (!pageConfig) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/careers/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageConfig),
      });
      if (res.ok) {
        setFeedback({ type: "success", msg: "Careers page CMS & SEO settings saved successfully." });
        setTimeout(() => setFeedback(null), 3500);
      } else {
        setFeedback({ type: "error", msg: "Failed to save Careers page settings." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob || !editingJob.title?.trim()) return;
    setSaving(true);
    setFeedback(null);

    try {
      const payload = {
        ...editingJob,
        responsibilities: Array.isArray(editingJob.responsibilities)
          ? editingJob.responsibilities
          : String(editingJob.responsibilities || "")
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
        requirements: Array.isArray(editingJob.requirements)
          ? editingJob.requirements
          : String(editingJob.requirements || "")
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
        skills: Array.isArray(editingJob.skills)
          ? editingJob.skills
          : String(editingJob.skills || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
        benefits: Array.isArray(editingJob.benefits)
          ? editingJob.benefits
          : String(editingJob.benefits || "")
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean),
      };

      let res: Response;
      if (isNewJob) {
        res = await fetch("/api/admin/careers/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/careers/jobs/${editingJob.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setEditingJob(null);
        setFeedback({ type: "success", msg: isNewJob ? "Job opening created successfully." : "Job opening updated successfully." });
        loadData();
      } else {
        const err = await res.json();
        setFeedback({ type: "error", msg: err.error || "Failed to save job." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Network error saving job." });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleJobActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/careers/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (res.ok) {
        setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, active: !currentActive } : j)));
      }
    } catch {}
  };

  const handleToggleJobPublished = async (id: string, currentPublished: boolean) => {
    try {
      const res = await fetch(`/api/admin/careers/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !currentPublished }),
      });
      if (res.ok) {
        setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, published: !currentPublished } : j)));
      }
    } catch {}
  };

  const handleDuplicateJob = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/careers/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "duplicate" }),
      });
      if (res.ok) {
        setFeedback({ type: "success", msg: "Job opening duplicated as draft." });
        loadData();
      }
    } catch {}
  };

  const handleDeleteJob = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the job opening: "${title}"?`)) return;
    try {
      const res = await fetch(`/api/admin/careers/jobs/${id}`, { method: "DELETE" });
      if (res.ok) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
        setFeedback({ type: "success", msg: "Job opening deleted successfully." });
      }
    } catch {}
  };

  const handleMoveJob = async (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= jobs.length) return;
    const newJobs = [...jobs];
    const temp = newJobs[index];
    newJobs[index] = newJobs[targetIdx];
    newJobs[targetIdx] = temp;
    setJobs(newJobs);

    const orderedIds = newJobs.map((j) => j.id);
    await fetch("/api/admin/careers/jobs/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    });
  };

  const filteredJobs = jobs.filter((j) => {
    const matchesSearch =
      !jobSearch ||
      j.title.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.department.toLowerCase().includes(jobSearch.toLowerCase()) ||
      j.location.toLowerCase().includes(jobSearch.toLowerCase()) ||
      (j.skills && j.skills.some((sk) => sk.toLowerCase().includes(jobSearch.toLowerCase())));

    const matchesDept = departmentFilter === "all" || j.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const allDepartments = Array.from(new Set(jobs.map((j) => j.department).filter(Boolean)));

  if (loading || !pageConfig) {
    return <div style={{ padding: 30, color: "var(--muted)" }}>Loading Careers CMS…</div>;
  }

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24, borderRadius: 6 }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Talent Acquisition &amp; CMS
          </span>
          <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>
            💼 Careers Page CMS &amp; Open Opportunities
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Full control over the public Careers page, hero messaging, value cards, job openings CRUD, SEO, and visibility.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a
            href="/careers"
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

          <button
            type="button"
            onClick={() => {
              setEditingJob({
                title: "",
                department: "Research & Development",
                location: "New Delhi (Laboratory Campus)",
                workMode: "On-site",
                employmentType: "Full-Time",
                experience: "3-5 Years",
                qualification: "Bachelor's / Master's Degree",
                salaryRange: "",
                description: "",
                responsibilities: [],
                requirements: [],
                skills: [],
                benefits: [
                  "Comprehensive health & medical coverage",
                  "Continuous professional growth and learning sponsorships",
                  "Performance incentives & wellness product benefits"
                ],
                active: true,
                published: true,
                featured: false,
              });
              setIsNewJob(true);
            }}
            style={{
              padding: "9px 18px",
              background: "var(--purple)",
              color: "#D4AF37",
              border: "none",
              borderRadius: 4,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            + Create New Job Opening
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

      {/* Sub Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, borderBottom: "1px solid var(--line)", paddingBottom: 10 }}>
        {[
          { id: "jobs", label: "Job Openings & Roles", count: jobs.length },
          { id: "content", label: "Hero & Value Cards CMS" },
          { id: "seo", label: "Visibility, SEO & Alerts" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id as never)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
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

      {/* ─── TAB 1: JOB OPENINGS CRUD ─── */}
      {activeTab === "jobs" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Search jobs by title, department, location, skills…"
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              style={{ padding: "8px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, flex: 1, minWidth: 260 }}
            />

            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>Dept:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 12 }}
              >
                <option value="all">All Departments ({jobs.length})</option>
                {allDepartments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredJobs.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", background: "#faf8f5", border: "1px dashed var(--line)", borderRadius: 4 }}>
              <p style={{ margin: "0 0 12px", color: "var(--muted)", fontSize: 14 }}>No job openings found matching your criteria.</p>
              <button
                type="button"
                onClick={() => {
                  setEditingJob({
                    title: "",
                    department: "Research & Development",
                    location: "New Delhi (Laboratory Campus)",
                    workMode: "On-site",
                    employmentType: "Full-Time",
                    experience: "3-5 Years",
                    qualification: "Bachelor's / Master's Degree",
                    active: true,
                    published: true,
                  });
                  setIsNewJob(true);
                }}
                style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", borderRadius: 4, fontSize: 12, cursor: "pointer", fontWeight: 700 }}
              >
                + Add New Role
              </button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#faf8f5", borderBottom: "2px solid var(--line)" }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Order</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Job Title &amp; ID</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Department</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Location &amp; Mode</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Experience</th>
                    <th style={{ padding: "10px 12px", textAlign: "center", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Status</th>
                    <th style={{ padding: "10px 12px", textAlign: "right", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job, idx) => (
                    <tr key={job.id} style={{ borderBottom: "1px solid var(--line)", background: !job.active ? "#fff9f9" : !job.published ? "#fcfcfc" : "#fff" }}>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, minWidth: 16 }}>{idx + 1}</span>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveJob(idx, "up")}
                            style={{ border: "1px solid var(--line)", background: "#fff", padding: "2px 6px", fontSize: 10, cursor: idx === 0 ? "default" : "pointer", opacity: idx === 0 ? 0.3 : 1 }}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === filteredJobs.length - 1}
                            onClick={() => handleMoveJob(idx, "down")}
                            style={{ border: "1px solid var(--line)", background: "#fff", padding: "2px 6px", fontSize: 10, cursor: idx === filteredJobs.length - 1 ? "default" : "pointer", opacity: idx === filteredJobs.length - 1 ? 0.3 : 1 }}
                          >
                            ▼
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: "10px 12px" }}>
                        <b style={{ color: "var(--purple)", display: "block", fontSize: 14 }}>{job.title}</b>
                        <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 2 }}>
                          <code style={{ fontSize: 10, color: "var(--muted)" }}>{job.jobId}</code>
                          {job.featured && (
                            <span style={{ fontSize: 9, padding: "1px 5px", background: "#fef3c7", color: "#92400e", fontWeight: 700, borderRadius: 2 }}>
                              FEATURED
                            </span>
                          )}
                          <a
                            href={`/careers/job/${job.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ fontSize: 11, color: "#1a73e8", textDecoration: "none" }}
                          >
                            View Page ↗
                          </a>
                        </div>
                      </td>

                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ fontWeight: 600 }}>{job.department}</span>
                      </td>

                      <td style={{ padding: "10px 12px" }}>
                        <span>{job.location}</span>
                        <span style={{ display: "block", fontSize: 11, color: "var(--muted)" }}>
                          {job.workMode} · {job.employmentType}
                        </span>
                      </td>

                      <td style={{ padding: "10px 12px" }}>
                        <span>{job.experience}</span>
                      </td>

                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
                          <button
                            type="button"
                            onClick={() => handleToggleJobPublished(job.id, job.published)}
                            style={{
                              padding: "2px 8px",
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 3,
                              border: "none",
                              cursor: "pointer",
                              background: job.published ? "#e9f7e9" : "#fee2e2",
                              color: job.published ? "#2e7d32" : "#b34141",
                            }}
                            title="Click to toggle Published state"
                          >
                            {job.published ? "● PUBLISHED" : "○ DRAFT (HIDDEN)"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleJobActive(job.id, job.active)}
                            style={{
                              padding: "2px 8px",
                              fontSize: 10,
                              fontWeight: 700,
                              borderRadius: 3,
                              border: "none",
                              cursor: "pointer",
                              background: job.active ? "#e8f0fe" : "#f5f3ef",
                              color: job.active ? "#1a73e8" : "var(--muted)",
                            }}
                            title="Click to toggle Open/Closed status"
                          >
                            {job.active ? "ACCEPTING APPLICATIONS" : "CLOSED"}
                          </button>
                        </div>
                      </td>

                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingJob(job);
                              setIsNewJob(false);
                            }}
                            style={{ padding: "4px 10px", fontSize: 11, background: "#fff", border: "1px solid var(--line)", borderRadius: 3, cursor: "pointer", fontWeight: 600 }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDuplicateJob(job.id)}
                            style={{ padding: "4px 8px", fontSize: 11, background: "#fff", border: "1px solid var(--line)", borderRadius: 3, cursor: "pointer" }}
                            title="Duplicate as draft"
                          >
                            Clone
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteJob(job.id, job.title)}
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

      {/* ─── TAB 2: HERO & CULTURE CARDS CMS ─── */}
      {activeTab === "content" && (
        <div style={{ display: "grid", gap: 24, maxWidth: 840 }}>
          {/* Hero Editor */}
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 16px" }}>
              1. Careers Hero Section Copy &amp; Media
            </h4>

            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Hero Eyebrow Text
                </label>
                <input
                  type="text"
                  value={pageConfig.hero.eyebrow}
                  onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, eyebrow: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Hero Display Heading
                </label>
                <input
                  type="text"
                  value={pageConfig.hero.heading}
                  onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, heading: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 14, fontWeight: 600 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Hero Description Paragraph
                </label>
                <textarea
                  rows={3}
                  value={pageConfig.hero.description}
                  onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, description: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={pageConfig.hero.ctaText || ""}
                    onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, ctaText: e.target.value } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    CTA Button Target Link
                  </label>
                  <input
                    type="text"
                    value={pageConfig.hero.ctaLink || ""}
                    onChange={(e) => setPageConfig({ ...pageConfig, hero: { ...pageConfig.hero, ctaLink: e.target.value } })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3 Value / Culture Cards */}
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 16px" }}>
              2. Culture &amp; Value Cards
            </h4>

            <div style={{ display: "grid", gap: 14 }}>
              {pageConfig.cultureCards.map((card, idx) => (
                <div key={card.id || idx} style={{ background: "#fff", padding: 16, borderRadius: 4, border: "1px solid var(--line)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 12, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Icon</label>
                      <input
                        type="text"
                        value={card.icon}
                        onChange={(e) => {
                          const updated = [...pageConfig.cultureCards];
                          updated[idx] = { ...updated[idx], icon: e.target.value };
                          setPageConfig({ ...pageConfig, cultureCards: updated });
                        }}
                        style={{ width: "100%", padding: "6px 8px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 16, textAlign: "center" }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Card Title</label>
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => {
                          const updated = [...pageConfig.cultureCards];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setPageConfig({ ...pageConfig, cultureCards: updated });
                        }}
                        style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 13, fontWeight: 600 }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Card Description</label>
                    <textarea
                      rows={2}
                      value={card.description}
                      onChange={(e) => {
                        const updated = [...pageConfig.cultureCards];
                        updated[idx] = { ...updated[idx], description: e.target.value };
                        setPageConfig({ ...pageConfig, cultureCards: updated });
                      }}
                      style={{ width: "100%", padding: "6px 10px", border: "1px solid var(--line)", borderRadius: 3, fontSize: 12, fontFamily: "inherit" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleSavePageConfig}
              disabled={saving}
              style={{
                padding: "10px 24px",
                background: "var(--purple)",
                color: "#D4AF37",
                border: "none",
                borderRadius: 4,
                fontWeight: 700,
                fontSize: 13,
                cursor: saving ? "wait" : "pointer",
              }}
            >
              {saving ? "Saving Changes…" : "💾 Save Page Content CMS"}
            </button>
          </div>
        </div>
      )}

      {/* ─── TAB 3: VISIBILITY, SEO & NOTIFICATIONS ─── */}
      {activeTab === "seo" && (
        <div style={{ display: "grid", gap: 24, maxWidth: 840 }}>
          {/* Page Visibility */}
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 16px" }}>
              1. Careers Page Visibility Controls
            </h4>

            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: 14, borderRadius: 4, border: "1px solid var(--line)" }}>
                <div>
                  <b style={{ fontSize: 13, display: "block" }}>Public Careers Page Status</b>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>
                    When unpublished, visiting /careers shows a scheduled maintenance screen to public users while remaining accessible to logged-in admins.
                  </span>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: pageConfig.published ? "#2e7d32" : "#b34141" }}>
                    {pageConfig.published ? "PUBLISHED" : "UNPUBLISHED"}
                  </span>
                  <input
                    type="checkbox"
                    checked={pageConfig.published}
                    onChange={(e) => setPageConfig({ ...pageConfig, published: e.target.checked })}
                    style={{ width: 18, height: 18, accentColor: "var(--purple)" }}
                  />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: 14, borderRadius: 4, border: "1px solid var(--line)" }}>
                <div>
                  <b style={{ fontSize: 13, display: "block" }}>Show in Website Footer Links</b>
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>Displays a direct link to Careers in the corporate footer navigation.</span>
                </div>
                <input
                  type="checkbox"
                  checked={pageConfig.showInFooter}
                  onChange={(e) => setPageConfig({ ...pageConfig, showInFooter: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: "var(--purple)" }}
                />
              </div>
            </div>
          </div>

          {/* SEO Metadata */}
          <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)" }}>
            <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 16px" }}>
              2. Search Engine &amp; Social Metadata (SEO)
            </h4>

            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  SEO Page Title
                </label>
                <input
                  type="text"
                  value={pageConfig.seo.metaTitle}
                  onChange={(e) => setPageConfig({ ...pageConfig, seo: { ...pageConfig.seo, metaTitle: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Meta Description
                </label>
                <textarea
                  rows={3}
                  value={pageConfig.seo.metaDescription}
                  onChange={(e) => setPageConfig({ ...pageConfig, seo: { ...pageConfig.seo, metaDescription: e.target.value } })}
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Keywords (Comma-separated)
                </label>
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
              style={{
                padding: "10px 24px",
                background: "var(--purple)",
                color: "#D4AF37",
                border: "none",
                borderRadius: 4,
                fontWeight: 700,
                fontSize: 13,
                cursor: saving ? "wait" : "pointer",
              }}
            >
              {saving ? "Saving Changes…" : "💾 Save Visibility & SEO"}
            </button>
          </div>
        </div>
      )}

      {/* ─── JOB EDIT MODAL ─── */}
      {editingJob && (
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
          onClick={() => setEditingJob(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 6,
              maxWidth: 750,
              width: "100%",
              padding: 24,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase" }}>
                  {isNewJob ? "Create New Position" : "Edit Job Opening"}
                </span>
                <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>
                  {editingJob.title || "New Opportunity"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingJob(null)}
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "var(--muted)" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveJob} style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingJob.title || ""}
                    onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                    placeholder="e.g. Senior Formulation Scientist (R&D)"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Job ID / Code
                  </label>
                  <input
                    type="text"
                    value={editingJob.jobId || ""}
                    onChange={(e) => setEditingJob({ ...editingJob, jobId: e.target.value })}
                    placeholder="QC-JOB-RD-01"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Department
                  </label>
                  <input
                    type="text"
                    value={editingJob.department || ""}
                    onChange={(e) => setEditingJob({ ...editingJob, department: e.target.value })}
                    placeholder="e.g. Research & Development"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Work Mode
                  </label>
                  <select
                    value={editingJob.workMode || "On-site"}
                    onChange={(e) => setEditingJob({ ...editingJob, workMode: e.target.value as never })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  >
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote">Remote</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Employment Type
                  </label>
                  <select
                    value={editingJob.employmentType || "Full-Time"}
                    onChange={(e) => setEditingJob({ ...editingJob, employmentType: e.target.value as never })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Part-Time">Part-Time</option>
                    <option value="Contract">Contract</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Location / Campus
                  </label>
                  <input
                    type="text"
                    value={editingJob.location || ""}
                    onChange={(e) => setEditingJob({ ...editingJob, location: e.target.value })}
                    placeholder="e.g. New Delhi (Laboratory Campus)"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Required Experience
                  </label>
                  <input
                    type="text"
                    value={editingJob.experience || ""}
                    onChange={(e) => setEditingJob({ ...editingJob, experience: e.target.value })}
                    placeholder="e.g. 4-7 Years"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Salary / Compensation (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingJob.salaryRange || ""}
                    onChange={(e) => setEditingJob({ ...editingJob, salaryRange: e.target.value })}
                    placeholder="e.g. ₹14 - ₹20 LPA"
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Application Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={editingJob.deadline || ""}
                    onChange={(e) => setEditingJob({ ...editingJob, deadline: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Overview &amp; Purpose
                </label>
                <textarea
                  rows={3}
                  value={editingJob.description || ""}
                  onChange={(e) => setEditingJob({ ...editingJob, description: e.target.value })}
                  placeholder="Summary of the role and clinical impact…"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Key Responsibilities (One item per line)
                </label>
                <textarea
                  rows={4}
                  value={Array.isArray(editingJob.responsibilities) ? editingJob.responsibilities.join("\n") : String(editingJob.responsibilities || "")}
                  onChange={(e) => setEditingJob({ ...editingJob, responsibilities: e.target.value as never })}
                  placeholder="Design and execute novel topical and oral pharmaceutical formulations...&#10;Lead pre-formulation and stability testing per ICH guidelines..."
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Requirements &amp; Qualifications (One item per line)
                </label>
                <textarea
                  rows={4}
                  value={Array.isArray(editingJob.requirements) ? editingJob.requirements.join("\n") : String(editingJob.requirements || "")}
                  onChange={(e) => setEditingJob({ ...editingJob, requirements: e.target.value as never })}
                  placeholder="Master's degree in Pharmaceutics or Chemistry...&#10;4+ years in pharmaceutical formulations..."
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Skills &amp; Keywords (Comma-separated)
                </label>
                <input
                  type="text"
                  value={Array.isArray(editingJob.skills) ? editingJob.skills.join(", ") : String(editingJob.skills || "")}
                  onChange={(e) => setEditingJob({ ...editingJob, skills: e.target.value as never })}
                  placeholder="Formulations, HPLC, ICH Guidelines, ISO Cleanrooms"
                  style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                />
              </div>

              <div style={{ display: "flex", gap: 20, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editingJob.published !== false}
                    onChange={(e) => setEditingJob({ ...editingJob, published: e.target.checked })}
                    style={{ accentColor: "var(--purple)" }}
                  />
                  <span>Published on Website</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editingJob.active !== false}
                    onChange={(e) => setEditingJob({ ...editingJob, active: e.target.checked })}
                    style={{ accentColor: "var(--purple)" }}
                  />
                  <span>Active (Accepting Applications)</span>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(editingJob.featured)}
                    onChange={(e) => setEditingJob({ ...editingJob, featured: e.target.checked })}
                    style={{ accentColor: "var(--purple)" }}
                  />
                  <span>Featured Position</span>
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  style={{ padding: "8px 16px", background: "#fff", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: "8px 24px",
                    background: "var(--purple)",
                    color: "#D4AF37",
                    border: "none",
                    borderRadius: 4,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: saving ? "wait" : "pointer",
                  }}
                >
                  {saving ? "Saving…" : isNewJob ? "Create Opening" : "Save Opening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
