import { json, requireUser } from "@/lib/http";
import { fileDb } from "@/lib/commerce/file-db";
import { store } from "@/lib/commerce/store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body?.action) return json({ error: "action required (refund, return_request, return_approve, return_reject)" }, 422);

  const orders = fileDb.findMany("orders");
  const order = orders.find((o: Record<string, unknown>) => o.id === id) as Record<string, unknown> | undefined;
  if (!order) return json({ error: "Order not found" }, 404);

  const validRefundTransitions = ["delivered", "shipped", "out_for_delivery"];
  const validReturnTransitions = ["delivered"];

  if (body.action === "refund") {
    if (!validRefundTransitions.includes(String(order.status))) {
      return json({ error: `Cannot refund order in "${order.status}" status. Must be delivered/shipped.` }, 422);
    }
    const amount = body.amount ? Number(body.amount) : Number(order.total || 0);
    if (amount <= 0 || amount > Number(order.total || 0)) {
      return json({ error: `Refund amount must be between ₹1 and ₹${order.total}` }, 422);
    }

    fileDb.update("orders", id, {
      status: amount >= Number(order.total || 0) ? "refunded" : order.status,
      paymentStatus: amount >= Number(order.total || 0) ? "refunded" : "partially_refunded",
      refundAmount: amount,
      refundReason: body.reason || "Admin refund",
      refundDate: new Date().toISOString(),
      refundBy: String(user.id || user.email),
    });

    fileDb.insert("auditLogs", {
      action: "order_refunded",
      actorId: String(user.id || user.email),
      targetType: "order",
      targetId: id,
      details: `Refunded ₹${amount.toLocaleString("en-IN")}${amount >= Number(order.total || 0) ? " (full)" : " (partial)"}: ${body.reason || "No reason"}`,
      createdAt: new Date().toISOString(),
    });

    fileDb.insert("orderStatusHistory", {
      orderId: id,
      status: "refunded",
      note: `Refund of ₹${amount.toLocaleString("en-IN")} by admin. ${body.reason || ""}`,
      createdAt: new Date().toISOString(),
    });

    return json({ ok: true, refundAmount: amount });
  }

  if (body.action === "return_request") {
    if (!validReturnTransitions.includes(String(order.status))) {
      return json({ error: `Cannot request return for order in "${order.status}" status.` }, 422);
    }
    fileDb.update("orders", id, {
      returnStatus: "requested",
      returnReason: body.reason || "Customer request",
      returnDate: new Date().toISOString(),
    });
    fileDb.insert("orderStatusHistory", {
      orderId: id,
      status: "return_requested",
      note: `Return requested: ${body.reason || "No reason"}`,
      createdAt: new Date().toISOString(),
    });
    return json({ ok: true });
  }

  if (body.action === "return_approve") {
    fileDb.update("orders", id, { returnStatus: "approved", status: "returned" });
    fileDb.insert("orderStatusHistory", {
      orderId: id,
      status: "returned",
      note: `Return approved by admin${body.note ? `: ${body.note}` : ""}`,
      createdAt: new Date().toISOString(),
    });
    fileDb.insert("auditLogs", {
      action: "order_return_approved",
      actorId: String(user.id || user.email),
      targetType: "order",
      targetId: id,
      details: `Return approved${body.note ? `: ${body.note}` : ""}`,
      createdAt: new Date().toISOString(),
    });
    return json({ ok: true });
  }

  if (body.action === "return_reject") {
    fileDb.update("orders", id, { returnStatus: "rejected" });
    fileDb.insert("orderStatusHistory", {
      orderId: id,
      status: "return_rejected",
      note: `Return rejected: ${body.reason || "No reason"}`,
      createdAt: new Date().toISOString(),
    });
    fileDb.insert("auditLogs", {
      action: "order_return_rejected",
      actorId: String(user.id || user.email),
      targetType: "order",
      targetId: id,
      details: `Return rejected: ${body.reason || "No reason"}`,
      createdAt: new Date().toISOString(),
    });
    return json({ ok: true });
  }

  return json({ error: "Unknown action" }, 422);
}
