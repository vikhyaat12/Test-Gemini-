import { json } from "@/lib/http";
import { pushSubscriptionStore } from "@/lib/commerce/store-extensions";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return json({ error: "Invalid subscription data" }, 400);
    }

    const record = await pushSubscriptionStore.upsert(subscription.endpoint, {
      endpoint: subscription.endpoint,
      keys: subscription.keys || {},
      expirationTime: subscription.expirationTime || null,
      userAgent: request.headers.get("user-agent") || "",
      active: true,
    });

    return json({ ok: true, id: record?.id });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return json({ error: "Failed to save subscription" }, 500);
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get("endpoint");

    if (!endpoint) {
      // Unsubscribe all — used when user disables notifications
      const subs = await pushSubscriptionStore.active();
      for (const sub of subs) {
        await pushSubscriptionStore.deactivate(String(sub.endpoint));
      }
      return json({ ok: true, deactivated: subs.length });
    }

    await pushSubscriptionStore.deactivate(endpoint);
    return json({ ok: true });
  } catch (err) {
    console.error("Push unsubscribe error:", err);
    return json({ error: "Failed to unsubscribe" }, 500);
  }
}
