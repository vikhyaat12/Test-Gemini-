import { json, requireUser } from "@/lib/http";
import { paymentGatewayStore } from "@/lib/commerce/store-extensions";

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  if (!body.id) {
    return json({ error: "Gateway id is required." }, 422);
  }

  // If new credentials were provided in test payload, update first or test directly
  if (body.credentials && typeof body.credentials === "object") {
    await paymentGatewayStore.update(String(body.id), {
      credentials: body.credentials,
      mode: body.mode,
    });
  }

  const result = await paymentGatewayStore.testConnection(String(body.id));
  return json(result);
}
