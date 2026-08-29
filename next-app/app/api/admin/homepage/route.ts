import { json, requireUser } from "@/lib/http";
import { homepageStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return json({ sections: await homepageStore.list() });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.title) return json({ error: "Title is required." }, 422);
  return json({ section: await homepageStore.create(body) }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);
  const data: Record<string, unknown> = {};
  for (const k of ["title", "type", "content", "sort", "active", "visible"]) {
    if (k in body) data[k] = body[k];
  }
  const section = await homepageStore.update(body.id, data);
  return json({ section });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "id required" }, 422);
  await homepageStore.delete(id);
  return json({ ok: true });
}
