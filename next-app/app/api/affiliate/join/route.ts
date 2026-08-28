import { json, requireUser } from "@/lib/http";
import { affiliateStore } from "@/lib/commerce/store-extensions";

export async function POST() {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const existing = await affiliateStore.byUserId(user.id);
  if (existing) return json({ affiliate: existing });
  try {
    const affiliate = await affiliateStore.create(user.id);
    return json({ affiliate }, 201);
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Failed to join." }, 500);
  }
}
