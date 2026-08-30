import { json, requireUser } from "@/lib/http";
import { shippingStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const providers = await shippingStore.providers.list();
  return json({ providers });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  if (!body.provider || !body.name) {
    return json({ error: "Provider and name are required." }, 422);
  }

  try {
    const created = await shippingStore.providers.create(body);
    return json({ provider: created }, 201);
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Failed to create shipping provider." }, 500);
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  if (!body.id) {
    return json({ error: "Provider id is required." }, 422);
  }

  try {
    const updated = await shippingStore.providers.update(String(body.id), body);
    if (!updated) return json({ error: "Shipping provider not found." }, 404);
    return json({ provider: updated });
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Failed to update shipping provider." }, 500);
  }
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "Provider id is required." }, 422);

  const ok = await shippingStore.providers.delete(id);
  return json({ success: Boolean(ok) });
}
