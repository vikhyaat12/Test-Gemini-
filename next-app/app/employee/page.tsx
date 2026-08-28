/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Employee Profile — Queens Care Laboratories",
  robots: { index: false, follow: false },
};

// Demo employee profile for direct URL / QR code access
const demoEmployee = {
  name: "Dr. Ananya Mehta",
  employeeId: "QCL-2024-0847",
  designation: "Senior Research Scientist",
  department: "Formulation & Development",
  email: "ananya.mehta@queenscare.com",
  phone: "+91 98765 43210",
  bio: "Dr. Mehta leads the formulation development team at Queens Care Laboratories, specialising in evidence-based dermal and nutritional products. With over 12 years of experience in pharmaceutical R&D, she ensures every Queens Care product meets the highest standards of efficacy and safety.",
  photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=85",
  joinedYear: "2019",
  location: "Mumbai, India",
};

export default function EmployeePage() {
  return (
    <main className="portal" style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
      <Link href="/" className="back">← Queens Care</Link>

      <div style={{ textAlign: "center", marginBottom: 32, marginTop: 24 }}>
        <img
          src={demoEmployee.photo}
          alt={demoEmployee.name}
          style={{ width: 140, height: 140, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--gold)", marginBottom: 16 }}
        />
        <h1 style={{ font: "28px var(--font-display)", marginBottom: 4 }}>{demoEmployee.name}</h1>
        <p style={{ fontSize: 14, color: "var(--gold)", fontWeight: 600 }}>{demoEmployee.designation}</p>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>{demoEmployee.department}</p>
      </div>

      <div style={{ padding: 24, background: "var(--paper)", border: "1px solid var(--line)", marginBottom: 24 }}>
        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: 12 }}>
          Queens Care Laboratories
        </p>
        <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
          <div><span style={{ color: "var(--muted)" }}>Employee ID:</span> <b>{demoEmployee.employeeId}</b></div>
          <div><span style={{ color: "var(--muted)" }}>Designation:</span> <b>{demoEmployee.designation}</b></div>
          <div><span style={{ color: "var(--muted)" }}>Department:</span> <b>{demoEmployee.department}</b></div>
          <div><span style={{ color: "var(--muted)" }}>Email:</span> <a href={`mailto:${demoEmployee.email}`} style={{ color: "var(--purple)" }}>{demoEmployee.email}</a></div>
          <div><span style={{ color: "var(--muted)" }}>Phone:</span> <a href={`tel:${demoEmployee.phone}`} style={{ color: "var(--purple)" }}>{demoEmployee.phone}</a></div>
          <div><span style={{ color: "var(--muted)" }}>Location:</span> <b>{demoEmployee.location}</b></div>
          <div><span style={{ color: "var(--muted)" }}>Joined:</span> <b>{demoEmployee.joinedYear}</b></div>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h3 style={{ font: "16px var(--font-display)", marginBottom: 8 }}>About</h3>
        <p style={{ fontSize: 13, lineHeight: 1.8 }}>{demoEmployee.bio}</p>
      </div>

      <div style={{ textAlign: "center", marginTop: 32, padding: "20px 0", borderTop: "1px solid var(--line)" }}>
        <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>Verified Queens Care Laboratories employee</p>
        <div style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", display: "inline-block" }}>
          ID: {demoEmployee.employeeId}
        </div>
        <p style={{ fontSize: 11, color: "var(--muted)", marginTop: 16 }}>
          This profile was accessed via direct link or QR code.<br />
          For employee management, <Link href="/admin/login" style={{ color: "var(--purple)" }}>access the admin dashboard</Link>.
        </p>
      </div>
    </main>
  );
}
