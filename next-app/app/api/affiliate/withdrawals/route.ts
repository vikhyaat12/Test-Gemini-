import { json, requireUser } from "@/lib/http";
import { affiliateStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const affiliate = await affiliateStore.byUserId(user.id);
  if (!affiliate) return json({ error: "Not an affiliate." }, 403);
  return json({ withdrawals: await affiliateStore.withdrawals.list(affiliate.id) });
}
