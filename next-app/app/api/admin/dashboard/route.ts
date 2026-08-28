import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import type { Order } from "@/lib/commerce/types";

export async function GET() {
  if (!(await requireUser(["admin"]))) return json({ error: "Unauthorized" }, 401);
  const orders = (await store.orders.list()) as Order[];
  const products = await store.products.all();
  return json({
    metrics: {
      orders: orders.length,
      revenue: orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0),
      products: products.length,
      lowStock: products.filter((p) => p.stock < 10).length,
      contacts: "Stored locally in development",
    },
    orders: orders.slice(-5).reverse(),
  });
}
