"use client";

import React, { FormEvent, useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { B2BPageConfig } from "@/lib/commerce/store-extensions";

type FormDataState = {
  company: string;
  businessType: string;
  name: string;
  designation: string;
  email: string;
  phone: string;
  whatsapp: string;
  website: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  gstNumber: string;
  drugLicence: string;
  panNumber: string;
  yearsInBusiness: string;
  distributionNetwork: string;
  storeCount: string;
  regionsCovered: string;
  partnershipType: string;
  productInterest: string;
  requirementVolume: string;
  territory: string;
  existingBrands: string;
  additionalRequirements: string;
  message: string;
  consent: boolean;
};

const initialFormData: FormDataState = {
  company: "",
  businessType: "distributor",
  name: "",
  designation: "",
  email: "",
  phone: "",
  whatsapp: "",
  website: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  gstNumber: "",
  drugLicence: "",
  panNumber: "",
  yearsInBusiness: "",
  distributionNetwork: "",
  storeCount: "",
  regionsCovered: "",
  partnershipType: "distributor",
  productInterest: "",
  requirementVolume: "",
  territory: "",
  existingBrands: "",
  additionalRequirements: "",
  message: "",
  consent: true,
};

export default function B2BDashboard() {
  const [pageConfig, setPageConfig] = useState<B2BPageConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [logoUrl, setLogoUrl] = useState("");

  // Form state
  const [form, setForm] = useState<FormDataState>(initialFormData);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submittedApp, setSubmittedApp] = useState<{ id: string; company: string; name: string } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  // Strip accidental timestamps from CMS text (e.g. "Title 1788200206371" → "Title")
  const cleanCmsText = (text?: string): string => {
    if (!text) return "";
    return text.replace(/\s+\d{10,13}\s*$/g, "").trim();
  };

  useEffect(() => {
    (async () => {
      try {
        const [configRes, meRes, settingsRes] = await Promise.all([
          fetch("/api/b2b").then((r) => r.json()),
          fetch("/api/auth/me").then((r) => r.json()).catch(() => ({})),
          fetch("/api/settings").then((r) => r.json()).catch(() => ({ settings: [] })),
        ]);

        if (configRes.pageConfig) {
          setPageConfig(configRes.pageConfig);
        }
        if (meRes.user) {
          setUser(meRes.user);
        }
        // Load logo from global settings
        if (settingsRes.settings) {
          const logoSetting = settingsRes.settings.find((s: { key: string; value: string }) => s.key === "logo_url");
          if (logoSetting?.value) setLogoUrl(logoSetting.value);
        }
      } catch (err) {
        console.error("Error loading B2B initial state:", err);
      } finally {
        setLoadingConfig(false);
      }
    })();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!["pdf", "doc", "docx", "jpg", "jpeg", "png"].includes(ext)) {
      setFileError("Supported formats: PDF, DOC, DOCX, JPG, or PNG document only.");
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setFileError("File size exceeds the 10MB limit.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.company.trim()) errs.company = "Company / Business Name is required.";
    if (!form.businessType.trim()) errs.businessType = "Business type is required.";
    if (!form.name.trim()) errs.name = "Contact Person Name is required.";
    if (!form.email.trim()) {
      errs.email = "Email Address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!form.phone.trim()) {
      errs.phone = "Phone / Mobile Number is required.";
    } else if (form.phone.replace(/[^0-9]/g, "").length < 8) {
      errs.phone = "Please enter a valid phone number (minimum 8 digits).";
    }
    if (!form.city.trim()) errs.city = "City is required.";
    if (!form.state.trim()) errs.state = "State is required.";
    if (!form.partnershipType.trim()) errs.partnershipType = "Partnership Type is required.";
    if (!form.consent) errs.consent = "You must agree to be contacted regarding this partnership.";

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) {
      const firstKey = Object.keys(formErrors)[0];
      const el = document.querySelector(`[name="${firstKey}"]`);
      if (el) (el as HTMLElement).focus();
      return;
    }

    setSubmitting(true);

    try {
      let res: Response;
      if (selectedFile) {
        const formData = new FormData();
        Object.entries(form).forEach(([k, v]) => {
          formData.append(k, String(v));
        });
        formData.append("document", selectedFile);

        res = await fetch("/api/b2b/applications", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/b2b/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      const data = await res.json();

      if (!res.ok || !data.success) {
        setServerError(data.error || "An unexpected error occurred. Please try again.");
        setSubmitting(false);
        return;
      }

      setSubmittedApp({
        id: data.application.id,
        company: data.application.company,
        name: data.application.name,
      });
      setForm(initialFormData);
      setSelectedFile(null);

      // Application tracking is private — managed via Admin Panel
    } catch {
      setServerError("Network communication failed. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const copyId = () => {
    if (!submittedApp) return;
    navigator.clipboard.writeText(submittedApp.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  if (loadingConfig) {
    return (
      <div style={{ background: "var(--paper, #fdfbf7)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--muted, #666)", fontSize: 14 }}>Loading Queens Care Commercial Portal…</p>
      </div>
    );
  }

  // Handle Page Unpublished State gracefully
  if (pageConfig && pageConfig.published === false) {
    return (
      <div style={{ background: "var(--paper, #fdfbf7)", minHeight: "100vh", padding: "60px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: 560, background: "#fff", border: "1px solid var(--line, rgba(0,0,0,0.08))", borderRadius: 8, padding: "40px 32px", textAlign: "center" }}>
          <span style={{ font: "28px var(--font-display, serif)", color: "#D4AF37", display: "block", marginBottom: 12 }}>Q</span>
          <h2 style={{ font: "24px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 12px" }}>
            Commercial Portal Under Scheduled Maintenance
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted, #666)", lineHeight: 1.7, marginBottom: 24 }}>
            The Queens Care B2B &amp; Distribution portal is currently undergoing scheduled commercial territory updates. Please check back shortly or reach out to our institutional team directly.
          </p>
          <Link
            href="/"
            style={{
              padding: "10px 22px",
              background: "var(--purple, #2A0F3A)",
              color: "#D4AF37",
              textDecoration: "none",
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700,
              display: "inline-block",
            }}
          >
            ← Return to Storefront
          </Link>
        </div>
      </div>
    );
  }

  const hero = pageConfig?.hero;
  const benefits = pageConfig?.benefits;
  const partnershipTypes = pageConfig?.partnershipTypes;
  const processSteps = pageConfig?.process;
  const customSections = pageConfig?.customSections || [];
  const formConfig = pageConfig?.formConfig;
  const storeLocatorCta = pageConfig?.storeLocatorCta;
  const cta = pageConfig?.cta;

  return (
    <div style={{ background: "var(--paper, #fdfbf7)", minHeight: "100vh", color: "var(--ink, #1a1a1a)", fontFamily: "var(--font-body, system-ui, sans-serif)" }}>
      {/* ─── STICKY SUB-HEADER ─── */}
      <div style={{ borderBottom: "1px solid var(--line, rgba(0,0,0,0.08))", background: "#fff", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link
            href="/"
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--purple, #2A0F3A)",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "transform 0.2s",
            }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt="Queens Care" style={{ height: 32, width: "auto", maxWidth: 120, objectFit: "contain" }} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <span style={{ font: "20px var(--font-display, serif)", fontWeight: 900, color: "#D4AF37" }}>Q</span>
            )}
            <span>← Return to Storefront</span>
          </Link>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted, #666)", textTransform: "uppercase", letterSpacing: ".06em" }}>
              Wholesale &amp; Distribution
            </span>
            <button
              type="button"
              onClick={scrollToForm}
              style={{
                padding: "7px 16px",
                background: "var(--purple, #2A0F3A)",
                color: "#D4AF37",
                border: "none",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(42,15,58,0.2)",
              }}
            >
              Apply for Partnership ↓
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* ─── 1. HERO SECTION ─── */}
        {hero?.visible !== false && (
          <section style={{ textAlign: "center", maxWidth: 880, margin: "0 auto 60px" }}>
            <span
              style={{
                display: "inline-block",
                padding: "4px 14px",
                background: "#f0ebfa",
                color: "var(--purple, #2A0F3A)",
                border: "1px solid rgba(42,15,58,0.15)",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: ".08em",
                marginBottom: 16,
              }}
            >
              {hero?.eyebrow || "Partner with Queens Care Laboratories"}
            </span>

            <h1
              style={{
                font: "clamp(32px, 4vw, 48px) var(--font-display, serif)",
                color: "var(--purple, #2A0F3A)",
                lineHeight: 1.15,
                margin: "0 0 16px",
                letterSpacing: "-0.02em",
              }}
            >
              {cleanCmsText(hero?.heading) || "B2B & Distribution Partnerships"}
            </h1>

            <p
              style={{
                fontSize: "clamp(15px, 2vw, 17px)",
                color: "var(--ink, #333)",
                fontWeight: 500,
                lineHeight: 1.6,
                margin: "0 0 14px",
              }}
            >
              {hero?.subtitle || "High-potency clinical formulations with uncompromised pharmaceutical supply chain integrity."}
            </p>

            <p
              style={{
                fontSize: 14,
                color: "var(--muted, #666)",
                lineHeight: 1.8,
                margin: "0 0 28px",
              }}
            >
              {hero?.description || "Queens Care Laboratories partners with distributors, clinic networks, hospital pharmacies, and clinical stockists across India. Our wholesale program offers tiered commercial margins, dedicated regulatory documentation, and priority dispatch."}
            </p>

            {/* Key Metric Badges */}
            {(hero?.trustBadges || []).length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))`,
                  gap: 16,
                  background: "#fff",
                  border: "1px solid var(--line, rgba(0,0,0,0.08))",
                  borderRadius: 6,
                  padding: "20px 24px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
                  marginBottom: 32,
                }}
              >
                {(hero?.trustBadges || []).map((badge, idx) => (
                  <div key={idx} style={{ textAlign: "center" }}>
                    <b style={{ display: "block", fontSize: 14, color: "var(--purple, #2A0F3A)", fontWeight: 800 }}>{badge.top}</b>
                    <span style={{ fontSize: 11, color: "var(--muted, #666)", textTransform: "uppercase", letterSpacing: ".05em" }}>{badge.bottom}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Stats strip */}
            {(hero?.stats || []).length > 0 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap", marginBottom: 28 }}>
                {(hero?.stats || []).map((st, sIdx) => (
                  <div key={sIdx} style={{ textAlign: "center" }}>
                    <span style={{ font: "24px var(--font-display, serif)", fontWeight: 900, color: "#D4AF37", display: "block" }}>{st.value}</span>
                    <span style={{ fontSize: 11, color: "var(--muted, #666)", textTransform: "uppercase", letterSpacing: ".06em" }}>{st.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={scrollToForm}
                style={{
                  padding: "14px 28px",
                  background: "var(--purple, #2A0F3A)",
                  color: "#D4AF37",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 14px rgba(42,15,58,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>{hero?.primaryCta?.text || hero?.ctaText || "Apply for Partnership"}</span>
                <span>↓</span>
              </button>

              <a
                href={hero?.secondaryCta?.link || "mailto:b2b@queenscare.in"}
                style={{
                  padding: "13px 24px",
                  background: "#fff",
                  color: "var(--purple, #2A0F3A)",
                  border: "1px solid var(--purple, #2A0F3A)",
                  borderRadius: 4,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{hero?.secondaryCta?.text || "Speak to Commercial Team"} ↗</span>
              </a>
            </div>
          </section>
        )}

        {/* ─── 2. PARTNERSHIP ADVANTAGES & BENEFITS ─── */}
        {benefits?.visible !== false && (
          <section style={{ marginBottom: 70 }}>
            <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 36px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
                Commercial Advantages
              </span>
              <h2 style={{ font: "28px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "4px 0 10px" }}>
                {benefits?.heading || "Wholesale & Distribution Advantages"}
              </h2>
              <p style={{ fontSize: 14, color: "var(--muted, #666)", lineHeight: 1.6, margin: 0 }}>
                {benefits?.description || "Why medical professionals, hospital chains, and pharmaceutical stockists partner with Queens Care."}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              {(benefits?.cards || []).filter((c) => c.visible !== false).map((card) => (
                <div
                  key={card.id}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line, rgba(0,0,0,0.08))",
                    borderRadius: 6,
                    padding: 24,
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 12 }}>{card.icon}</div>
                  <h3 style={{ font: "17px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 8px" }}>
                    {card.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--muted, #666)", lineHeight: 1.7, margin: 0 }}>
                    {card.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 3. PARTNERSHIP ECOSYSTEMS / TYPES ─── */}
        {partnershipTypes?.visible !== false && (
          <section style={{ marginBottom: 70 }}>
            <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 36px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
                Collaboration Models
              </span>
              <h2 style={{ font: "28px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "4px 0 10px" }}>
                {partnershipTypes?.heading || "Partnership Ecosystems"}
              </h2>
              <p style={{ fontSize: 14, color: "var(--muted, #666)", lineHeight: 1.6, margin: 0 }}>
                {partnershipTypes?.description || "Tailored commercial structures designed for diverse healthcare and distribution partners."}
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              {(partnershipTypes?.types || []).filter((t) => t.visible !== false).map((pt) => (
                <div
                  key={pt.id}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--line, rgba(0,0,0,0.08))",
                    borderRadius: 6,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, padding: "3px 8px", background: "#f0ebfa", color: "var(--purple, #2A0F3A)", borderRadius: 3, textTransform: "uppercase" }}>
                        {pt.badge}
                      </span>
                      {pt.icon && <span style={{ fontSize: 18 }}>{pt.icon}</span>}
                    </div>
                    <h3 style={{ font: "18px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 8px" }}>
                      {pt.title}
                    </h3>
                    <p style={{ fontSize: 12, color: "var(--muted, #666)", lineHeight: 1.6, marginBottom: 16 }}>
                      {pt.description}
                    </p>
                    <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, color: "var(--ink, #333)", lineHeight: 1.8 }}>
                      {(pt.perks || []).map((perk, pIdx) => (
                        <li key={pIdx}>{perk}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, partnershipType: pt.id.replace("pt-", "") }));
                      scrollToForm();
                    }}
                    style={{
                      marginTop: 20,
                      padding: "8px 14px",
                      background: "none",
                      border: "1px solid var(--line, rgba(0,0,0,0.12))",
                      borderRadius: 4,
                      color: "var(--purple, #2A0F3A)",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "center",
                    }}
                  >
                    {pt.ctaText || "Select This Model →"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 4. STRUCTURED ONBOARDING PROCESS ─── */}
        {processSteps?.visible !== false && (
          <section style={{ marginBottom: 70, background: "#fff", border: "1px solid var(--line, rgba(0,0,0,0.08))", borderRadius: 8, padding: "40px 32px" }}>
            <div style={{ textAlign: "center", maxWidth: 650, margin: "0 auto 36px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
                How It Works
              </span>
              <h2 style={{ font: "26px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "4px 0 10px" }}>
                {processSteps?.heading || "Structured 4-Step Onboarding Process"}
              </h2>
              {processSteps?.description && (
                <p style={{ fontSize: 13, color: "var(--muted, #666)", margin: 0 }}>{processSteps.description}</p>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24 }}>
              {(processSteps?.steps || []).filter((s) => s.visible !== false).map((step) => (
                <div key={step.stepNumber} style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "var(--purple, #2A0F3A)",
                        color: "#D4AF37",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {step.stepNumber}
                    </span>
                    <span style={{ fontSize: 20 }}>{step.icon}</span>
                  </div>
                  <h4 style={{ font: "16px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 6px" }}>
                    {step.title}
                  </h4>
                  <p style={{ fontSize: 12, color: "var(--muted, #666)", lineHeight: 1.6, margin: 0 }}>
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── 5. DYNAMIC CUSTOM SECTIONS (CMS DRIVEN) ─── */}
        {customSections.filter((s) => s.visible !== false).map((sec) => (
          <section key={sec.id} style={{ marginBottom: 70, background: "#fff", border: "1px solid var(--line, rgba(0,0,0,0.08))", borderRadius: 8, padding: "36px 32px" }}>
            <div style={{ textAlign: "center", maxWidth: 700, margin: "0 auto 20px" }}>
              {sec.subheading && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
                  {sec.subheading}
                </span>
              )}
              <h2 style={{ font: "26px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "4px 0 10px" }}>
                {sec.heading}
              </h2>
            </div>
            <p style={{ fontSize: 14, color: "var(--ink, #333)", lineHeight: 1.8, maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
              {sec.content}
            </p>
          </section>
        ))}

        {/* ─── 6. STORE LOCATOR CTA BANNER ─── */}
        {storeLocatorCta?.visible !== false && (
          <section
            style={{
              marginBottom: 70,
              background: "linear-gradient(135deg, #FAF6EE 0%, #F5EFEB 100%)",
              border: "1px solid rgba(212,175,55,0.3)",
              borderRadius: 8,
              padding: "36px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div style={{ maxWidth: 650 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
                Retail &amp; Clinic Network
              </span>
              <h3 style={{ font: "22px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "4px 0 8px" }}>
                {storeLocatorCta?.heading || "Looking for Retail Stockists or Partner Clinics?"}
              </h3>
              <p style={{ fontSize: 13, color: "var(--muted, #666)", margin: 0, lineHeight: 1.6 }}>
                {storeLocatorCta?.description || "Locate verified Queens Care retail pharmacies, authorized clinics, and regional stockists near you."}
              </p>
            </div>

            <Link
              href={storeLocatorCta?.buttonLink || "/store-locator"}
              style={{
                padding: "12px 24px",
                background: "var(--purple, #2A0F3A)",
                color: "#D4AF37",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 2px 8px rgba(42,15,58,0.2)",
              }}
            >
              <span>{storeLocatorCta?.buttonText || "Find a Store / Distributor Near You →"}</span>
            </Link>
          </section>
        )}

        {/* ─── 7. PARTNERSHIP ENQUIRY FORM ─── */}
        <section ref={formRef} id="enquiry-form" style={{ maxWidth: 860, margin: "0 auto 60px" }}>
          {formConfig?.enabled === false ? (
            <div style={{ background: "#fff", border: "1px solid var(--line, rgba(0,0,0,0.08))", borderRadius: 8, padding: 40, textAlign: "center" }}>
              <span style={{ fontSize: 36, display: "block", marginBottom: 12 }}>🔒</span>
              <h3 style={{ font: "22px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 10px" }}>
                Partnership Onboarding Under Scheduled Review
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted, #666)", maxWidth: 500, margin: "0 auto 20px", lineHeight: 1.6 }}>
                New partner registrations are currently paused as our commercial team completes regional territory allocations.
              </p>
              <p style={{ fontSize: 13, color: "var(--ink, #333)" }}>
                For urgent institutional or hospital supply queries, please email:{" "}
                <a href={`mailto:${formConfig?.contactEmail || "b2b@queenscare.in"}`} style={{ color: "var(--purple, #2A0F3A)", fontWeight: 700 }}>
                  {formConfig?.contactEmail || "b2b@queenscare.in"}
                </a>
              </p>
            </div>
          ) : submittedApp ? (
            /* Confirmation Screen */
            <div style={{ background: "#fff", border: "2px solid #c3e6cb", borderRadius: 8, padding: "40px 32px", textAlign: "center", boxShadow: "0 8px 30px rgba(46,125,50,0.08)" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#e9f7e9", color: "#2e7d32", fontSize: 28, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                ✓
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2e7d32", textTransform: "uppercase", letterSpacing: ".08em" }}>
                Application Successfully Logged
              </span>
              <h3 style={{ font: "26px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "6px 0 12px" }}>
                Thank You, {submittedApp.name}
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted, #666)", maxWidth: 560, margin: "0 auto 20px", lineHeight: 1.7 }}>
                Your partnership enquiry for <b>{submittedApp.company}</b> has been securely recorded in our commercial database. Our territory lead will review your credentials and contact you within 2 business days.
              </p>

              <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#faf8f5", border: "1px solid var(--line, rgba(0,0,0,0.08))", padding: "10px 18px", borderRadius: 6, marginBottom: 24 }}>
                <div style={{ textAlign: "left" }}>
                  <span style={{ display: "block", fontSize: 10, color: "var(--muted, #666)", textTransform: "uppercase", letterSpacing: ".06em" }}>Enquiry Reference ID</span>
                  <code style={{ fontSize: 14, color: "var(--purple, #2A0F3A)", fontWeight: 800 }}>{submittedApp.id}</code>
                </div>
                <button
                  type="button"
                  onClick={copyId}
                  style={{
                    padding: "6px 12px",
                    background: "var(--purple, #2A0F3A)",
                    color: "#D4AF37",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {copiedId ? "Copied! ✓" : "Copy ID"}
                </button>
              </div>

              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button
                  type="button"
                  onClick={() => setSubmittedApp(null)}
                  style={{
                    padding: "10px 20px",
                    background: "#fff",
                    color: "var(--purple, #2A0F3A)",
                    border: "1px solid var(--purple, #2A0F3A)",
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Submit Another Enquiry
                </button>
                <Link
                  href="/"
                  style={{
                    padding: "10px 20px",
                    background: "var(--purple, #2A0F3A)",
                    color: "#fff",
                    textDecoration: "none",
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Return to Storefront →
                </Link>
              </div>
            </div>
          ) : (
            /* Interactive Application Form */
            <div style={{ background: "#fff", border: "1px solid var(--line, rgba(0,0,0,0.08))", borderRadius: 8, padding: "36px 32px", boxShadow: "0 6px 24px rgba(0,0,0,0.04)" }}>
              <div style={{ borderBottom: "1px solid var(--line, rgba(0,0,0,0.08))", paddingBottom: 18, marginBottom: 24 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
                  Official Commercial Registration
                </span>
                <h3 style={{ font: "24px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "4px 0 6px" }}>
                  {formConfig?.heading || "Partnership & Distribution Enquiry"}
                </h3>
                <p style={{ fontSize: 13, color: "var(--muted, #666)", margin: 0, lineHeight: 1.6 }}>
                  {formConfig?.description || "Submit your organization's profile below. Our commercial partnerships lead will review your territory credentials within 2 business days."}
                </p>
              </div>

              {serverError && (
                <div style={{ padding: "12px 16px", background: "#fde8e8", border: "1px solid #f8b4b4", borderRadius: 4, color: "#b34141", fontSize: 13, marginBottom: 20, fontWeight: 600 }}>
                  ✕ {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>
                {/* ── Group 1: Company Information ── */}
                <div>
                  <h4 style={{ font: "15px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 12px", borderBottom: "1px solid #f0ebfa", paddingBottom: 6 }}>
                    1. Company &amp; Contact Information
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Company / Business Name <span style={{ color: "#b34141" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="company"
                        required
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        placeholder="e.g. Apex Health Logistics Pvt Ltd"
                        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${formErrors.company ? "#b34141" : "var(--line, rgba(0,0,0,0.12))"}`, borderRadius: 4, fontSize: 13 }}
                      />
                      {formErrors.company && <span style={{ fontSize: 11, color: "#b34141" }}>{formErrors.company}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Business Type <span style={{ color: "#b34141" }}>*</span>
                      </label>
                      <select
                        name="businessType"
                        required
                        value={form.businessType}
                        onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13, background: "#fff" }}
                      >
                        <option value="distributor">Pharmaceutical Distributor</option>
                        <option value="stockist">Wholesale Stockist</option>
                        <option value="pharmacy">Pharmacy Chain / Standalone Store</option>
                        <option value="clinic">Clinic / Hospital Network</option>
                        <option value="doctor">Doctor / Healthcare Practice</option>
                        <option value="online">Online Health Retailer</option>
                        <option value="corporate">Corporate Wellness Institution</option>
                        <option value="other">Other Commercial Entity</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Contact Person Name <span style={{ color: "#b34141" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="e.g. Rajesh Kumar"
                        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${formErrors.name ? "#b34141" : "var(--line, rgba(0,0,0,0.12))"}`, borderRadius: 4, fontSize: 13 }}
                      />
                      {formErrors.name && <span style={{ fontSize: 11, color: "#b34141" }}>{formErrors.name}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Designation / Role
                      </label>
                      <input
                        type="text"
                        value={form.designation}
                        onChange={(e) => setForm({ ...form, designation: e.target.value })}
                        placeholder="e.g. Managing Director / Purchase Head"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Business Email Address <span style={{ color: "#b34141" }}>*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="e.g. rajesh@apexhealth.in"
                        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${formErrors.email ? "#b34141" : "var(--line, rgba(0,0,0,0.12))"}`, borderRadius: 4, fontSize: 13 }}
                      />
                      {formErrors.email && <span style={{ fontSize: 11, color: "#b34141" }}>{formErrors.email}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Phone / Mobile Number <span style={{ color: "#b34141" }}>*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="e.g. +91 98111 22334"
                        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${formErrors.phone ? "#b34141" : "var(--line, rgba(0,0,0,0.12))"}`, borderRadius: 4, fontSize: 13 }}
                      />
                      {formErrors.phone && <span style={{ fontSize: 11, color: "#b34141" }}>{formErrors.phone}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        WhatsApp Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={form.whatsapp}
                        onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                        placeholder="e.g. +91 98111 22334"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Company Website (Optional)
                      </label>
                      <input
                        type="text"
                        value={form.website}
                        onChange={(e) => setForm({ ...form, website: e.target.value })}
                        placeholder="e.g. https://apexhealth.in"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Group 2: Business Credentials & Territory ── */}
                <div>
                  <h4 style={{ font: "15px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 12px", borderBottom: "1px solid #f0ebfa", paddingBottom: 6 }}>
                    2. Location, Territory &amp; Regulatory Credentials
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        City <span style={{ color: "#b34141" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="e.g. Mumbai"
                        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${formErrors.city ? "#b34141" : "var(--line, rgba(0,0,0,0.12))"}`, borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        State <span style={{ color: "#b34141" }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        placeholder="e.g. Maharashtra"
                        style={{ width: "100%", padding: "10px 12px", border: `1px solid ${formErrors.state ? "#b34141" : "var(--line, rgba(0,0,0,0.12))"}`, borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        PIN Code
                      </label>
                      <input
                        type="text"
                        value={form.pincode}
                        onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                        placeholder="e.g. 400001"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        GST Number
                      </label>
                      <input
                        type="text"
                        value={form.gstNumber}
                        onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
                        placeholder="27AAAAA0000A1Z5"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Drug Licence Details
                      </label>
                      <input
                        type="text"
                        value={form.drugLicence}
                        onChange={(e) => setForm({ ...form, drugLicence: e.target.value })}
                        placeholder="Form 20B / 21B Number"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        PAN Number
                      </label>
                      <input
                        type="text"
                        value={form.panNumber}
                        onChange={(e) => setForm({ ...form, panNumber: e.target.value })}
                        placeholder="ABCDE1234F"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Years in Business
                      </label>
                      <input
                        type="text"
                        value={form.yearsInBusiness}
                        onChange={(e) => setForm({ ...form, yearsInBusiness: e.target.value })}
                        placeholder="e.g. 8 years"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Stores / Clinics Covered
                      </label>
                      <input
                        type="text"
                        value={form.storeCount}
                        onChange={(e) => setForm({ ...form, storeCount: e.target.value })}
                        placeholder="e.g. 150 pharmacies / 12 clinics"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Preferred Territory / Regions Requested
                      </label>
                      <input
                        type="text"
                        value={form.territory}
                        onChange={(e) => setForm({ ...form, territory: e.target.value })}
                        placeholder="e.g. Western Maharashtra (Mumbai, Pune, Thane, Navi Mumbai)"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Business Address
                      </label>
                      <input
                        type="text"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        placeholder="Street address, building, industrial area…"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Group 3: Commercial Requirements & Product Interest ── */}
                <div>
                  <h4 style={{ font: "15px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 12px", borderBottom: "1px solid #f0ebfa", paddingBottom: 6 }}>
                    3. Partnership Type &amp; Commercial Requirements
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Partnership Model Requested <span style={{ color: "#b34141" }}>*</span>
                      </label>
                      <select
                        name="partnershipType"
                        required
                        value={form.partnershipType}
                        onChange={(e) => setForm({ ...form, partnershipType: e.target.value })}
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13, background: "#fff" }}
                      >
                        <option value="distributor">Regional Distributor</option>
                        <option value="stockist">Exclusive Stockist</option>
                        <option value="wholesaler">Wholesale Partner</option>
                        <option value="pharmacy">Pharmacy / Retail Chain Supply</option>
                        <option value="hospital">Hospital &amp; Institutional Supply</option>
                        <option value="clinic">Clinic / Aesthetic Practice</option>
                        <option value="corporate">Corporate Wellness Contract</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Products / Categories Interested In
                      </label>
                      <input
                        type="text"
                        value={form.productInterest}
                        onChange={(e) => setForm({ ...form, productInterest: e.target.value })}
                        placeholder="e.g. Lumine-C, Liko-Q, Dermatology, All"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Expected Monthly Requirement / Units
                      </label>
                      <input
                        type="text"
                        value={form.requirementVolume}
                        onChange={(e) => setForm({ ...form, requirementVolume: e.target.value })}
                        placeholder="e.g. 500 - 2,500 units / month"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Existing Pharmaceutical Brands Handled
                      </label>
                      <input
                        type="text"
                        value={form.existingBrands}
                        onChange={(e) => setForm({ ...form, existingBrands: e.target.value })}
                        placeholder="e.g. Cipla, Sun Pharma, Abbott…"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13 }}
                      />
                    </div>

                    <div style={{ gridColumn: "1 / -1" }}>
                      <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                        Partnership Message / Territory Proposal
                      </label>
                      <textarea
                        rows={3}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Describe your distribution network, clinic associations, or specific commercial requirements…"
                        style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line, rgba(0,0,0,0.12))", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Group 4: Document Upload (Optional) ── */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, display: "block", marginBottom: 4 }}>
                    Attach Company Profile / Drug Licence / GST Certificate / PAN (Optional)
                  </label>
                  <div
                    style={{
                      border: "1px dashed var(--line, rgba(0,0,0,0.18))",
                      padding: "16px 20px",
                      borderRadius: 6,
                      background: "#faf8f5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 600, display: "block" }}>
                        {selectedFile ? `Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)` : "Choose PDF, DOC, DOCX, JPG, or PNG (Max 10MB)"}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--muted, #666)" }}>
                        Securely stored and accessible solely by Queens Care commercial evaluation officers.
                      </span>
                    </div>

                    <label
                      style={{
                        padding: "8px 14px",
                        background: "#fff",
                        color: "var(--purple, #2A0F3A)",
                        border: "1px solid var(--purple, #2A0F3A)",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      <span>Browse File</span>
                      <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileChange} style={{ display: "none" }} />
                    </label>
                  </div>
                  {fileError && <span style={{ fontSize: 11, color: "#b34141", display: "block", marginTop: 4 }}>{fileError}</span>}
                </div>

                {/* ── Group 5: Consent & Submit ── */}
                <div>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", fontSize: 13, color: "var(--ink, #333)", marginBottom: 16 }}>
                    <input
                      type="checkbox"
                      name="consent"
                      checked={form.consent}
                      onChange={(e) => setForm({ ...form, consent: e.target.checked })}
                      style={{ marginTop: 2, width: 16, height: 16, accentColor: "var(--purple, #2A0F3A)" }}
                    />
                    <span>
                      I agree to be contacted by Queens Care Laboratories regarding this partnership enquiry and confirm that the submitted business credentials are accurate.
                    </span>
                  </label>
                  {formErrors.consent && <span style={{ fontSize: 11, color: "#b34141", display: "block", marginBottom: 8 }}>{formErrors.consent}</span>}

                  <button
                    type="submit"
                    disabled={submitting}
                    style={{
                      width: "100%",
                      padding: "16px 24px",
                      background: "var(--purple, #2A0F3A)",
                      color: "#D4AF37",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 15,
                      fontWeight: 800,
                      letterSpacing: ".04em",
                      cursor: submitting ? "wait" : "pointer",
                      boxShadow: "0 4px 16px rgba(42,15,58,0.25)",
                      transition: "opacity 0.2s",
                    }}
                  >
                    {submitting ? "Processing Enquiry…" : (formConfig?.submitButtonText || "SUBMIT PARTNERSHIP ENQUIRY →")}
                  </button>
                </div>
              </form>
            </div>
          )}
        </section>

        {/* ─── 8. APPLICATION HISTORY REMOVED FROM PUBLIC ─── */}
        {/* Application tracking is private — accessible only via Admin Panel */}

        {/* ─── 9. BOTTOM CTA SECTION ─── */}
        {cta?.visible !== false && (
          <section
            style={{
              background: "linear-gradient(135deg, var(--purple, #2A0F3A) 0%, #170721 100%)",
              color: "#fff",
              borderRadius: 8,
              padding: "48px 36px",
              textAlign: "center",
              maxWidth: 960,
              margin: "0 auto",
              boxShadow: "0 8px 30px rgba(42,15,58,0.2)",
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Direct Institutional Channel
            </span>
            <h3 style={{ font: "clamp(22px, 3vw, 30px) var(--font-display, serif)", color: "#fff", margin: "8px 0 12px" }}>
              {cta?.heading || "Looking for Custom Institutional or Bulk Orders?"}
            </h3>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", maxWidth: 580, margin: "0 auto 24px", lineHeight: 1.7 }}>
              {cta?.description || "Connect directly with our institutional medical supply team for hospital contracts, specialized packaging, or tenders."}
            </p>
            <a
              href={cta?.buttonLink || "mailto:b2b@queenscare.in"}
              style={{
                padding: "14px 28px",
                background: "#D4AF37",
                color: "var(--purple, #2A0F3A)",
                border: "none",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-block",
                boxShadow: "0 4px 14px rgba(212,175,55,0.3)",
              }}
            >
              {cta?.buttonText || "Contact Institutional Division →"}
            </a>
          </section>
        )}
      </div>
    </div>
  );
}
