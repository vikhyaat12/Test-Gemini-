"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type RecommendedProduct = {
  id: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  mrp?: number;
  discount?: number;
  category: string;
  score: number;
  reason: string;
};

export default function RecommendationsSection({
  currentSlug,
  title = "You may also like",
  limit = 4,
}: {
  currentSlug: string;
  title?: string;
  limit?: number;
}) {
  const [products, setProducts] = useState<RecommendedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchRecs = async () => {
      try {
        const res = await fetch(`/api/recommendations?slug=${currentSlug}&limit=${limit}`);
        const data = await res.json();
        if (!cancelled && data.recommendations) {
          setProducts(data.recommendations);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    };
    fetchRecs();
    return () => { cancelled = true; };
  }, [currentSlug, limit]);

  if (loading || products.length === 0) return null;

  return (
    <section style={{ marginTop: 48 }}>
      <h2 style={{ font: "22px var(--font-display)", marginBottom: 20 }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(200px, 1fr))`, gap: 20 }}>
        {products.map(p => (
          <Link href={`/products/${p.slug}`} key={p.id} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ border: "1px solid var(--line)", overflow: "hidden", transition: "box-shadow 0.2s" }}>
              <img
                src={p.image}
                alt={p.name}
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }}
                loading="lazy"
              />
              <div style={{ padding: "10px 12px" }}>
                <p style={{ fontSize: 10, color: "var(--muted)", margin: "0 0 2px", textTransform: "uppercase" as const, letterSpacing: ".05em" }}>
                  {p.category}
                </p>
                <b style={{ display: "block", font: "15px var(--font-display)", marginBottom: 4 }}>{p.name}</b>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>₹{p.price.toLocaleString("en-IN")}</span>
                  {p.mrp && p.mrp > p.price && (
                    <span style={{ fontSize: 12, color: "var(--muted)", textDecoration: "line-through" }}>₹{p.mrp.toLocaleString("en-IN")}</span>
                  )}
                  {p.discount && p.discount > 0 && (
                    <span style={{ fontSize: 11, color: "#4caf50", fontWeight: 600 }}>{p.discount}% off</span>
                  )}
                </div>
                <p style={{ fontSize: 10, color: "var(--muted)", margin: "4px 0 0" }}>{p.reason}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
