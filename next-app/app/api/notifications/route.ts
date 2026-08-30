import { json } from "@/lib/http";
import { notificationStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const items = await notificationStore.active();
  return json({ notifications: items });
}
