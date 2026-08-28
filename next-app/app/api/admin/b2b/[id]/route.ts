import { json, requireUser } from "@/lib/http";
import { b2bStore } from "@/lib/commerce/store-extensions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.status) return json({ error: "Status is required." }, 422);
  const app = await b2bStore.applications.updateStatus((await params).id, body.status, user.id, body.notes);
  return json({ application: app });
}
