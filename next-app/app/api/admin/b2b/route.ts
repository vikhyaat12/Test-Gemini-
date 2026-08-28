import { json, requireUser } from "@/lib/http";
import { b2bStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const [applications, distributors, orders] = await Promise.all([
    b2bStore.applications.list(),
    b2bStore.distributors.list(),
    b2bStore.orders.list(),
  ]);
  return json({ applications, distributors, orders });
}
