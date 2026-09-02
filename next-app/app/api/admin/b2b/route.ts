import { json, requireUser } from "@/lib/http";
import { b2bStore, b2bPageStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const [applications, distributors, orders, pageConfig] = await Promise.all([
    b2bStore.applications.list(),
    b2bStore.distributors.list(),
    b2bStore.orders.list(),
    b2bPageStore.get(),
  ]);

  return json({ applications, distributors, orders, pageConfig });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body?.company || !body?.name || !body?.email) {
    return json({ error: "Company, contact person, and email are required." }, 422);
  }

  const app = await b2bStore.applications.create(body);
  return json({ application: app }, 201);
}
