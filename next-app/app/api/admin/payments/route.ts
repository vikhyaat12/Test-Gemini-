import { json, requireUser } from "@/lib/http";
import { paymentGatewayStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const gateways = await paymentGatewayStore.list();
  return json({ gateways });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  if (!body.provider || !body.displayName) {
    return json({ error: "Provider and display name are required." }, 422);
  }

  try {
    const created = await paymentGatewayStore.create(body);
    return json({ gateway: created }, 201);
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Failed to create payment gateway." }, 500);
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  if (!body.id) {
    return json({ error: "Gateway id is required." }, 422);
  }

  try {
    const updated = await paymentGatewayStore.update(String(body.id), body);
    if (!updated) return json({ error: "Payment gateway not found." }, 404);
    return json({ gateway: updated });
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Failed to update payment gateway." }, 500);
  }
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "Gateway id is required." }, 422);

  const ok = await paymentGatewayStore.delete(id);
  return json({ success: Boolean(ok) });
}
