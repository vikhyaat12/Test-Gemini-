import { json, safeText } from "@/lib/http";
import { fileDb } from "@/lib/commerce/file-db";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.id) return json({ error: "Popup id required" }, 400);

  const id = safeText(body.id, 80);
  const action = safeText(body.action, 40); // "impression" | "click" | "close"

  const popup = fileDb.findOne("sitePopups", (p: Record<string, unknown>) => p.id === id);
  if (!popup) return json({ error: "Popup not found" }, 404);

  const updates: Record<string, unknown> = {};

  if (action === "impression") {
    updates.impressions = (Number(popup.impressions) || 0) + 1;
    updates.lastImpressionAt = new Date().toISOString();
  } else if (action === "click") {
    updates.clicks = (Number(popup.clicks) || 0) + 1;
    updates.lastClickAt = new Date().toISOString();
  } else if (action === "close") {
    updates.closes = (Number(popup.closes) || 0) + 1;
  } else {
    return json({ error: "Invalid action type" }, 400);
  }

  fileDb.update("sitePopups", id, updates);
  return json({ ok: true, action, id });
}
