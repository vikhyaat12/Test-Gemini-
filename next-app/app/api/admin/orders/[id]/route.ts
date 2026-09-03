import { json, requireUser } from "@/lib/http";
import { orderStoreExtended } from "@/lib/commerce/store-extensions";
import { store } from "@/lib/commerce/store";
import { fileDb } from "@/lib/commerce/file-db";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled", "rejected"],
  confirmed: ["processing", "cancelled"],
  processing: ["packed", "cancelled"],
  packed: ["shipped", "cancelled"],
  shipped: ["out_for_delivery", "delivered", "returned"],
  out_for_delivery: ["delivered", "returned"],
  delivered: ["returned", "refunded"],
  returned: ["refunded"],
  cancelled: [],
  rejected: [],
  refunded: [],
  failed: ["pending"],
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const orders = await orderStoreExtended.all();
  const order = orders.find((o: Record<string, unknown>) => o.id === id) as Record<string, unknown> | undefined;
  if (!order) return json({ error: "Order not found" }, 404);

  // Get customer info
  const users = fileDb.findMany("users");
  const customer = users.find((u: Record<string, unknown>) => u.id === order.userId) as Record<string, unknown> | undefined;

  // Get product details for order lines
  const products = await store.products.all();
  const lines = Array.isArray(order.lines) ? order.lines : [];
  const enrichedLines = lines.map((line: Record<string, unknown>) => {
    const product = products.find((p) => p.id === line.productId || p.slug === line.productId);
    return {
      ...line,
      name: product?.name || "Unknown Product",
      image: product?.image || "",
      price: product?.price || 0,
      sku: product?.slug || "",
    };
  });

  // Get status history
  const history = await orderStoreExtended.history(id);

  // Get shipping info
  const shipping = order.shipping as Record<string, unknown> | undefined;

  return json({
    order: {
      ...order,
      lines: enrichedLines,
    },
    customer: customer ? {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt,
    } : null,
    shipping: shipping ? {
      fullName: shipping.fullName || "",
      email: shipping.email || "",
      phone: shipping.phone || "",
      address: shipping.address || "",
      city: shipping.city || "",
      state: shipping.state || "",
      pincode: shipping.pincode || "",
    } : null,
    history: history || [],
    validTransitions: VALID_TRANSITIONS[String(order.status)] || [],
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body?.status) return json({ error: "Status is required." }, 422);

  // Validate status transition
  const orders = await orderStoreExtended.all();
  const order = orders.find((o: Record<string, unknown>) => o.id === id) as Record<string, unknown> | undefined;
  if (!order) return json({ error: "Order not found" }, 404);

  const currentStatus = String(order.status);
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(body.status)) {
    return json({
      error: `Cannot transition from "${currentStatus}" to "${body.status}". Allowed: ${allowed.join(", ") || "none"}`,
    }, 422);
  }

  // Record the action in audit log
  fileDb.insert("auditLogs", {
    action: "order_status_changed",
    actorId: String(user.id || user.email),
    targetType: "order",
    targetId: id,
    details: `Order ${id.slice(0, 12)}: ${currentStatus} → ${body.status}${body.note ? ` (${body.note})` : ""}`,
    createdAt: new Date().toISOString(),
  });

  await orderStoreExtended.updateStatus(id, body.status, body.note || `Changed by admin`);

  // Handle stock rollback on cancellation
  if (body.status === "cancelled" || body.status === "rejected") {
    const lines = Array.isArray(order.lines) ? order.lines : [];
    for (const line of lines) {
      try {
        const product = (await store.products.all()).find((p) => p.id === line.productId || p.slug === line.productId);
        if (product) {
          await store.products.decrementStock(product.id, -(line.quantity as number));
        }
      } catch {}
    }
  }

  return json({ ok: true });
}
