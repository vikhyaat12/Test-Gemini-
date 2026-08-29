import { json, requireUser } from "@/lib/http";
import { bannerStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return json({ banners: await bannerStore.list() });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.title) return json({ error: "Title required" }, 422);
  // Normalize field names
  if (body.image && !body.imageUrl) body.imageUrl = body.image;
  return json({ banner: await bannerStore.create(body) }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);
  const data: Record<string, unknown> = {};
  // Normalize field names
  if (body.image && !body.imageUrl) body.imageUrl = body.image;
  if (body.link && !body.linkUrl) body.linkUrl = body.link;
  for (const k of ["title", "subtitle", "imageUrl", "image", "linkUrl", "link", "position", "sort", "active", "visible"]) { if (k in body) data[k] = body[k]; }
  const banner = await bannerStore.update(body.id, data);
  return json({ banner });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "id required" }, 422);
  await bannerStore.delete(id);
  return json({ ok: true });
}
