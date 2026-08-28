import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET() {
  const u = await requireUser();
  return u ? json({ notifications: await store.notifications.list(u.id) }) : json({ error: "Unauthorized" }, 401);
}

