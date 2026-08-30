import Link from "next/link";
import type { Metadata } from "next";
import { employeeStore } from "@/lib/commerce/store-extensions";
import EmployeeProfileClient, { EmployeeData } from "./EmployeeProfileClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  try {
    const employee = (await employeeStore.bySlug(slug)) as Record<string, unknown> | null;
    if (!employee || employee.active === false) return { title: "Employee Not Found — Queens Care Laboratories" };
    return {
      title: `${String(employee.name)} | Official Staff Profile — Queens Care Laboratories`,
      description: `${String(employee.name)}, ${String(employee.designation || "")} at Queens Care Laboratories. ${String(employee.bio || "").slice(0, 140)}...`,
      robots: { index: true, follow: true },
    };
  } catch {
    return { title: "Employee Profile — Queens Care Laboratories" };
  }
}

export default async function EmployeeProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rawEmployee = (await employeeStore.bySlug(slug)) as Record<string, unknown> | null;
  const allList = ((await employeeStore.list()) as Record<string, unknown>[]) || [];

  if (!rawEmployee || rawEmployee.active === false) {
    return (
      <main className="portal" style={{ maxWidth: 540, margin: "60px auto", textAlign: "center", padding: "50px 24px", background: "#ffffff", borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#C19A6B", textTransform: "uppercase", letterSpacing: "0.1em" }}>Queens Care Laboratories</p>
        <h1 style={{ font: "26px var(--font-display)", color: "#2A0F3A", marginTop: 12 }}>Employee Profile Not Found</h1>
        <p style={{ color: "#6b7280", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
          This staff profile may be currently inactive, archived, or the specified credential URL is incorrect.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            marginTop: 24,
            padding: "10px 24px",
            background: "#2A0F3A",
            color: "#ffffff",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          Return to Queens Care →
        </Link>
      </main>
    );
  }

  const employee: EmployeeData = {
    id: String(rawEmployee.id || ""),
    name: String(rawEmployee.name || ""),
    slug: String(rawEmployee.slug || slug),
    employeeId: String(rawEmployee.employeeId || rawEmployee.slug || ""),
    designation: String(rawEmployee.designation || ""),
    department: String(rawEmployee.department || ""),
    photo: String(rawEmployee.photo || rawEmployee.profileImage || ""),
    profileImage: String(rawEmployee.profileImage || rawEmployee.photo || ""),
    phone: String(rawEmployee.phone || ""),
    email: String(rawEmployee.email || ""),
    bio: String(rawEmployee.bio || ""),
    active: rawEmployee.active !== false,
    gallery: Array.isArray(rawEmployee.gallery) ? rawEmployee.gallery : [],
    videos: Array.isArray(rawEmployee.videos) ? rawEmployee.videos : [],
    photoSettings: (rawEmployee.photoSettings as EmployeeData["photoSettings"]) || {
      desktopSize: 180,
      mobileSize: 130,
      borderRadius: 50,
      borderWidth: 3,
      borderColor: "#D4AF37",
      objectFit: "cover",
      shadow: true,
    },
  };

  const allEmployees: EmployeeData[] = allList
    .filter((m) => m.active !== false)
    .map((m) => ({
      id: String(m.id || ""),
      name: String(m.name || ""),
      slug: String(m.slug || ""),
      designation: String(m.designation || ""),
      department: String(m.department || ""),
      photo: String(m.photo || m.profileImage || ""),
      profileImage: String(m.profileImage || m.photo || ""),
      active: m.active !== false,
    }));

  return <EmployeeProfileClient employee={employee} allEmployees={allEmployees} />;
}
