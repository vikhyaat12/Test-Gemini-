import { json, requireUser } from "@/lib/http";
import { shippingStore } from "@/lib/commerce/store-extensions";

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  if (!body.id) {
    return json({ error: "Provider id is required." }, 422);
  }

  if (body.credentials && typeof body.credentials === "object") {
    await shippingStore.providers.update(String(body.id), {
      credentials: body.credentials,
      mode: body.mode,
    });
  }

  const result = await shippingStore.providers.testConnection(String(body.id));
  return json(result);
}
