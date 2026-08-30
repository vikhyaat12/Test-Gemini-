import { json, requireUser } from "@/lib/http";
import { pushSubscriptionStore, pushHistoryStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const [history, allSubs, activeSubs] = await Promise.all([
    pushHistoryStore.list(),
    pushSubscriptionStore.list(),
    pushSubscriptionStore.active(),
  ]);

  return json({
    history: history.slice(0, 50), // Last 50 notifications
    stats: {
      totalSubscribers: allSubs.length,
      activeSubscribers: activeSubs.length,
      totalSent: history.length,
    },
  });
}
