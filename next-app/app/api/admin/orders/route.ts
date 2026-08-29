import { json, requireUser } from "@/lib/http";
import { orderStoreExtended } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const orders = await orderStoreExtended.all();
  return json({ orders });
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.status) return json({ error: "id and status required." }, 422);
  await orderStoreExtended.updateStatus(body.id, body.status, body.note);
  return json({ ok: true });
}
