import { json, requireUser } from "@/lib/http";
import { affiliateStore } from "@/lib/commerce/store-extensions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  const { id } = await params;
  if (!body) return json({ error: "Payload required." }, 422);

  const updates: Record<string, unknown> = {};
  if (body.status) updates.status = body.status;
  if (body.commissionRate !== undefined) updates.commissionRate = Number(body.commissionRate);
  if (body.customCoupon !== undefined) updates.customCoupon = body.customCoupon;
  if (body.level !== undefined) updates.level = Number(body.level);

  const updated = await affiliateStore.update(id, updates);
  return json({ affiliate: updated });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { id } = await params;
  const affiliate = await affiliateStore.byId(id);
  if (!affiliate) return json({ error: "Affiliate not found." }, 404);
  const stats = await affiliateStore.getStats(id);
  const links = await affiliateStore.links.list(id);
  const commissions = await affiliateStore.commissions.list(id);
  const withdrawals = await affiliateStore.withdrawals.list(id);
  return json({ affiliate, stats, links, commissions, withdrawals });
}

