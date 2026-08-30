import { json } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "";
  const limit = Math.min(Number(searchParams.get("limit") || "6"), 12);
  const mode = searchParams.get("mode") || "auto"; // auto, category, tags, manual

  if (!slug) {
    return json({ error: "Product slug is required" }, 400);
  }

  const product = await store.products.bySlug(slug);
  if (!product) {
    return json({ error: "Product not found" }, 404);
  }

  const allProducts = await store.products.list();
  const currentId = product.id;
  const currentCategory = String(product.category || "").toLowerCase();
  const currentTags = String(product.tags || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
  const currentRelatedSlugs = Array.isArray((product as Record<string, unknown>).relatedProducts)
    ? ((product as Record<string, unknown>).relatedProducts as string[])
    : [];

  // Score each product
  type ScoredProduct = { id: string; slug: string; name: string; image: string; price: number; mrp?: number; discount?: number; category: string; score: number; reason: string };
  const scored: ScoredProduct[] = [];

  for (const p of allProducts) {
    if (p.id === currentId) continue;
    if (!p.active && !p.visible) continue;

    let score = 0;
    let reason = "";

    // Manual related products get highest priority
    if (currentRelatedSlugs.includes(p.slug)) {
      score += 100;
      reason = "Manually related";
    }

    // Category match
    if (String(p.category || "").toLowerCase() === currentCategory) {
      score += 30;
      reason = reason || "Same category";
    }

    // Tag overlap
    const pTags = String(p.tags || "").split(",").map(t => t.trim().toLowerCase()).filter(Boolean);
    const overlap = currentTags.filter(t => pTags.includes(t)).length;
    if (overlap > 0) {
      score += overlap * 15;
      reason = reason || `${overlap} shared tag${overlap > 1 ? "s" : ""}`;
    }

    // Brand match
    if (String(p.brand || "").toLowerCase() === String(product.brand || "").toLowerCase()) {
      score += 5;
      reason = reason || "Same brand";
    }

    // Bonus for featured/bestseller
    if ((p as Record<string, unknown>).bestSeller) score += 8;
    if ((p as Record<string, unknown>).featured) score += 5;

    if (score > 0) {
      scored.push({
        id: p.id,
        slug: p.slug,
        name: p.name,
        image: p.image,
        price: p.price,
        mrp: p.mrp,
        discount: p.discount,
        category: String(p.category || ""),
        score,
        reason,
      });
    }
  }

  // Sort by score descending, take top N
  scored.sort((a, b) => b.score - a.score);
  const recommendations = scored.slice(0, limit);

  return json({
    currentProduct: { slug: product.slug, name: product.name },
    recommendations,
    total: recommendations.length,
  });
}
