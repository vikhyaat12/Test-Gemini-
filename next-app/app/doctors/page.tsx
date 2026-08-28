"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function DoctorsPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", clinic: "", specialty: "dermatology", qualification: "", regNumber: "", message: "" });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/doctor/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || "Your application has been submitted. Our medical affairs team will contact you shortly.");
        setSubmitted(true);
        setForm({ name: "", email: "", phone: "", clinic: "", specialty: "dermatology", qualification: "", regNumber: "", message: "" });
      } else {
        setMessage(data.error || "Could not submit your application.");
      }
    } catch {
      setMessage("Network error. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <main className="portal" style={{ maxWidth: 800, margin: "0 auto" }}>
      <Link href="/" className="back">← Queens Care</Link>
      <p className="eyebrow">For healthcare professionals</p>
      <h1 style={{ font: "32px var(--font-display)", marginBottom: 8 }}>Doctor &amp; Clinic Portal</h1>
      <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.8, marginBottom: 32 }}>
        Queens Care Laboratories works closely with healthcare professionals to ensure our formulations meet clinical standards.
        Join our professional network for product training, clinical data access, and partnership opportunities.
      </p>

      {/* ─── BENEFITS ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 40 }}>
        {[
          ["Clinical Data", "Access detailed clinical studies and formulation data for every product."],
          ["Product Training", "Comprehensive training programmes for you and your clinical team."],
          ["Professional Network", "Connect with other healthcare professionals using Queens Care products."],
          ["Patient Resources", "Branded patient education materials and wellness guides."],
          ["Research Collaboration", "Opportunities to participate in product development and clinical research."],
          ["Priority Support", "Dedicated support line for healthcare professional queries."],
        ].map(([title, desc]) => (
          <div key={title} style={{ padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
            <b style={{ fontSize: 13, display: "block", marginBottom: 6 }}>{title}</b>
            <span style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>{desc}</span>
          </div>
        ))}
      </div>

      {submitted ? (
        <div style={{ padding: 24, background: "#e9f7e9", border: "1px solid #c3e6cb", marginBottom: 32 }}>
          <h2 style={{ font: "20px var(--font-display)", margin: "0 0 8px" }}>Application submitted</h2>
          <p style={{ fontSize: 13 }}>{message}</p>
          <button onClick={() => setSubmitted(false)} className="button" style={{ marginTop: 16, border: 0 }}>Submit another application</button>
        </div>
      ) : (
        <div>
          <h2 style={{ font: "20px var(--font-display)", marginBottom: 20 }}>Professional Partnership Application</h2>
          <form onSubmit={submit} style={{ display: "grid", gap: 14, maxWidth: 600 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Full name *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Email *</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Clinic / Hospital name</label>
                <input value={form.clinic} onChange={e => setForm({ ...form, clinic: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Specialty</label>
                <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }}>
                  <option value="dermatology">Dermatology</option>
                  <option value="general">General practice</option>
                  <option value="nutrition">Nutrition</option>
                  <option value="endocrinology">Endocrinology</option>
                  <option value="gastroenterology">Gastroenterology</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Qualification</label>
                <input value={form.qualification} onChange={e => setForm({ ...form, qualification: e.target.value })} placeholder="e.g. MBBS, MD" style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Medical registration number</label>
              <input value={form.regNumber} onChange={e => setForm({ ...form, regNumber: e.target.value })} style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}>Message</label>
              <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us about your interest in Queens Care products…" style={{ minHeight: 80, padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 }} />
            </div>
            <button type="submit" disabled={submitting} className="button" style={{ border: 0, width: "fit-content" }}>
              {submitting ? "Submitting…" : "Submit Application →"}
            </button>
          </form>
          {message && !submitted && <p style={{ marginTop: 12, fontSize: 13, color: "#b34141" }}>{message}</p>}
        </div>
      )}

      <div style={{ marginTop: 40, padding: "20px 0", borderTop: "1px solid var(--line)" }}>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>For medical affairs inquiries, <Link href="/contact" style={{ color: "var(--purple)" }}>contact our medical team</Link>.</p>
      </div>
    </main>
  );
}
