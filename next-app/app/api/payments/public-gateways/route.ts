import { json } from "@/lib/http";
import { paymentGatewayStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  const gateways = await paymentGatewayStore.publicList();
  return json({ gateways });
}
