"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const req = async (path: string, init?: RequestInit) => {
  const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  return r.json();
};

type FormData = {
  name: string; email: string; phone: string; company: string;
  address: string; city: string; state: string; pincode: string;
  gstNumber: string; drugLicence: string; businessType: string;
  territory: string; existingBusiness: string; message: string;
};

const emptyForm: FormData = { name: "", email: "", phone: "", company: "", address: "", city: "", state: "", pincode: "", gstNumber: "", drugLicence: "", businessType: "distributor", territory: "", existingBusiness: "", message: "" };

export default function B2BDashboard() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState<FormData>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState<"info" | "form" | "dashboard">("info");

  useEffect(() => {
    (async () => {
      const me = await req("/api/auth/me");
      if (me.user) {
        setUser(me.user);
        const d = await req("/api/b2b/applications");
        if (d.applications) setApplications(d.applications);
        setActiveSection("dashboard");
      }
      setLoading(false);
    })();
  }, []);

  const apply = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const r = await req("/api/b2b/applications", { method: "POST", body: JSON.stringify(form) });
    if (r.error) { setMessage(r.error); setSubmitting(false); return; }
    setMessage("Your application has been submitted successfully. Our partnerships team will review it within 5 business days. You will receive a confirmation email shortly.");
    setShowForm(false);
    setForm(emptyForm);
    const d = await req("/api/b2b/applications");
    if (d.applications) setApplications(d.applications);
    setSubmitting(false);
  };

  if (loading) return <main className="portal"><p style={{ padding: 40, color: "var(--muted)" }}>Loading…</p></main>;

  return (
    <main className="portal" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <Link href="/" className="back">← Queens Care</Link>
      <p className="eyebrow">Partner with Queens Care</p>
      <h1 style={{ font: "32px var(--font-display)", marginBottom: 8 }}>B2B &amp; Distribution Partnerships</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.8, marginBottom: 32 }}>
        Queens Care Laboratories partners with distributors, clinics, and pharmacies across India.
        Our wholesale programme offers competitive pricing, marketing support, and priority fulfilment.
      </p>

      {message && <div style={{ padding: "14px 20px", background: "#e9f7e9", border: "1px solid #c3e6cb", fontSize: 13, marginBottom: 24 }}>{message}</div>}

      {/* ─── PUBLIC INFO SECTION ─── */}
      {activeSection === "info" && !user && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
            {[
              ["Competitive Pricing", "Tiered wholesale pricing based on volume and partnership level."],
              ["Marketing Support", "Co-branded materials, product training, and promotional assets."],
              ["Priority Fulfilment", "Fast-tracked shipping and dedicated logistics support."],
              ["Product Training", "Comprehensive product education and clinical data."],
              ["Exclusive Territories", "Protected distribution territories for key partners."],
              ["Credit Terms", "Flexible credit facilities for qualified partners."],
            ].map(([title, desc]) => (
              <div key={String(title)} style={{ padding: 24, background: "#fff", border: "1px solid var(--line)" }}>
                <b style={{ fontSize: 14, display: "block", marginBottom: 8 }}>{title}</b>
                <span style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{desc}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ font: "20px var(--font-display)", marginBottom: 16 }}>Who can become a distributor?</h2>
            <ul style={{ fontSize: 13, lineHeight: 2, color: "var(--ink)", paddingLeft: 20 }}>
              <li>Licensed pharmacies and drug stores</li>
              <li>Health and wellness clinics</li>
              <li>Online health product retailers</li>
              <li>Regional distribution companies</li>
              <li>Medical supply chains</li>
              <li>Corporate wellness programmes</li>
            </ul>
          </div>

          {!showForm ? (
            <button onClick={() => { setShowForm(true); setActiveSection("form"); }} className="button" style={{ border: 0, marginBottom: 40 }}>Apply for Partnership →</button>
          ) : null}
        </>
      )}

      {/* ─── APPLICATION FORM ─── */}
      {activeSection === "form" && showForm && (
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ font: "20px var(--font-display)", marginBottom: 20 }}>Distributor Application</h2>
          <form onSubmit={apply} style={{ display: "grid", gap: 16, maxWidth: 640 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {([["name", "Full name *", "text"], ["email", "Email address *", "email"], ["phone", "Phone number *", "tel"]] as const).map(([key, label, type]) => (
                <div key={key}>
                  <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
                  <input type={type} required value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
                </div>
              ))}
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Company / Business name *</label>
              <input required value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Business address</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>City</label>
                <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>State</label>
                <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>PIN code</label>
                <input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>GST Number</label>
                <input value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} placeholder="Optional" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Drug licence details</label>
                <input value={form.drugLicence} onChange={e => setForm({ ...form, drugLicence: e.target.value })} placeholder="Optional" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Business type</label>
                <select value={form.businessType} onChange={e => setForm({ ...form, businessType: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }}>
                  <option value="distributor">Distributor</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="clinic">Clinic / Hospital</option>
                  <option value="online">Online retailer</option>
                  <option value="corporate">Corporate wellness</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Distribution territory</label>
                <input value={form.territory} onChange={e => setForm({ ...form, territory: e.target.value })} placeholder="e.g. Maharashtra, South India" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Existing business details</label>
              <textarea value={form.existingBusiness} onChange={e => setForm({ ...form, existingBusiness: e.target.value })} placeholder="Tell us about your existing distribution business…" style={{ minHeight: 80, padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Message / Requirements</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Any specific requirements or questions…" style={{ minHeight: 80, padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            </div>
            <button type="submit" disabled={submitting} className="button" style={{ border: 0, width: "fit-content" }}>
              {submitting ? "Submitting…" : "Submit Application →"}
            </button>
          </form>
        </div>
      )}

      {/* ─── DISTRIBUTOR DASHBOARD ─── */}
      {activeSection === "dashboard" && user && (
        <>
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>Welcome back, {String(user.name)}. Here you can track your applications and partnership status.</p>
          </div>

          {applications.length > 0 ? (
            <div>
              <h2 style={{ font: "20px var(--font-display)", margin: "0 0 16px" }}>Your Applications</h2>
              {applications.map((app) => (
                <div key={String(app.id)} style={{ padding: 20, background: "#fff", border: "1px solid var(--line)", marginBottom: 12, display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
                  <div>
                    <b style={{ fontSize: 14 }}>{String(app.company)}</b>
                    <p style={{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>Applied: {new Date(String(app.createdAt)).toLocaleDateString("en-IN")} · Type: {String(app.type)}</p>
                    {app.notes ? <p style={{ fontSize: 12, color: "var(--ink)", margin: "4px 0 0" }}>{`Note: ${String(app.notes)}`}</p> : null}
                  </div>
                  <span style={{ padding: "4px 12px", fontSize: 10, textTransform: "uppercase", background: app.status === "approved" ? "#4caf50" : app.status === "declined" ? "#b34141" : "#d4ad65", color: app.status === "pending" ? "#333" : "#fff" }}>{String(app.status)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 16 }}>You have not submitted a distributor application yet.</p>
              <button onClick={() => { setShowForm(true); setActiveSection("form"); }} className="button" style={{ border: 0 }}>Apply for Distribution →</button>
            </div>
          )}
        </>
      )}

      {/* ─── LOGIN PROMPT (for unauthenticated users after form) ─── */}
      {activeSection !== "form" && activeSection !== "dashboard" && !user && (
        <div style={{ marginTop: 32, padding: 20, background: "var(--paper)", border: "1px solid var(--line)" }}>
          <p style={{ fontSize: 13 }}>Already have an account? <Link href="/account" style={{ color: "var(--purple)", textDecoration: "underline" }}>Sign in</Link> to view your application status.</p>
        </div>
      )}

      <div style={{ marginTop: 40, padding: "20px 0", borderTop: "1px solid var(--line)" }}>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>Questions about partnerships? <Link href="/contact" style={{ color: "var(--purple)" }}>Contact our partnerships team</Link>.</p>
      </div>
    </main>
  );
}
