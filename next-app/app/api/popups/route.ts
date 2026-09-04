import { json, requireUser } from "@/lib/http";
import { fileDb } from "@/lib/commerce/file-db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isAdmin = url.searchParams.get("admin") === "true";
  const popups = fileDb.findMany("sitePopups");
  if (isAdmin) {
    // Admin sees all popups
    return json({ popups });
  }
  // Public only sees active, visible popups
  const active = popups.filter(
    (p: Record<string, unknown>) => p.enabled !== false && p.visible !== false
  );
  return json({ popups: active });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid body" }, 400);

  const popup = fileDb.insert("sitePopups", {
    title: body.title || "Popup",
    heading: body.heading || "",
    text: body.text || "",
    imageUrl: body.imageUrl || "",
    buttonText: body.buttonText || "",
    buttonUrl: body.buttonUrl || "",
    placement: body.placement || "site-wide",
    trigger: body.trigger || "delay",
    delay: body.delay || 3,
    enabled: body.enabled !== false,
    visible: body.visible !== false,
    width: body.width || 480,
    borderRadius: body.borderRadius || 12,
    overlayOpacity: body.overlayOpacity || 0.5,
    animation: body.animation || "fade",
    desktopOnly: body.desktopOnly || false,
    createdAt: new Date().toISOString(),
  });

  return json({ popup }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body?.id) return json({ error: "id required" }, 400);

  const { id, ...updates } = body;
  fileDb.update("sitePopups", id, updates);
  return json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body?.id) return json({ error: "id required" }, 400);

  fileDb.remove("sitePopups", body.id);
  return json({ ok: true });
}
