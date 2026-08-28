import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET() {
  const u = await requireUser();
  return u ? json({ productIds: await store.wishlist.get(u.id) }) : json({ error: "Unauthorized" }, 401);
}

export async function POST(request: Request) {
  const u = await requireUser();
  if (!u) return json({ error: "Unauthorized" }, 401);
  const b = await request.json().catch(() => null);
  const id = String(b?.productId || "");
  const productsAll = await store.products.all();
  if (!productsAll.some((p) => p.id === id)) return json({ error: "Product not found" }, 404);
  return json({ productIds: await store.wishlist.toggle(u.id, id) });
}

