import { json } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(request: Request) {
	const body = await request.json().catch(() => null);
	const order = await store.orders.byId(String(body?.orderId || ""));
	if (!order) return json({ error: "Order not found" }, 404);
	try {
		const payment = await createRazorpayOrder(order.id, order.total * 100);
		return json({ ...payment, orderId: order.id, message: payment.mode === "local" ? "Local payment mode: configure Razorpay keys to charge cards." : undefined });
	} catch {
		return json({ error: "Payment provider is unavailable. Please try again." }, 502);
	}
}
