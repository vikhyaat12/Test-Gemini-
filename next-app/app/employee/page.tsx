/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { employeeStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Employee Profile — Queens Care Laboratories",
  robots: { index: false, follow: false },
};

export default async function EmployeePage() {
  const list = await employeeStore.list();
  const activeEmp = list.find((e: Record<string, unknown>) => e.active !== false) || {
    name: "Dr. Ananya Mehta",
    employeeId: "QCL-2024-0847",
    designation: "Senior Research Scientist",
    department: "Formulation & Development",
    email: "ananya.mehta@queenscare.com",
    phone: "+91 98765 43210",
    bio: "Dr. Mehta leads the formulation development team at Queens Care Laboratories, specialising in evidence-based dermal and nutritional products. With over 12 years of experience in pharmaceutical R&D, she ensures every Queens Care product meets the highest standards of efficacy and safety.",
    photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=85",
    location: "Mumbai, India",
    slug: "ananya-mehta",
  };

  const emp = activeEmp as Record<string, unknown>;

  return (
    <main className="portal" style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
      <Link href="/" className="back">← Queens Care</Link>

      <div style={{ textAlign: "center", marginBottom: 32, marginTop: 24 }}>
        <img
          src={String(emp.photo || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=85")}
          alt={String(emp.name || "Employee")}
          style={{ width: 140, height: 140, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--gold)", marginBottom: 16 }}
        />
        <h1 style={{ font: "28px var(--font-display)", marginBottom: 4 }}>{String(emp.name || "")}</h1>
        <p style={{ fontSize: 14, color: "var(--gold)", fontWeight: 600 }}>{String(emp.designation || "")}</p>
        <p style={{ fontSize: 13, color: "var(--muted)" }}>{String(emp.department || "")}</p>
      </div>

      <div style={{ padding: 24, background: "var(--paper)", border: "1px solid var(--line)", marginBottom: 24 }}>
        <h2 style={{ font: "16px var(--font-display)", marginBottom: 12 }}>About</h2>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink)" }}>{String(emp.bio || "")}</p>
      </div>

      <div style={{ padding: 24, background: "#fff", border: "1px solid var(--line)", marginBottom: 24 }}>
        <h2 style={{ font: "16px var(--font-display)", marginBottom: 16 }}>Verification & Contact</h2>
        <div style={{ display: "grid", gap: 12, fontSize: 13 }}>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
            <span style={{ color: "var(--muted)" }}>Employee ID</span>
            <code>{String(emp.employeeId || "QCL-2024-0847")}</code>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
            <span style={{ color: "var(--muted)" }}>Email</span>
            <a href={`mailto:${String(emp.email || "")}`} style={{ color: "var(--purple)" }}>{String(emp.email || "")}</a>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--line)", paddingBottom: 8 }}>
            <span style={{ color: "var(--muted)" }}>Phone</span>
            <span>{String(emp.phone || "")}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--muted)" }}>Status</span>
            <span style={{ color: "#2e7d32", fontWeight: 600 }}>Verified Active Employee</span>
          </div>
        </div>
      </div>

      {list.length > 1 && (
        <div style={{ marginTop: 32 }}>
          <h3 style={{ font: "18px var(--font-display)", marginBottom: 12 }}>All Team Members</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {list.map((m: Record<string, unknown>) => (
              <Link key={String(m.id || m.slug)} href={`/employee/${String(m.slug)}`} style={{ padding: "10px 14px", background: "#fff", border: "1px solid var(--line)", textDecoration: "none", color: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span><b>{String(m.name)}</b> — <span style={{ color: "var(--muted)", fontSize: 12 }}>{String(m.designation || "")}</span></span>
                <span style={{ color: "var(--purple)", fontSize: 12 }}>View Profile →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
