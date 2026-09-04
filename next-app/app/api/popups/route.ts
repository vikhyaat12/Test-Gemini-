import { json, requireUser } from "@/lib/http";
import { fileDb } from "@/lib/commerce/file-db";

function normalizePopup(p: Record<string, unknown>): Record<string, any> {
  const buttons = Array.isArray(p.buttons) && p.buttons.length > 0
    ? p.buttons
    : p.buttonText || p.buttonUrl
    ? [
        {
          id: "b-legacy",
          text: String(p.buttonText || "Learn More"),
          actionType: "link",
          url: String(p.buttonUrl || "#"),
          style: "primary",
        },
      ]
    : [];

  return {
    ...p,
    buttons,
    buttonText: p.buttonText || (buttons[0]?.text ?? ""),
    buttonUrl: p.buttonUrl || (buttons[0]?.url ?? ""),
    placement: p.placement || "site-wide",
    position: p.position || "center",
    sizePreset: p.sizePreset || "medium",
    width: Number(p.width) || 520,
    borderRadius: p.borderRadius !== undefined ? Number(p.borderRadius) : 16,
    overlayOpacity: p.overlayOpacity !== undefined ? Number(p.overlayOpacity) : 0.55,
    overlayEnabled: p.overlayEnabled !== false,
    mediaType: p.mediaType || (p.videoUrl ? "video" : p.imageUrl ? "image" : "none"),
    mediaLayout: p.mediaLayout || "above",
    trigger: p.trigger || "delay",
    delay: p.delay !== undefined ? Number(p.delay) : 3,
    frequency: p.frequency || "every_visit",
    deviceTarget: p.deviceTarget || (p.desktopOnly ? "desktop" : "all"),
    animation: p.animation || "fade",
    enabled: p.enabled !== false,
    visible: p.visible !== false,
    impressions: Number(p.impressions) || 0,
    clicks: Number(p.clicks) || 0,
    closes: Number(p.closes) || 0,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const isAdmin = url.searchParams.get("admin") === "true";
  const rawPopups = fileDb.findMany("sitePopups");
  const popups = rawPopups.map((p) => normalizePopup(p as Record<string, unknown>));

  if (isAdmin) {
    // Admin sees all popups sorted by sort asc, then createdAt desc
    popups.sort((a, b) => {
      const sA = Number(a.sort ?? 0);
      const sB = Number(b.sort ?? 0);
      if (sA !== sB) return sA - sB;
      return new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime();
    });
    return json({ popups });
  }

  // Public only sees active, visible, and currently scheduled popups
  const now = new Date();
  const active = popups.filter((p) => {
    if (p.enabled === false || p.visible === false) return false;
    if (p.startDate && new Date(String(p.startDate)) > now) return false;
    if (p.endDate && new Date(String(p.endDate)) < now) return false;
    return true;
  });

  active.sort((a, b) => Number(a.sort ?? 0) - Number(b.sort ?? 0));
  return json({ popups: active });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid body" }, 400);

  const now = new Date().toISOString();

  // Normalize buttons
  let buttons = Array.isArray(body.buttons) ? body.buttons : [];
  if (buttons.length === 0 && (body.buttonText || body.buttonUrl)) {
    buttons = [
      {
        id: "b-" + Date.now(),
        text: String(body.buttonText || "Learn More"),
        actionType: "link",
        url: String(body.buttonUrl || "#"),
        style: "primary",
      },
    ];
  }

  const record: Record<string, unknown> = {
    title: body.title || "New Popup",
    enabled: body.enabled !== false,
    visible: body.visible !== false,

    // Placement & Position
    placement: body.placement || "site-wide",
    targetProductSlug: body.targetProductSlug || "",
    targetCategorySlug: body.targetCategorySlug || "",
    targetBlogSlug: body.targetBlogSlug || "",
    targetCustomPath: body.targetCustomPath || "",
    position: body.position || "center",
    customPositionTop: body.customPositionTop || "",
    customPositionLeft: body.customPositionLeft || "",
    customPositionBottom: body.customPositionBottom || "",
    customPositionRight: body.customPositionRight || "",

    // Size & Dimensions
    sizePreset: body.sizePreset || "medium",
    width: Number(body.width) || 520,
    maxWidth: body.maxWidth || "",
    height: body.height || "",
    maxHeight: body.maxHeight || "",
    mobileWidth: body.mobileWidth || "",
    mobileHeight: body.mobileHeight || "",
    padding: body.padding !== undefined ? Number(body.padding) : 28,
    margin: body.margin !== undefined ? Number(body.margin) : 16,
    borderRadius: body.borderRadius !== undefined ? Number(body.borderRadius) : 16,

    // Media
    mediaType: body.mediaType || (body.videoUrl ? "video" : body.imageUrl ? "image" : "none"),
    imageUrl: body.imageUrl || "",
    videoUrl: body.videoUrl || "",
    videoPosterUrl: body.videoPosterUrl || "",
    videoAutoplay: Boolean(body.videoAutoplay),
    videoMuted: body.videoMuted !== false, // default muted for autoplay safety
    videoLoop: Boolean(body.videoLoop),
    videoControls: body.videoControls !== false,
    videoPlayOnClick: Boolean(body.videoPlayOnClick),
    mediaLayout: body.mediaLayout || "above",
    mediaClickAction: body.mediaClickAction || "none",
    mediaClickUrl: body.mediaClickUrl || "",

    // Content Builder
    eyebrow: body.eyebrow || "",
    heading: body.heading || "",
    subtitle: body.subtitle || "",
    text: body.text || "",
    highlightText: body.highlightText || "",
    bulletList: Array.isArray(body.bulletList) ? body.bulletList : [],
    badgeText: body.badgeText || "",
    divider: Boolean(body.divider),

    // Product Aware
    productAware: Boolean(body.productAware),
    productId: body.productId || "",
    productSlug: body.productSlug || "",
    showProductPrice: body.showProductPrice !== false,
    showProductStock: body.showProductStock !== false,
    showProductImage: body.showProductImage !== false,

    // Buttons
    buttons,
    buttonText: body.buttonText || (buttons[0]?.text ?? ""),
    buttonUrl: body.buttonUrl || (buttons[0]?.url ?? ""),

    // Triggers & Frequency
    trigger: body.trigger || "delay",
    delay: body.delay !== undefined ? Number(body.delay) : 3,
    scrollPercentage: body.scrollPercentage !== undefined ? Number(body.scrollPercentage) : 50,
    scrollElementSelector: body.scrollElementSelector || "",
    clickSelector: body.clickSelector || "",

    frequency: body.frequency || "every_visit",
    frequencyDays: body.frequencyDays !== undefined ? Number(body.frequencyDays) : 7,
    maxImpressions: body.maxImpressions !== undefined ? Number(body.maxImpressions) : 0,
    startDate: body.startDate || "",
    endDate: body.endDate || "",

    // Device Targeting
    deviceTarget: body.deviceTarget || (body.desktopOnly ? "desktop" : "all"),
    desktopOnly: Boolean(body.desktopOnly),

    // Design & Colors
    bgType: body.bgType || "solid",
    bgColor: body.bgColor || "#FFFFFF",
    bgGradient: body.bgGradient || "",
    bgImageUrl: body.bgImageUrl || "",
    textColor: body.textColor || "var(--ink, #1F1A24)",
    headingColor: body.headingColor || "var(--purple, #2A0F3A)",
    accentColor: body.accentColor || "#C5A880",
    borderColor: body.borderColor || "rgba(42, 15, 58, 0.08)",
    borderWidth: body.borderWidth !== undefined ? Number(body.borderWidth) : 1,
    shadowEnabled: body.shadowEnabled !== false,
    shadowBlur: body.shadowBlur !== undefined ? Number(body.shadowBlur) : 48,
    shadowColor: body.shadowColor || "rgba(0,0,0,0.22)",

    // Overlay
    overlayEnabled: body.overlayEnabled !== false,
    overlayColor: body.overlayColor || "rgba(0,0,0,0.6)",
    overlayOpacity: body.overlayOpacity !== undefined ? Number(body.overlayOpacity) : 0.55,
    overlayBlur: body.overlayBlur !== undefined ? Number(body.overlayBlur) : 4,
    closeOnOverlayClick: body.closeOnOverlayClick !== false,

    // Close Button
    showCloseButton: body.showCloseButton !== false,
    closeButtonPosition: body.closeButtonPosition || "inside_right",
    closeButtonColor: body.closeButtonColor || "rgba(0,0,0,0.6)",
    closeButtonBg: body.closeButtonBg || "rgba(0,0,0,0.06)",
    closeOnEscape: body.closeOnEscape !== false,

    // Typography
    headingSize: body.headingSize !== undefined ? Number(body.headingSize) : 24,
    bodySize: body.bodySize !== undefined ? Number(body.bodySize) : 14,
    fontAlignment: body.fontAlignment || "left",

    // Animation
    animation: body.animation || "fade",
    animationDuration: body.animationDuration !== undefined ? Number(body.animationDuration) : 0.35,

    // Analytics
    impressions: 0,
    clicks: 0,
    closes: 0,

    sort: body.sort !== undefined ? Number(body.sort) : 0,
    createdAt: now,
    updatedAt: now,
  };

  const popup = fileDb.insert("sitePopups", record);
  return json({ popup: normalizePopup(popup as Record<string, unknown>) }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body?.id) return json({ error: "id required" }, 400);

  const { id, ...updates } = body;
  updates.updatedAt = new Date().toISOString();

  // If buttonText/buttonUrl updated without buttons, keep in sync
  if (Array.isArray(updates.buttons)) {
    if (updates.buttons[0]) {
      updates.buttonText = updates.buttons[0].text;
      updates.buttonUrl = updates.buttons[0].url;
    }
  }

  const updated = fileDb.update("sitePopups", id, updates);
  if (!updated) return json({ error: "Popup not found" }, 404);

  return json({ ok: true, popup: normalizePopup(updated as Record<string, unknown>) });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body?.id) return json({ error: "id required" }, 400);

  fileDb.remove("sitePopups", body.id);
  return json({ ok: true });
}
