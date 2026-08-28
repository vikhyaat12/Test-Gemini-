import { json, requireUser } from "@/lib/http";
import { orderStoreExtended } from "@/lib/commerce/store-extensions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.status) return json({ error: "Status is required." }, 422);
  await orderStoreExtended.updateStatus((await params).id, body.status, body.note);
  return json({ ok: true });
}
