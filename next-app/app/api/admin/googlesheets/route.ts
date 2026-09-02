import { json, requireUser } from "@/lib/http";
import { googleSheetsStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const config = await googleSheetsStore.get();
  return json({ config });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid payload" }, 400);

  const updated = await googleSheetsStore.save(body);
  return json({ config: updated });
}

// Test / Sync Trigger endpoint
export async function PUT() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const config = await googleSheetsStore.get();
  if (!config.spreadsheetId && !config.webhookUrl) {
    return json({
      success: false,
      status: "not_configured",
      message: "Google Sheets integration is not configured. Please enter a valid Spreadsheet ID or Google Apps Script Webhook URL.",
    });
  }

  // Attempt sync if webhook is configured
  if (config.webhookUrl) {
    try {
      const res = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "manual_sync", timestamp: new Date().toISOString() }),
      });
      if (res.ok) {
        await googleSheetsStore.save({ lastSyncAt: new Date().toISOString(), syncStatus: "connected" });
        return json({ success: true, status: "connected", message: "Google Sheets sync completed successfully." });
      }
    } catch (err: unknown) {
      await googleSheetsStore.save({ syncStatus: "error", syncError: err instanceof Error ? err.message : "Sync failed" });
      return json({ success: false, status: "error", message: `Sync failed: ${err instanceof Error ? err.message : "Network error"}` });
    }
  }

  return json({
    success: false,
    status: "not_configured",
    message: "Google Apps Script webhook URL is required for live push synchronization.",
  });
}
