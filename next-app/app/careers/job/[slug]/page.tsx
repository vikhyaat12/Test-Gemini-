"use client";

import React, { useState, useEffect, useRef, use } from "react";
import Link from "next/link";
import type { CareerJob, CareerPageConfig } from "@/lib/commerce/store-extensions";

export default function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [job, setJob] = useState<CareerJob | null>(null);
  const [pageConfig, setPageConfig] = useState<CareerPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Application form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [city, setCity] = useState("");
  const [experience, setExperience] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [currentDesignation, setCurrentDesignation] = useState("");
  const [highestQualification, setHighestQualification] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [message, setMessage] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; msg: string; id?: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/careers/jobs/${slug}`);
        if (!res.ok) {
          setError("This opportunity could not be found or is no longer accepting submissions.");
          return;
        }
        const data = await res.json();
        setJob(data.job);
        setPageConfig(data.pageConfig);
      } catch {
        setError("Network error loading opportunity details.");
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!job) return;
    setSubmitting(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("email", email.trim());
      formData.append("phone", phone.trim());
      formData.append("whatsapp", whatsapp.trim());
      formData.append("city", city.trim());
      formData.append("position", job.title);
      formData.append("jobId", job.jobId || job.id);
      formData.append("department", job.department);
      formData.append("experience", experience.trim());
      formData.append("currentCompany", currentCompany.trim());
      formData.append("currentDesignation", currentDesignation.trim());
      formData.append("highestQualification", highestQualification.trim());
      formData.append("linkedinUrl", linkedinUrl.trim());
      formData.append("portfolioUrl", portfolioUrl.trim());
      formData.append("message", message.trim());
      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      const res = await fetch("/api/careers/apply", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ success: false, msg: data.error || "Failed to submit application." });
      } else {
        setFeedback({
          success: true,
          msg: data.message || "Your application has been received successfully!",
          id: data.application?.id,
        });
        setName("");
        setEmail("");
        setPhone("");
        setWhatsapp("");
        setCity("");
        setExperience("");
        setCurrentCompany("");
        setCurrentDesignation("");
        setHighestQualification("");
        setLinkedinUrl("");
        setPortfolioUrl("");
        setMessage("");
        setResumeFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch {
      setFeedback({ success: false, msg: "Network error occurred while submitting. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div style={{ background: "#faf8f5", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--purple)", font: "18px var(--font-display)" }}>Loading Opportunity Details…</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div style={{ background: "#faf8f5", minHeight: "100vh", color: "var(--ink)", padding: "80px 20px", textAlign: "center" }}>
        <h1 style={{ font: "36px var(--font-display)", color: "var(--purple)", margin: "0 0 16px" }}>Position Not Found</h1>
        <p style={{ fontSize: 15, color: "var(--muted)", maxWidth: 500, margin: "0 auto 24px" }}>
          {error || "This opening is no longer accepting applications or the link has expired."}
        </p>
        <Link
          href="/careers"
          style={{
            padding: "10px 24px",
            background: "var(--purple)",
            color: "#D4AF37",
            borderRadius: 4,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          ← Explore Active Opportunities
        </Link>
      </div>
    );
  }

  // JSON-LD structured data for Google Job Search
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: {
      "@type": "PropertyValue",
      name: "Queens Care Laboratories",
      value: job.jobId || job.id,
    },
    datePosted: job.createdAt,
    validThrough: job.deadline ? `${job.deadline}T23:59:59Z` : undefined,
    employmentType: job.employmentType.toUpperCase().replace("-", "_"),
    hiringOrganization: {
      "@type": "Organization",
      name: "Queens Care Laboratories",
      sameAs: "https://queenscare.in",
      logo: "https://queenscare.in/uploads/logos/queens-care-official-logo.png",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "IN",
      },
    },
    responsibilities: job.responsibilities.join("; "),
    qualifications: job.requirements.join("; "),
  };

  return (
    <div style={{ background: "#faf8f5", minHeight: "100vh", color: "var(--ink)", paddingBottom: 90 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--line)", background: "#fff", padding: "16px 5%" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" className="brand" aria-label="Queens Care home" style={{ textDecoration: "none" }}>
            <i>Q</i>
            <span>
              QUEENS<br />
              <b>CARE</b>
            </span>
          </Link>
          <Link href="/careers" style={{ fontSize: 12, textDecoration: "none", color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600 }}>
            ← Back to All Openings
          </Link>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <nav style={{ maxWidth: 1200, margin: "0 auto", padding: "20px 20px 0", fontSize: 12, color: "var(--muted)" }}>
        <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>Storefront</Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <Link href="/careers" style={{ color: "var(--muted)", textDecoration: "none" }}>Careers</Link>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "#D4AF37", fontWeight: 600 }}>{job.department}</span>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "var(--purple)", fontWeight: 700 }}>{job.title}</span>
      </nav>

      {/* Hero Title Section */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 20px 30px" }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", color: "#D4AF37" }}>
            {job.department}
          </span>
          <span style={{ color: "var(--line)" }}>•</span>
          <code style={{ fontSize: 11, color: "var(--muted)", background: "#fff", padding: "2px 6px", border: "1px solid var(--line)", borderRadius: 3 }}>
            {job.jobId || job.id}
          </code>
          {job.featured && (
            <span style={{ fontSize: 10, padding: "2px 8px", background: "#fef3c7", color: "#92400e", fontWeight: 700, borderRadius: 3 }}>
              FEATURED ROLE
            </span>
          )}
        </div>

        <h1 style={{ font: "400 clamp(32px, 4.5vw, 54px)/1.1 var(--font-display)", color: "var(--purple)", margin: "0 0 20px" }}>
          {job.title}
        </h1>

        {/* Key Metrics Strip */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", background: "#fff", padding: "16px 20px", border: "1px solid var(--line)", borderRadius: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <span>📍</span>
            <b>{job.location}</b>
          </div>
          <span style={{ color: "var(--line)" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <span>💼</span>
            <span>{job.workMode} ({job.employmentType})</span>
          </div>
          <span style={{ color: "var(--line)" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <span>⏳</span>
            <span>{job.experience}</span>
          </div>
          {job.salaryRange && (
            <>
              <span style={{ color: "var(--line)" }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <span>💰</span>
                <span style={{ color: "var(--purple)", fontWeight: 700 }}>{job.salaryRange}</span>
              </div>
            </>
          )}
          {job.deadline && (
            <>
              <span style={{ color: "var(--line)" }}>|</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--muted)" }}>
                <span>📅</span>
                <span>Apply before: {new Date(job.deadline).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Main Two-Column Layout */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 36, alignItems: "start" }}>
          {/* Left Column: Job Description & Specifications */}
          <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 36, borderRadius: 6 }}>
            {/* Overview */}
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "0 0 12px" }}>
                Position Overview
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--ink)", margin: 0 }}>
                {job.description}
              </p>
            </div>

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div style={{ marginBottom: 32, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
                <h3 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "0 0 16px" }}>
                  Key Responsibilities
                </h3>
                <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10, fontSize: 14, lineHeight: 1.7 }}>
                  {job.responsibilities.map((resp, i) => (
                    <li key={i} style={{ color: "var(--ink)" }}>{resp}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <div style={{ marginBottom: 32, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
                <h3 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "0 0 16px" }}>
                  Candidate Requirements &amp; Background
                </h3>
                <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10, fontSize: 14, lineHeight: 1.7 }}>
                  {job.requirements.map((req, i) => (
                    <li key={i} style={{ color: "var(--ink)" }}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills Tags */}
            {job.skills && job.skills.length > 0 && (
              <div style={{ marginBottom: 32, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
                <h3 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "0 0 14px" }}>
                  Skills &amp; Technical Capabilities
                </h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {job.skills.map((skill, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "6px 12px",
                        background: "#faf8f5",
                        border: "1px solid var(--line)",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--purple)",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Preferred Qualifications */}
            {job.preferredQualifications && job.preferredQualifications.length > 0 && (
              <div style={{ marginBottom: 32, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
                <h3 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "0 0 16px" }}>
                  Preferred / Advantageous Qualifications
                </h3>
                <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10, fontSize: 14, lineHeight: 1.7 }}>
                  {job.preferredQualifications.map((pref, i) => (
                    <li key={i} style={{ color: "var(--ink)" }}>{pref}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div style={{ marginBottom: 32, borderTop: "1px solid var(--line)", paddingTop: 24 }}>
                <h3 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "0 0 16px" }}>
                  Compensation &amp; Benefits
                </h3>
                <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 10, fontSize: 14, lineHeight: 1.7 }}>
                  {job.benefits.map((ben, i) => (
                    <li key={i} style={{ color: "var(--ink)" }}>{ben}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Equal Opportunity Pledge */}
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 24, background: "#faf8f5", padding: 20, borderRadius: 4 }}>
              <b style={{ color: "var(--purple)", display: "block", marginBottom: 6, fontSize: 13 }}>
                Queens Care Equal Opportunity &amp; Scientific Integrity Statement
              </b>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: "var(--muted)" }}>
                Queens Care Laboratories is an equal opportunity clinical employer. All hiring decisions are made strictly on the basis of qualifications, demonstrated merit, and research integrity without regard to gender, religion, background, or physical ability.
              </p>
            </div>
          </div>

          {/* Right Column: Sticky Application Form & Share Card */}
          <div style={{ display: "grid", gap: 20, position: "sticky", top: 20 }}>
            {/* Direct Application Form */}
            <div ref={formRef} style={{ background: "#fff", border: "1px solid var(--line)", padding: 28, borderRadius: 6, boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
                Direct Submission
              </span>
              <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "4px 0 16px" }}>
                Apply for this Position
              </h3>

              {feedback && (
                <div
                  style={{
                    padding: "14px 18px",
                    borderRadius: 4,
                    marginBottom: 20,
                    background: feedback.success ? "#e9f7e9" : "#fde8e8",
                    border: `1px solid ${feedback.success ? "#c3e6cb" : "#f8b4b4"}`,
                    color: feedback.success ? "#2e7d32" : "#b34141",
                    fontSize: 13,
                  }}
                >
                  <b>{feedback.success ? "✓ Application Received" : "✕ Submission Error"}</b>
                  <p style={{ margin: "4px 0 0" }}>{feedback.msg}</p>
                  {feedback.id && (
                    <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--ink)" }}>
                      Application Reference ID: <code>{feedback.id}</code>
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. / Mr. / Ms. ..."
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                      Current City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. New Delhi"
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                      Total Experience
                    </label>
                    <input
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 5 Years"
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                      Current Company
                    </label>
                    <input
                      type="text"
                      value={currentCompany}
                      onChange={(e) => setCurrentCompany(e.target.value)}
                      placeholder="Organization"
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                      Highest Degree
                    </label>
                    <input
                      type="text"
                      value={highestQualification}
                      onChange={(e) => setHighestQualification(e.target.value)}
                      placeholder="e.g. M.Pharm"
                      style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
                    />
                  </div>
                </div>

                {/* Resume Upload Box */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Attach Resume / CV * (PDF, DOC, DOCX — Max 10MB)
                  </label>
                  <div
                    style={{
                      border: "1px dashed var(--line)",
                      padding: 14,
                      borderRadius: 4,
                      background: "#faf8f5",
                      textAlign: "center",
                      cursor: "pointer",
                    }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      required={!resumeFile}
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      style={{ display: "none" }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setResumeFile(e.target.files[0]);
                        }
                      }}
                    />
                    {resumeFile ? (
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 700, color: "var(--purple)" }}>
                          📄 {resumeFile.name}
                        </p>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB · Click to replace
                        </span>
                      </div>
                    ) : (
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: 12, fontWeight: 600, color: "var(--purple)" }}>
                          📎 Click to browse resume file
                        </p>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>
                          Supported: PDF, DOC, DOCX
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Cover Note / Brief Introduction
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Briefly highlight your relevant accomplishments…"
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "14px 20px",
                    background: "var(--purple)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 4,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: submitting ? "wait" : "pointer",
                    letterSpacing: ".06em",
                    textTransform: "uppercase",
                    boxShadow: "0 4px 14px rgba(42,15,58,0.25)",
                  }}
                >
                  {submitting ? "Submitting Application…" : `Submit for ${job.title.split(" ")[0]} →`}
                </button>
              </form>
            </div>

            {/* Share Opportunity Card */}
            <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 20, borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <b style={{ fontSize: 13, color: "var(--purple)", display: "block" }}>Know an exceptional candidate?</b>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Share this position with your clinical or peer network.</span>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  padding: "6px 12px",
                  background: copiedLink ? "#e9f7e9" : "#faf8f5",
                  border: "1px solid var(--line)",
                  borderRadius: 3,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  color: copiedLink ? "#2e7d32" : "var(--purple)",
                }}
              >
                {copiedLink ? "✓ Link Copied" : "🔗 Copy Link"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
