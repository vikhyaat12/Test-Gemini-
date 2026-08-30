import { json, requireUser } from "@/lib/http";
import { pageSettingsStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const pages = await pageSettingsStore.list();
  return json({ pages });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.title || !body.slug) return json({ error: "Title and slug are required" }, 400);
  const item = await pageSettingsStore.create({
    title: body.title,
    slug: body.slug.replace(/[^a-z0-9\-\/#]/g, "").toLowerCase(),
    label: body.label || body.title,
    headerVisible: body.headerVisible !== false,
    footerVisible: body.footerVisible !== false,
    sortOrder: body.sortOrder ?? 0,
    active: body.active !== false,
    isAnchor: body.isAnchor || false,
  });
  return json({ item }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);
  const { id, ...data } = body;
  if (data.slug) data.slug = String(data.slug).replace(/[^a-z0-9\-\/#]/g, "").toLowerCase();
  const item = await pageSettingsStore.update(id, data);
  return json({ item });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "id required" }, 422);
  await pageSettingsStore.remove(id);
  return json({ ok: true });
}
