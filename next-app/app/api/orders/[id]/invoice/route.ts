import { requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const order = await store.orders.byId((await params).id);
  if (!u || !order || (u.role !== "admin" && order.userId !== u.id)) return new Response("Not found", { status: 404 });
  const text = `QUEENS CARE LABORATORIES\nINVOICE ${order.id}\nDate: ${order.createdAt}\nStatus: ${order.status}\nTotal: INR ${order.total}\nTracking: ${order.trackingCode || "Pending"}\n`;
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="${order.id}-invoice.txt"` } });
}

