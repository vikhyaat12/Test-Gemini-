import { json, requireUser } from "@/lib/http";
import { affiliateStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const affiliate = await affiliateStore.byUserId(user.id);
  if (!affiliate) return json({ error: "Not an affiliate." }, 403);
  return json({ links: await affiliateStore.links.list(String(affiliate.id)) });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const affiliate = await affiliateStore.byUserId(user.id);
  if (!affiliate) return json({ error: "Not an affiliate." }, 403);
  const body = await request.json().catch(() => ({}));
  const link = await affiliateStore.links.create(String(affiliate.id), body.productId, body.customCode);
  return json({ link }, 201);
}
