import { json, requireUser } from "@/lib/http";
import { marketingStore, notificationStore, promoBannerStore } from "@/lib/commerce/store-extensions";

export async function GET(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const kind = searchParams.get("kind") || "marketing";

  if (kind === "notifications") {
    return json({ items: await notificationStore.list() });
  }
  if (kind === "promoBanners") {
    return json({ items: await promoBannerStore.list() });
  }
  return json({ items: await marketingStore.list(type || undefined) });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const kind = body._kind || "marketing";

  if (kind === "notifications") {
    const item = await notificationStore.create(body);
    return json({ item }, 201);
  }
  if (kind === "promoBanners") {
    const item = await promoBannerStore.create(body);
    return json({ item }, 201);
  }
  const item = await marketingStore.create(body);
  return json({ item }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);
  const kind = body._kind || "marketing";

  if (kind === "notifications") {
    const { id, _kind, ...data } = body;
    return json({ item: await notificationStore.update(id, data) });
  }
  if (kind === "promoBanners") {
    const { id, _kind, ...data } = body;
    return json({ item: await promoBannerStore.update(id, data) });
  }
  const { id, _kind, ...data } = body;
  return json({ item: await marketingStore.update(id, data) });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const kind = searchParams.get("kind") || "marketing";
  if (!id) return json({ error: "id required" }, 422);

  if (kind === "notifications") {
    await notificationStore.delete(id);
  } else if (kind === "promoBanners") {
    await promoBannerStore.delete(id);
  } else {
    await marketingStore.delete(id);
  }
  return json({ ok: true });
}
