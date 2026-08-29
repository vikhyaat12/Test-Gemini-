import { json, safeText } from "@/lib/http";
import { couponStore } from "@/lib/commerce/store-extensions";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const code = safeText(body.code, 40);
  const subtotal = Number(body.subtotal) || 0;
  if (!code) return json({ valid: false, error: "Coupon code required" }, 422);

  const result = await couponStore.validate(code, subtotal, body.userId);
  if (!result.valid) return json({ valid: false, error: result.error }, 400);
  return json({
    valid: true,
    discount: result.discount,
    coupon: {
      code: result.coupon?.code,
      type: result.coupon?.type,
      discount: result.coupon?.discount,
    },
  });
}

