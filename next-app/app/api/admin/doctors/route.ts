import { json, requireUser } from "@/lib/http";
import { doctorStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const doctors = await doctorStore.list();
  return json({ doctors });
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id || !body.status) return json({ error: "id and status required" }, 422);
  const doctor = await doctorStore.updateStatus(body.id, body.status);
  return json({ doctor });
}
