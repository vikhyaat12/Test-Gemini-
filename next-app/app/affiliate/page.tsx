"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import AffiliateDashboard from "./dashboard";

const req = async (path: string, init?: RequestInit) => {
  const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  return r.json();
};

export default function AffiliatePage() {
  const [user, setUser] = useState<{ id?: string; name?: string; email?: string; role?: string } | null>(null);
  const [affiliate, setAffiliate] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"landing" | "dashboard">("landing");

  // Registration form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regNotes, setRegNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await req("/api/auth/me");
        if (me.user) {
          setUser(me.user);
          const a = await req("/api/affiliate/me");
          if (a.affiliate) {
            setAffiliate(a.affiliate);
            setViewMode("dashboard");
          }
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const handleApplyLoggedIn = async () => {
    setSubmitting(true);
    setMsg("");
    try {
      const res = await req("/api/affiliate/join", { method: "POST" });
      if (res.affiliate) {
        setAffiliate(res.affiliate);
        setViewMode("dashboard");
      } else {
        setMsg(res.error || "Failed to join.");
      }
    } catch {
      setMsg("Network error.");
    }
    setSubmitting(false);
  };

  const handleRegisterAndJoin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");
    try {
      // 1. Register account
      const signupRes = await req("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
      });
      if (signupRes.error) {
        setMsg(signupRes.error);
        setSubmitting(false);
        return;
      }
      // 2. Join affiliate programme
      const joinRes = await req("/api/affiliate/join", { method: "POST" });
      if (joinRes.affiliate) {
        setUser({ name: regName, email: regEmail });
        setAffiliate(joinRes.affiliate);
        setViewMode("dashboard");
      } else {
        setMsg(joinRes.error || "Account created! Please sign in to access your affiliate dashboard.");
      }
    } catch {
      setMsg("Registration failed. Please check details and try again.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <main className="editorial" style={{ padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--muted)" }}>Loading affiliate programme…</p>
      </main>
    );
  }

  // If user is already an affiliate and in dashboard mode, render the dashboard
  if (affiliate && viewMode === "dashboard") {
    return (
      <div>
        <div style={{ background: "var(--purple)", color: "#fff", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
          <span>Signed in as Affiliate Partner <b>{String(affiliate.affiliateCode)}</b></span>
          <button onClick={() => setViewMode("landing")} style={{ background: "transparent", color: "var(--gold)", border: "1px solid var(--gold)", padding: "4px 12px", cursor: "pointer", fontSize: 12 }}>
            View Public Landing Page
          </button>
        </div>
        <AffiliateDashboard />
      </div>
    );
  }

  const faqs = [
    { q: "How much does it cost to join?", a: "Joining the Queens Care Affiliate Programme is completely free of charge. There are no setup fees, minimum sales requirements, or hidden charges." },
    { q: "What is the commission rate and cookie duration?", a: "Affiliates earn a standard 10% commission on every qualifying product purchase made through their tracking link. Our tracking cookies remain active for 30 days." },
    { q: "How and when do I receive payouts?", a: "Commissions move from pending to approved following our standard return buffer. You can request withdrawals straight to your bank account or UPI directly from your dashboard." },
    { q: "Can I generate links for specific products?", a: "Yes! Inside your affiliate dashboard, you can generate customized short links for specific products or general site pages." },
    { q: "Who can become an affiliate?", a: "We partner with healthcare practitioners, clinical researchers, wellness creators, editorial writers, and passionate customers who believe in evidence-backed health rituals." },
    { q: "What promotional guidelines must I follow?", a: "We expect partners to maintain transparent, honest communication. Do not make unsubstantiated medical claims or engage in deceptive advertising practices." },
  ];

  return (
    <main className="editorial" style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <Link href="/" className="back" style={{ margin: 0 }}>← Queens Care</Link>
        {affiliate ? (
          <button onClick={() => setViewMode("dashboard")} className="button" style={{ fontSize: 12, padding: "8px 16px" }}>
            Go to My Affiliate Dashboard →
          </button>
        ) : (
          <Link href="/account" style={{ fontSize: 12, color: "var(--purple)", textDecoration: "none", fontWeight: 600 }}>
            {user ? `Signed in as ${user.name || user.email}` : "Sign In →"}
          </Link>
        )}
      </div>

      {/* Hero Section */}
      <p className="eyebrow">Queens Care Laboratories Partner Network</p>
      <h1 style={{ font: "clamp(34px, 4.5vw, 56px)/1.1 var(--font-display)", letterSpacing: "-.03em", margin: "8px 0 16px" }}>
        Partner with Queens Care.<br/><em>Earn with integrity.</em>
      </h1>
      <p style={{ fontSize: 17, lineHeight: 1.8, color: "var(--muted)", maxWidth: 680, marginBottom: 40 }}>
        Share science-backed wellness rituals you believe in. Earn 10% commission on every qualifying customer order through your personalized referral link, with 30-day tracking and direct monthly withdrawals.
      </p>

      {/* Value Pillars */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 56 }}>
        {[
          ["10% Commission", "Earn on every referred product sale across our catalog."],
          ["30-Day Cookie Window", "Get credited even if your referrals purchase weeks later."],
          ["Live Analytics", "Monitor clicks, conversion rates, and accrued earnings in real time."],
          ["Direct Monthly Payouts", "Withdraw your earnings directly to your bank account or UPI."],
        ].map(([title, desc]) => (
          <div key={title} style={{ padding: 24, background: "#fff", border: "1px solid var(--line)" }}>
            <b style={{ font: "18px var(--font-display)", display: "block", marginBottom: 8, color: "var(--purple)" }}>{title}</b>
            <span style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>{desc}</span>
          </div>
        ))}
      </div>

      {/* How it Works */}
      <section style={{ margin: "56px 0", padding: "40px 32px", background: "var(--paper)", border: "1px solid var(--line)" }}>
        <p className="eyebrow" style={{ color: "var(--gold)" }}>HOW IT WORKS</p>
        <h2 style={{ font: "28px var(--font-display)", margin: "8px 0 32px" }}>Three simple steps to start earning.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          <div>
            <b style={{ fontSize: 24, color: "var(--gold)", display: "block", marginBottom: 8 }}>01</b>
            <h3 style={{ font: "16px var(--font-display)", margin: "0 0 8px" }}>Join & Get Your Link</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>Register in seconds. You will receive an exclusive affiliate code and custom tracking links.</p>
          </div>
          <div>
            <b style={{ fontSize: 24, color: "var(--gold)", display: "block", marginBottom: 8 }}>02</b>
            <h3 style={{ font: "16px var(--font-display)", margin: "0 0 8px" }}>Share Care Rituals</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>Recommend Queens Care formulations to your audience, clients, or community with your referral link.</p>
          </div>
          <div>
            <b style={{ fontSize: 24, color: "var(--gold)", display: "block", marginBottom: 8 }}>03</b>
            <h3 style={{ font: "16px var(--font-display)", margin: "0 0 8px" }}>Earn & Withdraw</h3>
            <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, margin: 0 }}>Track purchases live on your dashboard and request withdrawals straight to your bank account.</p>
          </div>
        </div>
      </section>

      {/* Who Can Join */}
      <section style={{ margin: "56px 0" }}>
        <p className="eyebrow">ELIGIBILITY</p>
        <h2 style={{ font: "28px var(--font-display)", margin: "8px 0 24px" }}>Who is this program for?</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
          {[
            ["Healthcare Practitioners", "Doctors, dermatologists, nutritionists, and wellness specialists."],
            ["Wellness Creators", "Content creators, bloggers, and podcasters focused on health and longevity."],
            ["Community Advocates", "Satisfied customers who love sharing their daily Queens Care rituals."],
            ["Editorial & Media", "Publishers and journalists reviewing science-backed healthcare products."],
          ].map(([title, desc]) => (
            <div key={title} style={{ padding: 20, border: "1px solid var(--line)" }}>
              <b style={{ fontSize: 15, display: "block", marginBottom: 6 }}>{title}</b>
              <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Application / Registration Form */}
      <section id="join-section" style={{ margin: "56px 0", padding: "40px 36px", background: "#fff", border: "1px solid var(--purple)" }}>
        <p className="eyebrow" style={{ color: "var(--gold)" }}>START EARNING</p>
        <h2 style={{ font: "32px var(--font-display)", margin: "8px 0 16px" }}>Join the Queens Care Affiliate Programme</h2>
        <p style={{ fontSize: 14, color: "var(--muted)", maxWidth: 600, marginBottom: 28, lineHeight: 1.7 }}>
          Create your affiliate partner account below or apply with your existing account. Approval is instant in development mode.
        </p>

        {msg && (
          <p style={{ padding: "10px 14px", background: msg.includes("created") || msg.includes("Welcome") ? "#e8f5e9" : "#ffebee", color: msg.includes("created") || msg.includes("Welcome") ? "#2e7d32" : "#c62828", fontSize: 13, marginBottom: 20 }}>
            {msg}
          </p>
        )}

        {user ? (
          <div>
            <p style={{ fontSize: 14, marginBottom: 16 }}>
              You are signed in as <b>{user.name || user.email}</b>. Click below to activate your affiliate partner account.
            </p>
            <button onClick={handleApplyLoggedIn} disabled={submitting} className="button" style={{ border: 0 }}>
              {submitting ? "Activating…" : "JOIN AS AFFILIATE →"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegisterAndJoin} style={{ display: "grid", gap: 16, maxWidth: 500 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Full Name *</label>
              <input required value={regName} onChange={e => setRegName(e.target.value)} placeholder="e.g. Dr. Priya Sharma" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Email Address *</label>
              <input required type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="name@domain.com" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Account Password *</label>
              <input required type="password" minLength={6} value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Create password" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Social Handle / Website / Clinic (Optional)</label>
              <input value={regNotes} onChange={e => setRegNotes(e.target.value)} placeholder="e.g. @wellnesswithpriya or priyawellness.in" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            </div>
            <button type="submit" disabled={submitting} className="button" style={{ border: 0, marginTop: 8 }}>
              {submitting ? "Creating account…" : "JOIN AS AFFILIATE →"}
            </button>
            <p style={{ fontSize: 12, color: "var(--muted)", margin: "8px 0 0" }}>
              Already have a Queens Care account? <Link href="/account?redirect=/affiliate" style={{ color: "var(--purple)" }}>Sign in first</Link>
            </p>
          </form>
        )}
      </section>

      {/* FAQ Accordion */}
      <section style={{ margin: "56px 0" }}>
        <p className="eyebrow">QUESTIONS & ANSWERS</p>
        <h2 style={{ font: "28px var(--font-display)", margin: "8px 0 24px" }}>Frequently asked questions</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {faqs.map((f, i) => (
            <div key={f.q} style={{ border: "1px solid var(--line)", background: "#fff" }}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{ width: "100%", padding: "18px 20px", background: "transparent", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left", color: "var(--ink)" }}
              >
                <span>{f.q}</span>
                <span style={{ fontSize: 18, color: "var(--muted)" }}>{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && (
                <div style={{ padding: "0 20px 20px", fontSize: 14, color: "var(--muted)", lineHeight: 1.8, borderTop: "1px solid var(--line)" }}>
                  <p style={{ margin: "14px 0 0" }}>{f.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Back to Home & Help */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 40, borderTop: "1px solid var(--line)" }}>
        <Link href="/" className="text-link">← Back to Queens Care Home</Link>
        <Link href="/contact" style={{ fontSize: 13, color: "var(--muted)", textDecoration: "none" }}>Need assistance? Contact Partner Support →</Link>
      </div>
    </main>
  );
}
