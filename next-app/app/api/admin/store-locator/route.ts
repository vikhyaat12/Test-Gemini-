import { json, requireUser } from "@/lib/http";
import { storeLocatorStore, storeLocatorPageStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const [locations, pageConfig] = await Promise.all([
    storeLocatorStore.list(false),
    storeLocatorPageStore.get(),
  ]);

  return json({
    success: true,
    total: locations.length,
    locations,
    pageConfig,
  });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.name || !body.city || !body.state) {
      return json({ error: "Store/Distributor Name, City, and State are required." }, 422);
    }

    const created = await storeLocatorStore.create(body);
    return json({ success: true, location: created }, 201);
  } catch (error) {
    console.error("Admin create store error:", error);
    return json({ error: "Failed to create location record." }, 500);
  }
}
