import { NextRequest, NextResponse } from "next/server";
import { fileDb } from "@/lib/commerce/file-db";

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function sanitizeUrl(url: string): string {
  try {
    const u = new URL(url, "http://localhost");
    return u.pathname + u.search;
  } catch {
    return url.replace(/[<>"']/g, "").slice(0, 500);
  }
}

function sanitizeString(s: string): string {
  return s.replace(/[<>"']/g, "").slice(0, 500);
}

const SENSITIVE_FIELDS = ["password", "otp", "cvv", "cardNumber", "secret", "token", "ssn"];

function isPayloadSafe(payload: Record<string, unknown>): boolean {
  for (const key of Object.keys(payload)) {
    if (SENSITIVE_FIELDS.some(f => key.toLowerCase().includes(f))) return false;
  }
  return true;
}

/** POST /api/analytics — record an event */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { events } = body as { events: Array<Record<string, unknown>> };
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "events array required" }, { status: 400 });
    }

    // Check analytics enabled
    const settings = fileDb.findMany("settings");
    const enabled = settings.find((s: Record<string, unknown>) => s.key === "analytics_enabled");
    if (enabled && enabled.value === false) {
      return NextResponse.json({ ok: true, recorded: 0 });
    }

    const recorded: Record<string, unknown>[] = [];
    const existing = fileDb.findMany("analyticsEvents");
    const existingIds = new Set(existing.map((e: Record<string, unknown>) => String(e.eventId || "")));

    for (const evt of events) {
      const eventId = String(evt.eventId || "");
      if (eventId && existingIds.has(eventId)) continue; // dedup
      if (eventId) existingIds.add(eventId);

      if (!isPayloadSafe(evt as Record<string, unknown>)) continue;

      const record: Record<string, unknown> = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        eventId: eventId || `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        event: sanitizeString(String(evt.event || "unknown")),
        page: evt.page ? sanitizeUrl(String(evt.page)) : "",
        product: evt.product ? sanitizeString(String(evt.product)) : "",
        productSlug: evt.productSlug ? sanitizeString(String(evt.productSlug)) : "",
        category: evt.category ? sanitizeString(String(evt.category)) : "",
        sessionId: String(evt.sessionId || ""),
        visitorId: String(evt.visitorId || ""),
        userId: evt.userId ? String(evt.userId) : "",
        device: String(evt.device || "unknown"),
        browser: String(evt.browser || "unknown"),
        source: sanitizeString(String(evt.source || "")),
        medium: sanitizeString(String(evt.medium || "")),
        campaign: sanitizeString(String(evt.campaign || "")),
        utmSource: sanitizeString(String(evt.utmSource || "")),
        utmMedium: sanitizeString(String(evt.utmMedium || "")),
        utmCampaign: sanitizeString(String(evt.utmCampaign || "")),
        ip: getClientIp(req),
        timestamp: new Date().toISOString(),
        value: evt.value !== undefined ? Number(evt.value) : undefined,
      };

      fileDb.insert("analyticsEvents", record);
      recorded.push(record);
    }

    return NextResponse.json({ ok: true, recorded: recorded.length });
  } catch (err) {
    console.error("Analytics POST error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/** GET /api/analytics — query events (admin use) */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const from = sp.get("from");
    const to = sp.get("to");
    const event = sp.get("event");
    const product = sp.get("product");
    const device = sp.get("device");
    const source = sp.get("source");
    const page = sp.get("page");
    const limit = Math.min(Number(sp.get("limit") || 500), 2000);
    const offset = Number(sp.get("offset") || 0);

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
    if (product) events = events.filter((e: Record<string, unknown>) => String(e.product || e.productSlug).toLowerCase().includes(product.toLowerCase()));
    if (device) events = events.filter((e: Record<string, unknown>) => String(e.device) === device);
    if (source) events = events.filter((e: Record<string, unknown>) => String(e.source || e.utmSource).toLowerCase().includes(source.toLowerCase()));
    if (page) events = events.filter((e: Record<string, unknown>) => String(e.page).toLowerCase().includes(page.toLowerCase()));

    // Sort by timestamp desc
    events.sort((a: Record<string, unknown>, b: Record<string, unknown>) => new Date(String(b.timestamp)).getTime() - new Date(String(a.timestamp)).getTime());

    const total = events.length;
    const paginated = events.slice(offset, offset + limit);

    // Aggregate stats
    const uniqueVisitors = new Set(events.map((e: Record<string, unknown>) => String(e.visitorId)).filter(Boolean));
    const uniqueSessions = new Set(events.map((e: Record<string, unknown>) => String(e.sessionId)).filter(Boolean));
    const pageViews = events.filter((e: Record<string, unknown>) => String(e.event) === "page_view").length;
    const productViews = events.filter((e: Record<string, unknown>) => String(e.event) === "product_view").length;
    const addToCarts = events.filter((e: Record<string, unknown>) => String(e.event) === "add_to_cart").length;
    const checkoutStarts = events.filter((e: Record<string, unknown>) => String(e.event) === "checkout_start").length;
    const orders = events.filter((e: Record<string, unknown>) => String(e.event) === "order_placed").length;
    const pdfDownloads = events.filter((e: Record<string, unknown>) => String(e.event) === "pdf_download").length;
    const revenue = events.filter((e: Record<string, unknown>) => String(e.event) === "order_placed").reduce((sum: number, e: Record<string, unknown>) => sum + (Number(e.value) || 0), 0);

    // Top products
    const productCounts: Record<string, number> = {};
    events.filter((e: Record<string, unknown>) => String(e.event) === "product_view").forEach((e: Record<string, unknown>) => {
      const name = String(e.product || e.productSlug || "unknown");
      productCounts[name] = (productCounts[name] || 0) + 1;
    });
    const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count }));

    // Top pages
    const pageCounts: Record<string, number> = {};
    events.filter((e: Record<string, unknown>) => String(e.event) === "page_view").forEach((e: Record<string, unknown>) => {
      const p = String(e.page || "/");
      pageCounts[p] = (pageCounts[p] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([page, count]) => ({ page, count }));

    // Top sources
    const sourceCounts: Record<string, number> = {};
    events.forEach((e: Record<string, unknown>) => {
      const s = String(e.utmSource || e.source || "direct");
      sourceCounts[s] = (sourceCounts[s] || 0) + 1;
    });
    const topSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([source, count]) => ({ source, count }));

    // Device breakdown
    const deviceCounts: Record<string, number> = {};
    events.forEach((e: Record<string, unknown>) => {
      const d = String(e.device || "unknown");
      deviceCounts[d] = (deviceCounts[d] || 0) + 1;
    });

    // Funnel
    const funnel = {
      visitors: uniqueVisitors.size,
      productViews,
      addToCarts,
      checkoutStarts,
      orders,
      revenue,
      pdfDownloads,
    };

    // Daily breakdown
    const dailyCounts: Record<string, number> = {};
    events.filter((e: Record<string, unknown>) => String(e.event) === "page_view").forEach((e: Record<string, unknown>) => {
      const day = String(e.timestamp).slice(0, 10);
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    });
    const dailyTraffic = Object.entries(dailyCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([date, count]) => ({ date, count }));

    return NextResponse.json({
      total,
      events: paginated,
      stats: {
        uniqueVisitors: uniqueVisitors.size,
        uniqueSessions: uniqueSessions.size,
        pageViews,
        productViews,
        addToCarts,
        checkoutStarts,
        orders,
        revenue,
        pdfDownloads,
      },
      funnel,
      topProducts,
      topPages,
      topSources,
      deviceCounts,
      dailyTraffic,
    });
  } catch (err) {
    console.error("Analytics GET error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
