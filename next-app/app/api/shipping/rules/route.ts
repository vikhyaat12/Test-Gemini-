import { json } from "@/lib/http";
import { shippingStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  const rules = await shippingStore.rules.get();
  return json({
    freeShippingThreshold: Number(rules.freeShippingThreshold || 1500),
    standardShippingFee: Number(rules.standardShippingFee || 99),
    expressShippingFee: Number(rules.expressShippingFee || 199),
    codHandlingFee: Number(rules.codHandlingFee || 0),
    estimatedDaysMetro: String(rules.estimatedDaysMetro || "2-3 business days"),
    estimatedDaysNonMetro: String(rules.estimatedDaysNonMetro || "4-6 business days"),
  });
}
