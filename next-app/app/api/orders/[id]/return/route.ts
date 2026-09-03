import { json, requireUser } from "@/lib/http";
import { fileDb } from "@/lib/commerce/file-db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["customer"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);

  const orders = fileDb.findMany("orders");
  const order = orders.find((o: Record<string, unknown>) => o.id === id && o.userId === user.id) as Record<string, unknown> | undefined;
  if (!order) return json({ error: "Order not found" }, 404);

  if (!["delivered"].includes(String(order.status))) {
    return json({ error: "Return can only be requested for delivered orders." }, 422);
  }

  if (order.returnStatus === "requested" || order.returnStatus === "approved") {
    return json({ error: "Return already requested/approved for this order." }, 422);
  }

  if (!body?.reason) return json({ error: "Return reason is required." }, 422);

  fileDb.update("orders", id, {
    returnStatus: "requested",
    returnReason: body.reason,
    returnDescription: body.description || "",
    returnDate: new Date().toISOString(),
  });

  fileDb.insert("orderStatusHistory", {
    orderId: id,
    status: "return_requested",
    note: `Customer requested return: ${body.reason}${body.description ? ` — ${body.description}` : ""}`,
    createdAt: new Date().toISOString(),
  });

  return json({ ok: true, message: "Return request submitted. We will review within 48 hours." });
}
