"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { StoreLocation, StoreLocatorPageConfig } from "@/lib/commerce/store-extensions";

export default function StoreLocatorDashboard() {
  const [locations, setLocations] = useState<Array<StoreLocation & { distanceKm?: number }>>([]);
  const [pageConfig, setPageConfig] = useState<StoreLocatorPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Search input & active filters
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [geoError, setGeoError] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [activeSearchLabel, setActiveSearchLabel] = useState("");

  const fetchLocations = useCallback(async (q: string, type: string, coords?: { lat: number; lng: number } | null) => {
    try {
      setSearching(true);
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (type && type !== "all") params.set("type", type);
      if (coords) {
        params.set("lat", String(coords.lat));
        params.set("lng", String(coords.lng));
      }

      const res = await fetch(`/api/store-locator?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLocations(data.locations || []);
        if (data.pageConfig) setPageConfig(data.pageConfig);
      }
    } catch (err) {
      console.error("Error querying stores:", err);
    } finally {
      setSearching(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations("", "all");
  }, [fetchLocations]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeoError("");
    setActiveSearchLabel(query.trim());
    fetchLocations(query, activeType, userCoords);
  };

  const handleTypeChange = (typeId: string) => {
    setActiveType(typeId);
    fetchLocations(query, typeId, userCoords);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation is not supported by your browser. Please search using city or PIN code.");
      return;
    }

    setGeoLoading(true);
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserCoords(coords);
        setGeoLoading(false);
        setActiveSearchLabel("Your Current Location");
        fetchLocations(query, activeType, coords);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError("Location access was not allowed. Please search using city, state, or 6-digit PIN code.");
        } else {
          setGeoError("Unable to retrieve location. Please search manually by city or PIN code.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleClearSearch = () => {
    setQuery("");
    setUserCoords(null);
    setGeoError("");
    setActiveSearchLabel("");
    fetchLocations("", activeType, null);
  };

  if (loading) {
    return (
      <div style={{ background: "var(--paper, #fdfbf7)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "var(--muted, #666)", fontSize: 14 }}>Loading Queens Care Store Locator…</p>
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
            Store Locator Under Scheduled Maintenance
          </h2>
          <p style={{ fontSize: 14, color: "var(--muted, #666)", lineHeight: 1.7, marginBottom: 24 }}>
            The Queens Care store &amp; distributor locator is currently undergoing regional network updates. Please check back shortly or contact our customer team directly.
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
  const types = (pageConfig?.types || []).filter((t) => t.visible !== false);
  const b2bCta = pageConfig?.b2bCta;

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
            }}
          >
            <span style={{ font: "20px var(--font-display, serif)", fontWeight: 900, color: "#D4AF37" }}>Q</span>
            <span>← Return to Storefront</span>
          </Link>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted, #666)", textTransform: "uppercase", letterSpacing: ".06em" }}>
              Verified Retail Network
            </span>
            <Link
              href="/b2b"
              style={{
                padding: "7px 16px",
                background: "#f0ebfa",
                color: "var(--purple, #2A0F3A)",
                border: "1px solid rgba(42,15,58,0.2)",
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              Become a Distributor →
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* ─── 1. HERO SECTION & SEARCH INTERFACE ─── */}
        <section style={{ textAlign: "center", maxWidth: 840, margin: "0 auto 40px" }}>
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
            {hero?.eyebrow || "Authorized Queens Care Network"}
          </span>

          <h1
            style={{
              font: "clamp(30px, 4vw, 44px) var(--font-display, serif)",
              color: "var(--purple, #2A0F3A)",
              lineHeight: 1.15,
              margin: "0 0 14px",
              letterSpacing: "-0.02em",
            }}
          >
            {hero?.heading || "Store & Distributor Locator"}
          </h1>

          <p
            style={{
              fontSize: "clamp(14px, 1.8vw, 16px)",
              color: "var(--muted, #666)",
              lineHeight: 1.6,
              margin: "0 0 28px",
            }}
          >
            {hero?.subtitle || "Find verified pharmacies, hospital stockists, and authorized regional distribution centers near you."}
          </p>

          {/* Search Box Form */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              background: "#fff",
              border: "1px solid var(--line, rgba(0,0,0,0.12))",
              borderRadius: 8,
              padding: 8,
              boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 260, position: "relative", display: "flex", alignItems: "center" }}>
              <span style={{ position: "absolute", left: 14, fontSize: 18, color: "var(--muted, #666)" }}>🔍</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={hero?.searchPlaceholder || "Enter city, state or 6-digit pincode (e.g. 110001, Mumbai, Delhi)…"}
                style={{
                  width: "100%",
                  padding: "14px 14px 14px 44px",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  background: "transparent",
                  color: "var(--ink, #1a1a1a)",
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{ background: "none", border: "none", color: "var(--muted, #666)", fontSize: 16, cursor: "pointer", padding: "0 12px" }}
                >
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={geoLoading}
                style={{
                  padding: "12px 18px",
                  background: "#f0ebfa",
                  color: "var(--purple, #2A0F3A)",
                  border: "1px solid rgba(42,15,58,0.2)",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: geoLoading ? "wait" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>📍</span>
                <span>{geoLoading ? "Locating…" : (hero?.locationButtonText || "Use My Location")}</span>
              </button>

              <button
                type="submit"
                disabled={searching}
                style={{
                  padding: "12px 24px",
                  background: "var(--purple, #2A0F3A)",
                  color: "#D4AF37",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: searching ? "wait" : "pointer",
                  boxShadow: "0 2px 8px rgba(42,15,58,0.2)",
                }}
              >
                {searching ? "Searching…" : (hero?.searchButtonText || "Search Locations")}
              </button>
            </div>
          </form>

          {/* Geo error notice */}
          {geoError && (
            <div
              style={{
                padding: "10px 16px",
                background: "#fde8e8",
                border: "1px solid #f8b4b4",
                borderRadius: 6,
                color: "#b34141",
                fontSize: 12,
                fontWeight: 600,
                textAlign: "left",
                marginBottom: 16,
              }}
            >
              ⚠️ {geoError}
            </div>
          )}

          {/* Category Filter Pills */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 12 }}>
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTypeChange(t.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  border: "1px solid",
                  borderColor: activeType === t.id ? "var(--purple, #2A0F3A)" : "var(--line, rgba(0,0,0,0.12))",
                  background: activeType === t.id ? "var(--purple, #2A0F3A)" : "#fff",
                  color: activeType === t.id ? "#D4AF37" : "var(--ink, #333)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease",
                }}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ─── 2. RESULTS SECTION ─── */}
        <section style={{ marginBottom: 60 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ font: "20px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: 0 }}>
                {activeSearchLabel
                  ? `Locations near "${activeSearchLabel}"`
                  : activeType !== "all"
                  ? `${activeType.replace("_", " ").toUpperCase()} Locations`
                  : "All Verified Queens Care Locations"}
              </h2>
              <span style={{ fontSize: 12, color: "var(--muted, #666)" }}>
                {locations.length} authorized locations found
                {userCoords ? " (sorted by nearest distance)" : ""}
              </span>
            </div>

            {(query || activeType !== "all" || userCoords) && (
              <button
                type="button"
                onClick={handleClearSearch}
                style={{
                  padding: "6px 12px",
                  background: "none",
                  border: "1px solid var(--line, rgba(0,0,0,0.15))",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--purple, #2A0F3A)",
                  cursor: "pointer",
                }}
              >
                Reset Filters ✕
              </button>
            )}
          </div>

          {locations.length === 0 ? (
            /* ─── NO RESULTS STATE ─── */
            <div
              style={{
                background: "#fff",
                border: "1px dashed var(--line, rgba(0,0,0,0.15))",
                borderRadius: 8,
                padding: "48px 32px",
                textAlign: "center",
                maxWidth: 680,
                margin: "0 auto",
              }}
            >
              <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>📍</span>
              <h3 style={{ font: "22px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 10px" }}>
                No Authorized Store or Distributor Found in This Area
              </h3>
              <p style={{ fontSize: 14, color: "var(--muted, #666)", lineHeight: 1.6, maxWidth: 500, margin: "0 auto 24px" }}>
                We could not locate any authorized Queens Care dispensary or wholesale distributor matching <b>&quot;{query || activeType}&quot;</b>.
              </p>

              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={handleClearSearch}
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
                  View All Nationwide Stores
                </button>

                <Link
                  href="/b2b#enquiry-form"
                  style={{
                    padding: "10px 20px",
                    background: "var(--purple, #2A0F3A)",
                    color: "#D4AF37",
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Apply to Become a Stockist →
                </Link>
              </div>
            </div>
          ) : (
            /* ─── STORE CARDS GRID ─── */
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 20 }}>
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  style={{
                    background: "#fff",
                    border: loc.isFeatured ? "2px solid #D4AF37" : "1px solid var(--line, rgba(0,0,0,0.08))",
                    borderRadius: 8,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    boxShadow: loc.isFeatured ? "0 4px 18px rgba(212,175,55,0.15)" : "0 2px 8px rgba(0,0,0,0.03)",
                    position: "relative",
                  }}
                >
                  <div>
                    {/* Top Row: Type Tag & Distance Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "3px 8px",
                          background: "#f0ebfa",
                          color: "var(--purple, #2A0F3A)",
                          borderRadius: 3,
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                        }}
                      >
                        {loc.type?.replace("_", " ")}
                      </span>

                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        {loc.distanceKm !== undefined && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#2e7d32",
                              background: "#e9f7e9",
                              padding: "2px 8px",
                              borderRadius: 12,
                            }}
                          >
                            📍 {loc.distanceKm} km away
                          </span>
                        )}
                        {loc.isAuthorized && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37" }} title="Verified Authorized Partner">
                            ⭐ Authorized
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Store Title */}
                    <h3 style={{ font: "18px var(--font-display, serif)", color: "var(--purple, #2A0F3A)", margin: "0 0 8px", lineHeight: 1.3 }}>
                      {loc.name}
                    </h3>

                    {/* Address & City */}
                    <p style={{ fontSize: 13, color: "var(--ink, #333)", lineHeight: 1.5, margin: "0 0 8px" }}>
                      {loc.address}
                    </p>
                    <p style={{ fontSize: 12, color: "var(--muted, #666)", margin: "0 0 12px" }}>
                      <b>{loc.city}</b>, {loc.state} — <b>PIN {loc.pincode}</b>
                      {loc.region ? ` (${loc.region})` : ""}
                    </p>

                    {/* Details Strip */}
                    <div style={{ borderTop: "1px solid var(--line, rgba(0,0,0,0.06))", paddingTop: 10, marginBottom: 16, display: "grid", gap: 4, fontSize: 12 }}>
                      {loc.contactPerson && (
                        <div>
                          <span style={{ color: "var(--muted, #666)" }}>Contact:</span> <b>{loc.contactPerson}</b>
                        </div>
                      )}
                      {loc.openingHours && (
                        <div>
                          <span style={{ color: "var(--muted, #666)" }}>Hours:</span> {loc.openingHours}
                        </div>
                      )}
                      {loc.productsHandled && (
                        <div>
                          <span style={{ color: "var(--muted, #666)" }}>Stock Range:</span> {loc.productsHandled}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ borderTop: "1px solid var(--line, rgba(0,0,0,0.08))", paddingTop: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {loc.phone && (
                      <a
                        href={`tel:${loc.phone.replace(/[^0-9+]/g, "")}`}
                        style={{
                          flex: 1,
                          minWidth: 90,
                          padding: "8px 12px",
                          background: "#fff",
                          border: "1px solid var(--line, rgba(0,0,0,0.15))",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--purple, #2A0F3A)",
                          textAlign: "center",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <span>📞</span>
                        <span>Call</span>
                      </a>
                    )}

                    {loc.whatsapp && (
                      <a
                        href={`https://wa.me/${loc.whatsapp.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          flex: 1,
                          minWidth: 100,
                          padding: "8px 12px",
                          background: "#e8f5e9",
                          border: "1px solid #c8e6c9",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#2e7d32",
                          textAlign: "center",
                          textDecoration: "none",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 4,
                        }}
                      >
                        <span>💬</span>
                        <span>WhatsApp</span>
                      </a>
                    )}

                    <a
                      href={loc.directionsUrl || (loc.latitude && loc.longitude ? `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${loc.name} ${loc.city} ${loc.pincode}`)}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1,
                        minWidth: 110,
                        padding: "8px 12px",
                        background: "var(--purple, #2A0F3A)",
                        color: "#D4AF37",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 700,
                        textAlign: "center",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      <span>🧭</span>
                      <span>Directions ↗</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── 3. B2B PARTNERSHIP CALLOUT BANNER ─── */}
        {b2bCta?.visible !== false && (
          <section
            style={{
              background: "linear-gradient(135deg, var(--purple, #2A0F3A) 0%, #170721 100%)",
              color: "#fff",
              borderRadius: 8,
              padding: "40px 32px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20,
              boxShadow: "0 8px 30px rgba(42,15,58,0.18)",
            }}
          >
            <div style={{ maxWidth: 620 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
                Commercial Partnership
              </span>
              <h3 style={{ font: "clamp(20px, 3vw, 26px) var(--font-display, serif)", color: "#fff", margin: "4px 0 8px" }}>
                {b2bCta?.heading || "Looking to Become an Authorized Queens Care Stockist?"}
              </h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: 0, lineHeight: 1.6 }}>
                {b2bCta?.description || "Expand your pharmacy or clinical practice with high-potency formulations, protected regional territories, and wholesale commercial margins."}
              </p>
            </div>

            <Link
              href={b2bCta?.buttonLink || "/b2b#enquiry-form"}
              style={{
                padding: "12px 24px",
                background: "#D4AF37",
                color: "var(--purple, #2A0F3A)",
                borderRadius: 4,
                fontSize: 13,
                fontWeight: 800,
                textDecoration: "none",
                display: "inline-block",
                boxShadow: "0 4px 14px rgba(212,175,55,0.3)",
              }}
            >
              {b2bCta?.buttonText || "Submit B2B Partnership Enquiry →"}
            </Link>
          </section>
        )}
      </div>
    </div>
  );
}
