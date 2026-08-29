import { json, requireUser } from "@/lib/http";
import { bannerStore } from "@/lib/commerce/store-extensions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const id = (await params).id;
  const body = await request.json().catch(() => ({}));
  if (body.image && !body.imageUrl) body.imageUrl = body.image;
  if (body.link && !body.linkUrl) body.linkUrl = body.link;
  const banner = await bannerStore.update(id, body);
  return json({ banner });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const id = (await params).id;
  await bannerStore.delete(id);
  return json({ ok: true });
}
