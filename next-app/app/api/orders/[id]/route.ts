import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const order = await store.orders.byId((await params).id);
  if (!user || !order || (user.role !== "admin" && order.userId !== user.id)) return json({ error: "Not found" }, 404);
  return json({ order });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireUser(["admin"]))) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  const allowed = ["pending", "paid", "packed", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(body?.status)) return json({ error: "Invalid status" }, 422);
  const order = await store.orders.update((await params).id, { status: body.status, trackingCode: typeof body.trackingCode === "string" ? body.trackingCode.slice(0, 80) : undefined });
  return order ? json({ order }) : json({ error: "Not found" }, 404);
}

