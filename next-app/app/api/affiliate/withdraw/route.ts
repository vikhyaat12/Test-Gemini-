import { json, requireUser } from "@/lib/http";
import { affiliateStore } from "@/lib/commerce/store-extensions";

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const affiliate = await affiliateStore.byUserId(user.id);
  if (!affiliate) return json({ error: "Not an affiliate." }, 403);
  const body = await request.json().catch(() => null);
  if (!body?.amount || body.amount <= 0) return json({ error: "Valid amount required." }, 422);
  try {
    const withdrawal = await affiliateStore.withdrawals.request(String(affiliate.id), body.amount, body.method);
    return json({ withdrawal }, 201);
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Withdrawal failed." }, 400);
  }
}
