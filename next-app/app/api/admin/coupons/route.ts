import { json, requireUser } from "@/lib/http";
import { couponStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return json({ coupons: await couponStore.list() });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.code || !body?.discount) return json({ error: "Code and discount are required." }, 422);
  try {
    const coupon = await couponStore.create({ ...body, createdByUserId: user.id });
    return json({ coupon }, 201);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to create coupon.";
    return json({ error: msg }, 409);
  }
}
