import { json, requireUser } from "@/lib/http";
import { storeLocatorStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const location = await storeLocatorStore.byId(id);
  if (!location) return json({ error: "Store location not found" }, 404);

  return json({ success: true, location });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const updated = await storeLocatorStore.update(id, body);
    if (!updated) return json({ error: "Store location not found" }, 404);

    return json({ success: true, location: updated });
  } catch (error) {
    console.error("Admin update store location error:", error);
    return json({ error: "Failed to update store location" }, 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const deleted = await storeLocatorStore.delete(id);
  if (!deleted) return json({ error: "Store location not found" }, 404);

  return json({ success: true, message: "Store location deleted successfully" });
}
