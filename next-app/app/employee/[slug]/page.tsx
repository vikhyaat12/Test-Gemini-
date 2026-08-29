/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Metadata } from "next";
import { employeeStore } from "@/lib/commerce/store-extensions";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const employee = await employeeStore.bySlug(slug);
    if (!employee || !employee.active) return { title: "Employee not found" };
    return { title: `${employee.name} — Queens Care Laboratories`, description: `${employee.name}, ${employee.designation || ""} at Queens Care Laboratories`, robots: { index: false, follow: false } };
  } catch { return { title: "Employee Profile" }; }
}

export default async function EmployeeProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const employee = (await employeeStore.bySlug(slug)) as {
    name: string;
    slug: string;
    employeeId?: string;
    designation?: string;
    department?: string;
    photo?: string;
    phone?: string;
    email?: string;
    bio?: string;
    active: boolean;
  } | null;
  if (!employee || !employee.active) {
    return (
      <main className="portal" style={{ maxWidth: 500, margin: "0 auto", textAlign: "center", padding: "60px 20px" }}>
        <p className="eyebrow">Queens Care Laboratories</p>
        <h1 style={{ font: "24px var(--font-display)", marginTop: 12 }}>Employee profile not found</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>This profile may have been deactivated or the link is invalid.</p>
        <Link href="/" className="button" style={{ marginTop: 24 }}>Return to Queens Care →</Link>
      </main>
    );
  }

  return (
    <main className="portal" style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
      <Link href="/" className="back">← Queens Care</Link>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        {employee.photo ? (
          <img src={employee.photo} alt={employee.name} style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "3px solid var(--gold)", marginBottom: 16 }} />
        ) : (
          <div style={{ width: 120, height: 120, borderRadius: "50%", background: "var(--purple)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, margin: "0 auto 16px" }}>
            {employee.name.charAt(0)}
          </div>
        )}
        <h1 style={{ font: "28px var(--font-display)", marginBottom: 4 }}>{employee.name}</h1>
        {employee.designation && <p style={{ fontSize: 14, color: "var(--gold)", fontWeight: 600 }}>{employee.designation}</p>}
        {employee.department && <p style={{ fontSize: 13, color: "var(--muted)" }}>{employee.department}</p>}
      </div>

      <div style={{ padding: 24, background: "var(--paper)", border: "1px solid var(--line)", marginBottom: 24 }}>
        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", marginBottom: 12 }}>Queens Care Laboratories</p>
        <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
          {employee.designation && <div><span style={{ color: "var(--muted)" }}>Designation:</span> <b>{employee.designation}</b></div>}
          {employee.department && <div><span style={{ color: "var(--muted)" }}>Department:</span> <b>{employee.department}</b></div>}
          {employee.email && <div><span style={{ color: "var(--muted)" }}>Email:</span> <a href={`mailto:${employee.email}`} style={{ color: "var(--purple)" }}>{employee.email}</a></div>}
          {employee.phone && <div><span style={{ color: "var(--muted)" }}>Phone:</span> <a href={`tel:${employee.phone}`} style={{ color: "var(--purple)" }}>{employee.phone}</a></div>}
        </div>
      </div>

      {employee.bio && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ font: "16px var(--font-display)", marginBottom: 8 }}>About</h3>
          <p style={{ fontSize: 13, lineHeight: 1.8 }}>{employee.bio}</p>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <p style={{ fontSize: 11, color: "var(--muted)" }}>Verified Queens Care Laboratories employee</p>
        <div style={{ marginTop: 12, padding: "8px 16px", background: "var(--purple)", color: "#fff", fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", display: "inline-block" }}>
          ID: {employee.employeeId || employee.slug}
        </div>
      </div>
    </main>
  );
}
