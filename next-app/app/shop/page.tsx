"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useMemo } from "react";
import { store } from "@/lib/commerce/store";
import type { Product } from "@/lib/commerce/types";

type SortKey = "name" | "price-asc" | "price-desc" | "newest";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await store.products.list();
        setProducts(data);
        const cats = [...new Set(data.map((p) => p.category))];
        setCategories(cats);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (selectedCategory !== "all") {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <main className="editorial">
      <Link href="/" className="back">← Queens Care</Link>
      <p className="eyebrow">Queens Care Laboratories</p>
      <h1>Shop all care</h1>
      <p>Our complete collection of considered essentials — each formulated with pharmaceutical rigour and a human touch.</p>

      {/* Search and Filter Bar */}
      <div className="shop-toolbar" style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", border: "1px solid var(--line)", fontSize: 14, background: "var(--paper)" }}
            aria-label="Search products"
          />
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: "12px 16px", border: "1px solid var(--line)", fontSize: 14, background: "var(--paper)", minWidth: 180 }}
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            style={{ padding: "12px 16px", border: "1px solid var(--line)", fontSize: 14, background: "var(--paper)", minWidth: 180 }}
            aria-label="Sort products"
          >
            <option value="name">Sort by name (A-Z)</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="newest">Newest first</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ marginTop: 40, color: "var(--muted)" }}>Loading collection…</p>
      ) : (
        <>
          <div className="category-products" style={{ marginTop: 30 }}>
            {filteredProducts.map((p) => (
              <Link href={`/products/${p.slug}`} key={p.id} style={{ textDecoration: "none", color: "inherit" }}>
                <Image src={p.image} alt={p.name} width={600} height={420} sizes="(max-width: 650px) 100vw, 33vw" style={{ width: "100%", height: 210, objectFit: "cover" }} />
                <b style={{ font: "22px var(--font-display)", display: "block", marginTop: 12 }}>{p.name}</b>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{p.category}</span>
                <span style={{ fontSize: 14, fontWeight: 600, marginTop: 4, display: "block" }}>₹{p.price.toLocaleString("en-IN")}</span>
              </Link>
            ))}
          </div>
          {!filteredProducts.length && products.length > 0 && (
            <p style={{ marginTop: 40, textAlign: "center", color: "var(--muted)" }}>
              No products match your filters. Try adjusting your search or category.
            </p>
          )}
          {!products.length && !loading && (
            <p style={{ marginTop: 40, textAlign: "center", color: "var(--muted)" }}>
              Our care team is curating this collection. Please check back soon.
            </p>
          )}
        </>
      )}
    </main>
  );
}