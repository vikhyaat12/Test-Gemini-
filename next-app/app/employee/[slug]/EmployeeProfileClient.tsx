"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import * as THREE from "three";

export type EmployeeData = {
  id?: string;
  name: string;
  slug: string;
  employeeId?: string;
  designation?: string;
  department?: string;
  photo?: string;
  profileImage?: string;
  phone?: string;
  email?: string;
  bio?: string;
  active: boolean;
  gallery?: Array<string | { url: string; caption?: string }>;
  videos?: Array<{ id: string; url: string; title?: string; posterUrl?: string }>;
  photoSettings?: {
    desktopSize?: number;
    mobileSize?: number;
    borderRadius?: number;
    borderWidth?: number;
    borderColor?: string;
    objectFit?: "cover" | "contain";
    shadow?: boolean;
  };
};

// 3D Background Canvas for Employee Hero
function Employee3DScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = mountRef.current;
    if (!host || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const width = host.clientWidth || window.innerWidth;
    const height = host.clientHeight || 450;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    host.appendChild(renderer.domElement);

    // Gold rings & subtle particles
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.8,
      roughness: 0.25,
      transparent: true,
      opacity: 0.65,
    });

    const violetMat = new THREE.MeshStandardMaterial({
      color: 0x8a4b8c,
      metalness: 0.4,
      roughness: 0.3,
      transparent: true,
      opacity: 0.45,
    });

    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.04, 16, 80), goldMat);
    ring1.position.set(2.2, 0.4, -1);
    ring1.rotation.set(1.1, 0.4, 0.2);
    scene.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.025, 16, 60), violetMat);
    ring2.position.set(-2.4, -0.6, -1.2);
    ring2.rotation.set(0.6, 1.2, 0.5);
    scene.add(ring2);

    // Micro ambient floating spheres
    const particlesGroup = new THREE.Group();
    for (let i = 0; i < 18; i++) {
      const pMat = (i % 2 === 0 ? goldMat : violetMat).clone();
      pMat.opacity = Math.random() * 0.4 + 0.2;
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(Math.random() * 0.08 + 0.03, 16, 16), pMat);
      sphere.position.set(
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 5,
        (Math.random() - 0.5) * 4
      );
      particlesGroup.add(sphere);
    }
    scene.add(particlesGroup);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const pointLight = new THREE.PointLight(0xffe29a, 15, 12);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    const clock = new THREE.Clock();
    let frameId = 0;

    const animate = () => {
      const elapsed = clock.getElapsedTime();
      ring1.rotation.x = 1.1 + Math.sin(elapsed * 0.4) * 0.15;
      ring1.rotation.y = elapsed * 0.2;
      ring2.rotation.z = elapsed * 0.25;
      particlesGroup.rotation.y = elapsed * 0.05;

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!host) return;
      const w = host.clientWidth;
      const h = host.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (host.contains(renderer.domElement)) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.85,
      }}
      aria-hidden="true"
    />
  );
}

export default function EmployeeProfileClient({
  employee,
  allEmployees = [],
}: {
  employee: EmployeeData;
  allEmployees?: EmployeeData[];
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const photo = employee.photo || employee.profileImage || "";
  const photoSettings = employee.photoSettings || {
    desktopSize: 180,
    mobileSize: 130,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#D4AF37",
    objectFit: "cover",
    shadow: true,
  };

  const desktopSize = photoSettings.desktopSize || 180;
  const mobileSize = photoSettings.mobileSize || 130;
  const borderRadius = photoSettings.borderRadius !== undefined ? photoSettings.borderRadius : 50;
  const borderWidth = photoSettings.borderWidth !== undefined ? photoSettings.borderWidth : 3;
  const borderColor = photoSettings.borderColor || "#D4AF37";
  const objectFit = photoSettings.objectFit || "cover";
  const hasShadow = photoSettings.shadow !== false;

  const galleryList = (Array.isArray(employee.gallery) ? employee.gallery : []).map((item) =>
    typeof item === "string" ? { url: item, caption: "" } : item
  );

  const videoList = Array.isArray(employee.videos) ? employee.videos : [];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  // Build verification QR URL
  const currentOrigin = typeof window !== "undefined" ? window.location.origin : "https://queenscare.in";
  const profileUrl = `${currentOrigin}/employee/${employee.slug}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(profileUrl)}`;

  return (
    <div style={{ background: "#faf8f5", minHeight: "100vh", paddingBottom: 80, color: "#2A0F3A" }}>
      {/* Top Breadcrumb Header */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #eae5db", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: "#2A0F3A",
              textDecoration: "none",
            }}
          >
            <span>←</span> Return to Queens Care Laboratories
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "#C19A6B", fontWeight: 700 }}>
              Official Staff Directory
            </span>
            <button
              onClick={() => setShowQrModal(true)}
              style={{
                background: "rgba(212,175,55,0.12)",
                border: "1px solid #D4AF37",
                color: "#2A0F3A",
                padding: "4px 10px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span>📱</span> Verify QR
            </button>
          </div>
        </div>
      </div>

      {/* HERO SECTION WITH 3D CANVAS */}
      <section
        style={{
          position: "relative",
          background: "linear-gradient(145deg, #180524 0%, #2A0F3A 60%, #150320 100%)",
          color: "#ffffff",
          padding: "70px 24px 80px",
          overflow: "hidden",
          borderBottom: "2px solid #D4AF37",
        }}
      >
        <Employee3DScene />

        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 40,
              transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
              transition: "transform 0.15s ease-out",
            }}
          >
            {/* LEFT: PHOTO WITH GOLD RING */}
            <div style={{ flexShrink: 0, textAlign: "center", margin: "0 auto" }}>
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  padding: 8,
                  borderRadius: `${borderRadius}%`,
                  background: "radial-gradient(circle, rgba(212,175,55,0.4) 0%, rgba(42,15,58,0) 70%)",
                }}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={employee.name}
                    style={{
                      width: desktopSize,
                      height: desktopSize,
                      maxWidth: "100%",
                      borderRadius: `${borderRadius}%`,
                      objectFit,
                      border: `${borderWidth}px solid ${borderColor}`,
                      boxShadow: hasShadow ? "0 18px 45px rgba(0,0,0,0.6), 0 0 30px rgba(212,175,55,0.3)" : "none",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: desktopSize,
                      height: desktopSize,
                      borderRadius: `${borderRadius}%`,
                      background: "linear-gradient(135deg, #4A1A66 0%, #2A0F3A 100%)",
                      color: "#D4AF37",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 52,
                      fontWeight: 700,
                      border: `${borderWidth}px solid ${borderColor}`,
                      boxShadow: hasShadow ? "0 18px 45px rgba(0,0,0,0.6)" : "none",
                    }}
                  >
                    {employee.name.charAt(0)}
                  </div>
                )}

                {/* Verified Badge */}
                {employee.active !== false ? (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      background: "#10b981",
                      color: "#ffffff",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontWeight: "bold",
                      border: "3px solid #ffffff",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                    title="Verified Active Employee"
                  >
                    ✓
                  </div>
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      background: "#6b7280",
                      color: "#ffffff",
                      padding: "2px 8px",
                      borderRadius: 10,
                      fontSize: 10,
                      fontWeight: "bold",
                    }}
                  >
                    Inactive
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT: DETAILS & ACTIONS */}
            <div style={{ flex: "1 1 480px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span
                  style={{
                    background: "rgba(212,175,55,0.2)",
                    border: "1px solid #D4AF37",
                    color: "#D4AF37",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  ✓ VERIFIED ACTIVE EMPLOYEE
                </span>
                <span
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    color: "#e5e7eb",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                  }}
                >
                  ID: {employee.employeeId || employee.slug}
                </span>
              </div>

              <h1
                style={{
                  font: "36px var(--font-display)",
                  letterSpacing: "-0.02em",
                  margin: "0 0 6px 0",
                  color: "#ffffff",
                  lineHeight: 1.2,
                }}
              >
                {employee.name}
              </h1>

              {employee.designation && (
                <div style={{ fontSize: 18, color: "#D4AF37", fontWeight: 600, marginBottom: 6 }}>
                  {employee.designation}
                </div>
              )}

              {employee.department && (
                <div style={{ fontSize: 14, color: "#d1d5db", marginBottom: 18 }}>
                  Division: <b>{employee.department}</b>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 22 }}>
                {employee.email && (
                  <a
                    href={`mailto:${employee.email}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 20px",
                      background: "linear-gradient(135deg, #D4AF37 0%, #C19A6B 100%)",
                      color: "#180524",
                      fontWeight: 700,
                      fontSize: 13,
                      borderRadius: 6,
                      textDecoration: "none",
                      boxShadow: "0 4px 14px rgba(212,175,55,0.35)",
                      transition: "transform 0.15s ease",
                    }}
                  >
                    <span>✉</span> Email Specialist
                  </a>
                )}
                {employee.phone && (
                  <a
                    href={`tel:${employee.phone}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 20px",
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.3)",
                      color: "#ffffff",
                      fontWeight: 600,
                      fontSize: 13,
                      borderRadius: 6,
                      textDecoration: "none",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <span>📞</span> Call: {employee.phone}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "10px 16px",
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(212,175,55,0.4)",
                    color: "#D4AF37",
                    fontWeight: 600,
                    fontSize: 13,
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  <span>QR</span> Verification Badge
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT BODY */}
      <div style={{ maxWidth: 1100, margin: "-30px auto 0", padding: "0 24px", position: "relative", zIndex: 2 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
          {/* LEFT COLUMN: BIO, GALLERY, VIDEOS */}
          <div style={{ display: "grid", gap: 24 }}>
            {/* Bio Card */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                padding: 32,
                border: "1px solid #eae5db",
                boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <span style={{ width: 4, height: 20, background: "#C19A6B", borderRadius: 2 }} />
                <h2 style={{ font: "20px var(--font-display)", color: "#2A0F3A", margin: 0 }}>
                  Professional Profile & Clinical Experience
                </h2>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: "#374151", margin: 0 }}>
                {employee.bio ||
                  `${employee.name} serves as ${employee.designation || "a clinical specialist"} in the ${employee.department || "Pharmaceutical Research & Formulation"} department at Queens Care Laboratories, upholding evidence-based scientific standards and quality assurance.`}
              </p>
            </div>

            {/* Professional Gallery Showcase */}
            {galleryList.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 32,
                  border: "1px solid #eae5db",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <span style={{ width: 4, height: 20, background: "#C19A6B", borderRadius: 2 }} />
                  <h2 style={{ font: "20px var(--font-display)", color: "#2A0F3A", margin: 0 }}>
                    Professional Gallery & Field Documentation
                  </h2>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
                  {galleryList.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setLightboxIndex(idx)}
                      style={{
                        position: "relative",
                        borderRadius: 8,
                        overflow: "hidden",
                        border: "1px solid #e5e7eb",
                        cursor: "pointer",
                        aspectRatio: "4/3",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.caption || `Gallery ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transition: "transform 0.3s ease",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: "6px 10px",
                          background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
                          color: "#ffffff",
                          fontSize: 11,
                          fontWeight: 500,
                        }}
                      >
                        🔍 Click to Enlarge
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Professional Video Showcase */}
            {videoList.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 32,
                  border: "1px solid #eae5db",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <span style={{ width: 4, height: 20, background: "#C19A6B", borderRadius: 2 }} />
                  <h2 style={{ font: "20px var(--font-display)", color: "#2A0F3A", margin: 0 }}>
                    Clinical Features & Keynote Presentations
                  </h2>
                </div>

                <div style={{ display: "grid", gap: 20 }}>
                  {videoList.map((vid) => {
                    const isYouTube = vid.url.includes("youtube.com") || vid.url.includes("youtu.be");
                    const isVimeo = vid.url.includes("vimeo.com");

                    let embedUrl = vid.url;
                    if (isYouTube) {
                      const match = vid.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
                      if (match && match[1]) {
                        embedUrl = `https://www.youtube-nocookie.com/embed/${match[1]}`;
                      }
                    } else if (isVimeo) {
                      const match = vid.url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/);
                      if (match && match[1]) {
                        embedUrl = `https://player.vimeo.com/video/${match[1]}`;
                      }
                    }

                    return (
                      <div key={vid.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
                        <div style={{ position: "relative", paddingTop: "56.25%", background: "#000000" }}>
                          {isYouTube || isVimeo ? (
                            <iframe
                              src={embedUrl}
                              title={vid.title || "Employee Video"}
                              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              src={vid.url}
                              poster={vid.posterUrl}
                              controls
                              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "contain" }}
                            />
                          )}
                        </div>
                        {vid.title && (
                          <div style={{ padding: "12px 16px", background: "#fdfbf7", borderTop: "1px solid #eae5db", fontWeight: 600, fontSize: 13, color: "#2A0F3A" }}>
                            🎬 {vid.title}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: VERIFICATION CARD & QUICK FACTS */}
          <div style={{ display: "grid", gap: 24, alignContent: "start" }}>
            {/* Verification Credentials Card */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: 12,
                padding: 24,
                border: "1px solid #eae5db",
                boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
              }}
            >
              <h3 style={{ font: "16px var(--font-display)", color: "#2A0F3A", margin: "0 0 16px 0" }}>
                Employment Verification
              </h3>

              <div style={{ display: "grid", gap: 12, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}>
                  <span style={{ color: "#6b7280" }}>Official ID</span>
                  <code style={{ fontWeight: 700, color: "#2A0F3A" }}>{employee.employeeId || employee.slug}</code>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}>
                  <span style={{ color: "#6b7280" }}>Department</span>
                  <span style={{ fontWeight: 600, color: "#2A0F3A", textAlign: "right" }}>{employee.department || "General"}</span>
                </div>
                {employee.email && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}>
                    <span style={{ color: "#6b7280" }}>Email</span>
                    <a href={`mailto:${employee.email}`} style={{ color: "#2A0F3A", fontWeight: 600, textDecoration: "none" }}>
                      {employee.email}
                    </a>
                  </div>
                )}
                {employee.phone && (
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f3f4f6", paddingBottom: 8 }}>
                    <span style={{ color: "#6b7280" }}>Phone</span>
                    <a href={`tel:${employee.phone}`} style={{ color: "#2A0F3A", fontWeight: 600, textDecoration: "none" }}>
                      {employee.phone}
                    </a>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4 }}>
                  <span style={{ color: "#6b7280" }}>Status</span>
                  <span style={{ color: "#10b981", fontWeight: 700 }}>Active & Verified</span>
                </div>
              </div>

              <div style={{ marginTop: 20, textAlign: "center" }}>
                <img
                  src={qrCodeUrl}
                  alt="Verification QR"
                  style={{ width: 140, height: 140, borderRadius: 8, border: "1px solid #d1d5db", padding: 6, background: "#fff", display: "inline-block" }}
                />
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
                  Scan to verify authentic credentials on queenscare.in
                </div>
              </div>
            </div>

            {/* All Team Members Card */}
            {allEmployees.length > 0 && (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 12,
                  padding: 24,
                  border: "1px solid #eae5db",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.03)",
                }}
              >
                <h3 style={{ font: "16px var(--font-display)", color: "#2A0F3A", margin: "0 0 14px 0" }}>
                  All Team Members
                </h3>
                <div style={{ display: "grid", gap: 10 }}>
                  {allEmployees
                    .filter((m) => m.slug !== employee.slug)
                    .slice(0, 6)
                    .map((m) => (
                      <Link
                        key={m.slug}
                        href={`/employee/${m.slug}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "8px 10px",
                          borderRadius: 6,
                          textDecoration: "none",
                          color: "inherit",
                          background: "#faf8f5",
                          border: "1px solid #eae5db",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {m.photo || m.profileImage ? (
                          <img
                            src={m.photo || m.profileImage}
                            alt={m.name}
                            style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", border: "1px solid #D4AF37" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: "50%",
                              background: "#2A0F3A",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              fontWeight: 700,
                            }}
                          >
                            {m.name.charAt(0)}
                          </div>
                        )}
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: "#2A0F3A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {m.name}
                          </div>
                          <div style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {m.designation || "Specialist"}
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: "#C19A6B" }}>→</span>
                      </Link>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR MODAL */}
      {showQrModal && (
        <div
          onClick={() => setShowQrModal(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: 32,
              maxWidth: 380,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
              border: "2px solid #D4AF37",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#C19A6B", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Official Verification Credential
            </div>
            <h3 style={{ font: "22px var(--font-display)", color: "#2A0F3A", margin: "8px 0 16px" }}>{employee.name}</h3>

            <div style={{ padding: 12, background: "#faf8f5", borderRadius: 12, display: "inline-block", border: "1px solid #eae5db" }}>
              <img src={qrCodeUrl} alt="Employee QR" style={{ width: 200, height: 200, display: "block" }} />
            </div>

            <div style={{ fontSize: 12, color: "#4b5563", marginTop: 14 }}>
              Scan with any mobile camera to view and authenticate this official Queens Care Laboratories staff profile.
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              style={{
                marginTop: 20,
                padding: "8px 24px",
                background: "#2A0F3A",
                color: "#ffffff",
                border: "none",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close Verification
            </button>
          </div>
        </div>
      )}

      {/* LIGHTBOX MODAL */}
      {lightboxIndex !== null && galleryList[lightboxIndex] && (
        <div
          onClick={() => setLightboxIndex(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 24,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }}>
            <img
              src={galleryList[lightboxIndex].url}
              alt="Lightbox"
              style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 8 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", marginTop: 12 }}>
              <span>
                Image {lightboxIndex + 1} of {galleryList.length}
              </span>
              <div style={{ display: "flex", gap: 12 }}>
                {lightboxIndex > 0 && (
                  <button
                    onClick={() => setLightboxIndex(lightboxIndex - 1)}
                    style={{ padding: "6px 14px", background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                  >
                    ← Previous
                  </button>
                )}
                {lightboxIndex < galleryList.length - 1 && (
                  <button
                    onClick={() => setLightboxIndex(lightboxIndex + 1)}
                    style={{ padding: "6px 14px", background: "rgba(255,255,255,0.2)", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                  >
                    Next →
                  </button>
                )}
                <button
                  onClick={() => setLightboxIndex(null)}
                  style={{ padding: "6px 14px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                >
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
