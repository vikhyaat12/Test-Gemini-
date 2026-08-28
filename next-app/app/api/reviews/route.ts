import { json, requireUser, safeText } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("productId");
  return id ? json({ reviews: await store.reviews.list(id) }) : json({ error: "productId is required" }, 422);
}

export async function POST(request: Request) {
  const u = await requireUser();
  if (!u) return json({ error: "Unauthorized" }, 401);
  const b = await request.json().catch(() => null), rating = Number(b?.rating), productId = String(b?.productId || "");
  const productsAll = await store.products.all();
  if (!productsAll.some((p) => p.id === productId) || !Number.isInteger(rating) || rating < 1 || rating > 5) return json({ error: "Invalid review." }, 422);
  return json({ review: await store.reviews.create({ userId: u.id, productId, rating, title: safeText(b?.title, 120), body: safeText(b?.body, 1000) }) }, 201);
}

