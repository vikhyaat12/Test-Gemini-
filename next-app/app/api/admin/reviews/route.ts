import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const reviews = await prisma.review.findMany({ include: { product: true, user: true }, orderBy: { createdAt: "desc" } });
  return json({ reviews });
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.reviewId || body.visible === undefined) return json({ error: "reviewId and visible required" }, 422);
  const review = await prisma.review.update({ where: { id: body.reviewId }, data: { visible: body.visible } });
  return json({ review });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const reviewId = searchParams.get("reviewId");
  if (!reviewId) return json({ error: "reviewId required" }, 422);
  await prisma.review.delete({ where: { id: reviewId } });
  return json({ ok: true });
}
