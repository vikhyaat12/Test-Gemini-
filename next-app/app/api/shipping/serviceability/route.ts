import { json } from "@/lib/http";
import { shippingStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get("pincode") || "";
  const subtotal = Number(searchParams.get("subtotal") || 0);

  if (!pincode) {
    return json({ error: "Pincode is required." }, 400);
  }

  const result = await shippingStore.rules.checkServiceability(pincode);
  const rateInfo = await shippingStore.rules.calculate(subtotal, pincode);

  return json({
    ...result,
    shippingFee: rateInfo.shippingFee,
    freeShippingEligible: rateInfo.freeShippingEligible,
    amountNeededForFreeShipping: rateInfo.amountNeededForFreeShipping,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pincode = String(body.pincode || "");
  const subtotal = Number(body.subtotal || 0);
  const method = String(body.method || "standard");

  if (!pincode) {
    return json({ error: "Pincode is required." }, 400);
  }

  const result = await shippingStore.rules.checkServiceability(pincode);
  const rateInfo = await shippingStore.rules.calculate(subtotal, pincode, method);

  return json({
    ...result,
    ...rateInfo,
  });
}
