import { json, requireUser } from "@/lib/http";
import { notificationRulesStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const rules = await notificationRulesStore.get();
  return json({ rules });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid payload" }, 400);

  const updated = await notificationRulesStore.save(body);
  return json({ rules: updated });
}
