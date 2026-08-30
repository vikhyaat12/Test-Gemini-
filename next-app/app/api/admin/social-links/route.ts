import { NextRequest } from "next/server";
import { fileDb } from "@/lib/commerce/file-db";
import { json, requireUser } from "@/lib/http";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const links = fileDb.findMany("socialMediaLinks").sort(
    (a: Record<string, unknown>, b: Record<string, unknown>) =>
      (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0)
  );
  return json({ links });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const {
    platform,
    category,
    label,
    url,
    icon,
    customIconUrl,
    visible,
    iconSize,
    desktopIconSize,
    mobileIconSize,
    openNewTab,
    sortOrder,
  } = body;

  if (!platform || !url) {
    return json({ error: "Platform and URL are required." }, 400);
  }

  const id = `sml-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const record = fileDb.insert("socialMediaLinks", {
    id,
    platform: platform || "custom",
    category: category || (["amazon", "flipkart", "meesho", "myntra", "ajio", "tata1mg", "pharmeasy", "netmeds", "apollo247", "indiamart", "jiomart", "custom_marketplace"].includes(platform) ? "marketplace" : "social"),
    label: label || platform || "Custom",
    url: String(url).trim(),
    icon: icon || platform || "custom",
    customIconUrl: customIconUrl || null,
    visible: visible !== false,
    iconSize: Number(desktopIconSize || iconSize) || 22,
    desktopIconSize: Number(desktopIconSize || iconSize) || 22,
    mobileIconSize: Number(mobileIconSize) || 18,
    openNewTab: openNewTab !== false,
    sortOrder: Number(sortOrder) || fileDb.findMany("socialMediaLinks").length,
  });

  return json({ link: record }, 201);
}

export async function PUT(request: NextRequest) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  const { id, action, orderedIds, ...patch } = body;

  // Handle Bulk Reorder
  if ((id === "reorder" || action === "reorder") && Array.isArray(orderedIds)) {
    orderedIds.forEach((orderId: string, idx: number) => {
      fileDb.update("socialMediaLinks", orderId, { sortOrder: idx });
    });
    return json({ success: true, count: orderedIds.length });
  }

  // Handle Bulk Hide All / Unhide All
  if (action === "hide_all" || id === "hide_all") {
    const allLinks = fileDb.findMany("socialMediaLinks");
    allLinks.forEach((link: Record<string, unknown>) => {
      fileDb.update("socialMediaLinks", String(link.id), { visible: false });
    });
    return json({ success: true, action: "hide_all", count: allLinks.length });
  }

  if (action === "unhide_all" || id === "unhide_all") {
    const allLinks = fileDb.findMany("socialMediaLinks");
    allLinks.forEach((link: Record<string, unknown>) => {
      fileDb.update("socialMediaLinks", String(link.id), { visible: true });
    });
    return json({ success: true, action: "unhide_all", count: allLinks.length });
  }

  if (!id) {
    return json({ error: "Link ID is required." }, 400);
  }

  // Normalize numbers if present in patch
  if ("iconSize" in patch) patch.iconSize = Number(patch.iconSize);
  if ("desktopIconSize" in patch) patch.desktopIconSize = Number(patch.desktopIconSize);
  if ("mobileIconSize" in patch) patch.mobileIconSize = Number(patch.mobileIconSize);
  if ("sortOrder" in patch) patch.sortOrder = Number(patch.sortOrder);

  const updated = fileDb.update("socialMediaLinks", id, patch);
  if (!updated) {
    return json({ error: "Link not found." }, 404);
  }
  return json({ link: updated });
}

export async function DELETE(request: NextRequest) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return json({ error: "Link ID is required." }, 400);
  }
  const removed = fileDb.remove("socialMediaLinks", id);
  return json({ success: Boolean(removed) });
}
