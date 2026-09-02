import { json, requireUser } from "@/lib/http";
import { b2bStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const app = await b2bStore.applications.byId(id);
  if (!app) return json({ error: "Enquiry not found" }, 404);

  return json({ application: app });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid payload" }, 400);

  const status = body.status;
  const notes = body.notes;

  const app = await b2bStore.applications.updateStatus(id, status, user.id, notes);
  if (!app) return json({ error: "Enquiry not found or update failed." }, 404);

  return json({ application: app, success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const ok = await b2bStore.applications.delete(id);
  if (!ok) return json({ error: "Enquiry not found or delete failed." }, 404);

  return json({ success: true, message: "B2B enquiry record deleted successfully." });
}
