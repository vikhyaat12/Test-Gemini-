import { json, requireUser } from "@/lib/http";
import { affiliateStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const withdrawals = await affiliateStore.withdrawals.all();
  return json({ withdrawals });
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.withdrawalId || !body?.status) {
    return json({ error: "withdrawalId and status ('approved'|'paid'|'rejected') are required." }, 422);
  }
  const updated = await affiliateStore.withdrawals.updateStatus(body.withdrawalId, body.status);
  return json({ withdrawal: updated });
}
