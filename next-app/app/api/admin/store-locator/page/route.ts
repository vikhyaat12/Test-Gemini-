import { json, requireUser } from "@/lib/http";
import { storeLocatorPageStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const config = await storeLocatorPageStore.get();
  return json({ success: true, config });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json().catch(() => null);
    if (!body) return json({ error: "Invalid payload" }, 400);

    const saved = await storeLocatorPageStore.save(body);
    return json({ success: true, config: saved });
  } catch (error) {
    console.error("Admin save store locator page settings error:", error);
    return json({ error: "Failed to save store locator settings" }, 500);
  }
}
