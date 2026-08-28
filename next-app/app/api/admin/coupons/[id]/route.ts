import { json, requireUser } from "@/lib/http";
import { couponStore } from "@/lib/commerce/store-extensions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "No data provided." }, 422);
  return json({ coupon: await couponStore.update((await params).id, body) });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  await couponStore.delete((await params).id);
  return json({ ok: true });
}
