import { json } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const goal = typeof body?.goal === "string" ? body.goal.toLowerCase() : "";
  const productsAll = await store.products.list();
  const products = productsAll
    .map((p) => ({ ...p, score: (p.category.toLowerCase().includes(goal) ? 100 : 50) + (p.rating || 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  return json({ recommendations: products, disclaimer: "Suggestions are educational only and do not replace advice from a qualified healthcare professional." });
}
