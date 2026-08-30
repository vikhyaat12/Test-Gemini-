import Link from "next/link";
import type { Metadata } from "next";
import { employeeStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clinical Leadership & Research Team — Queens Care Laboratories",
  description: "Meet the pharmaceutical formulators, clinical investigators, and regulatory specialists behind Queens Care Laboratories.",
  robots: { index: true, follow: true },
};

export default async function EmployeeDirectoryPage() {
  const list = ((await employeeStore.list()) as Record<string, unknown>[]) || [];
  const activeEmployees = list.filter((e) => e.active !== false);

  return (
    <main style={{ background: "#faf8f5", minHeight: "100vh", paddingBottom: 80 }}>
      {/* Header Banner */}
      <section
        style={{
          background: "linear-gradient(145deg, #180524 0%, #2A0F3A 60%, #150320 100%)",
          color: "#ffffff",
          padding: "60px 24px 70px",
          textAlign: "center",
          borderBottom: "2px solid #D4AF37",
        }}
      >
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#C19A6B", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
            Queens Care Laboratories
          </div>
          <h1 style={{ font: "38px var(--font-display)", color: "#ffffff", margin: "0 0 12px 0", letterSpacing: "-0.02em" }}>
            Clinical & Scientific Leadership
          </h1>
          <p style={{ fontSize: 15, color: "#d1d5db", lineHeight: 1.6, maxWidth: 620, margin: "0 auto" }}>
            Our team of pharmaceutical research scientists, clinical dermatologists, and formulation engineers ensuring every therapeutic protocol exceeds international quality benchmarks.
          </p>
        </div>
      </section>

      {/* Directory Grid */}
      <div style={{ maxWidth: 1140, margin: "-30px auto 0", padding: "0 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          {activeEmployees.map((emp) => {
            const photo = String(emp.photo || emp.profileImage || "");
            const name = String(emp.name || "Specialist");
            const designation = String(emp.designation || "Clinical Specialist");
            const department = String(emp.department || "Research & Formulation");
            const slug = String(emp.slug || "");
            const employeeId = String(emp.employeeId || slug);
            const photoSettings = (emp.photoSettings as Record<string, unknown>) || {};
            const borderRadius = photoSettings.borderRadius !== undefined ? Number(photoSettings.borderRadius) : 50;

            return (
              <div
                key={slug}
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 24,
                  border: "1px solid #eae5db",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.03)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      {photo ? (
                        <img
                          src={photo}
                          alt={name}
                          style={{
                            width: 74,
                            height: 74,
                            borderRadius: `${borderRadius}%`,
                            objectFit: "cover",
                            border: "2px solid #D4AF37",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 74,
                            height: 74,
                            borderRadius: `${borderRadius}%`,
                            background: "linear-gradient(135deg, #4A1A66 0%, #2A0F3A 100%)",
                            color: "#D4AF37",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 28,
                            fontWeight: 700,
                            border: "2px solid #D4AF37",
                          }}
                        >
                          {name.charAt(0)}
                        </div>
                      )}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          right: 0,
                          background: "#10b981",
                          color: "#ffffff",
                          width: 20,
                          height: 20,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: "bold",
                          border: "2px solid #ffffff",
                        }}
                        title="Verified Active Staff"
                      >
                        ✓
                      </div>
                    </div>

                    <div>
                      <h2 style={{ font: "18px var(--font-display)", color: "#2A0F3A", margin: "0 0 4px 0" }}>{name}</h2>
                      <div style={{ fontSize: 13, color: "#C19A6B", fontWeight: 600 }}>{designation}</div>
                      <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{department}</div>
                    </div>
                  </div>

                  {Boolean(emp.bio) ? (
                    <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.6, margin: "0 0 16px 0", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {String(emp.bio)}
                    </p>
                  ) : null}
                </div>

                <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <code style={{ fontSize: 11, color: "#6b7280", background: "#f3f4f6", padding: "2px 6px", borderRadius: 4 }}>
                    {employeeId}
                  </code>
                  <Link
                    href={`/employee/${slug}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#2A0F3A",
                      textDecoration: "none",
                      padding: "6px 12px",
                      borderRadius: 4,
                      background: "rgba(42,15,58,0.06)",
                    }}
                  >
                    <span>View Profile</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
