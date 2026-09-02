import { json, requireUser } from "@/lib/http";
import { careerStore, CareerApplication } from "@/lib/commerce/store-extensions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const application = await careerStore.byId(id);
  if (!application) return json({ error: "Application not found" }, 404);

  return json({ application });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid request payload" }, 400);

  const updated = await careerStore.updateStatus(
    id,
    body.status as CareerApplication["status"],
    body.notes
  );

  if (!updated) return json({ error: "Application not found" }, 404);
  return json({ application: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const ok = await careerStore.delete(id);
  if (!ok) return json({ error: "Failed to delete application" }, 404);

  return json({ success: true });
}
