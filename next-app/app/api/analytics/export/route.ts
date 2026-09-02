import { NextRequest, NextResponse } from "next/server";
import { fileDb } from "@/lib/commerce/file-db";

function escapeCSV(val: unknown): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const from = sp.get("from");
    const to = sp.get("to");
    const event = sp.get("event");

    let events = fileDb.findMany("analyticsEvents");

    if (from) {
      const fromDate = new Date(from);
      events = events.filter((e: Record<string, unknown>) => new Date(String(e.timestamp)) >= fromDate);
    }
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      events = events.filter((e: Record<string, unknown>) => new Date(String(e.timestamp)) <= toDate);
    }
    if (event) events = events.filter((e: Record<string, unknown>) => String(e.event) === event);

    events.sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(String(a.timestamp)).getTime() - new Date(String(b.timestamp)).getTime());

    const headers = ["Date", "Time", "Event", "Page", "Product", "ProductSlug", "Category", "SessionID", "VisitorID", "UserID", "Device", "Browser", "Source", "Medium", "Campaign", "Value"];

    const rows = events.map((e: Record<string, unknown>) => {
      const ts = String(e.timestamp || "");
      const date = ts.slice(0, 10);
      const time = ts.slice(11, 19);
      return [
        date, time, e.event, e.page, e.product, e.productSlug, e.category,
        e.sessionId, e.visitorId, e.userId, e.device, e.browser,
        e.source || e.utmSource, e.medium || e.utmMedium, e.campaign || e.utmCampaign,
        e.value ?? "",
      ].map(escapeCSV).join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="analytics-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (err) {
    console.error("Analytics export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
