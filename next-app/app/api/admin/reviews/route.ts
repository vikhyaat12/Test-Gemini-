import { json, requireUser, safeText } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const reviews = await store.reviews.all();
  return json({ reviews });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const rating = Number(body.rating || 5);
  const productId = String(body.productId || "");

  if (!productId || rating < 1 || rating > 5) {
    return json({ error: "productId and rating (1-5) required" }, 422);
  }

  const review = await store.reviews.create({
    productId,
    customerName: body.customerName || body.author || body.name || "Customer",
    rating,
    title: safeText(body.title || "Review", 120),
    body: safeText(body.body || body.text || "", 2000),
    verified: body.verified !== false,
    visible: body.visible !== false,
    image: body.image || "",
  });

  return json({ review }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.reviewId && !body.id) return json({ error: "reviewId or id required" }, 422);
  const id = body.reviewId || body.id;
  const visible = body.visible !== undefined ? Boolean(body.visible) : true;
  const review = await store.reviews.updateVisibility(id, visible);
  return json({ review });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const reviewId = searchParams.get("reviewId") || searchParams.get("id");
  if (!reviewId) return json({ error: "reviewId required" }, 422);
  await store.reviews.delete(reviewId);
  return json({ ok: true });
}
