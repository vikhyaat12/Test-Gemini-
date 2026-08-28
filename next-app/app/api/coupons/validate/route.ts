import { json, safeText } from "@/lib/http";
import { couponStore } from "@/lib/commerce/store-extensions";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const code = safeText(body.code, 40);
  const subtotal = Number(body.subtotal) || 0;
  if (!code) return json({ error: "Coupon code required" }, 422);

  // Check if prisma is available
  try {
    await prisma.$connect();
  } catch {
    return json({ error: "Coupon validation requires a database connection." }, 503);
  }

  const result = await couponStore.validate(code, subtotal, body.userId);
  if (!result.valid) return json({ error: result.error }, 400);
  return json({ discount: result.discount, coupon: { code: result.coupon?.code, type: result.coupon?.type, discount: result.coupon?.discount } });
}
