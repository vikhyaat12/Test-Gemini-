import { json, requireUser } from "@/lib/http";
import { shippingStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const rules = await shippingStore.rules.get();
  return json({ rules });
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  try {
    const updated = await shippingStore.rules.update(body);
    return json({ rules: updated });
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Failed to update shipping rules." }, 500);
  }
}
