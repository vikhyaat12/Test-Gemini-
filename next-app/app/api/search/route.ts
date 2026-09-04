import { json } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() || "";

  if (!q || q.length < 2) {
    return json({ results: [], query: q });
  }

  const allProducts = await store.products.all();
  const lower = q.toLowerCase();

  const results = allProducts
    .filter((p: Record<string, unknown>) => {
      const name = String(p.name || "").toLowerCase();
      const category = String(p.category || "").toLowerCase();
      const slug = String(p.slug || "").toLowerCase();
      const description = String(p.description || "").toLowerCase();
      const sku = String(p.sku || "").toLowerCase();
      return (
        name.includes(lower) ||
        category.includes(lower) ||
        slug.includes(lower) ||
        description.includes(lower) ||
        sku.includes(lower)
      );
    })
    .map((p: Record<string, unknown>) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.image,
      price: p.price,
      mrp: p.mrp,
      category: p.category,
      stock: p.stock,
    }))
    .slice(0, 12);

  return json({ results, query: q });
}
