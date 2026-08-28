import { json, requireUser, safeText } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const categories = await prisma.category.findMany({ orderBy: { sort: "asc" } });
  return json({ categories });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const name = safeText(body.name, 80);
  if (!name) return json({ error: "Name required" }, 422);
  const slug = safeText(body.slug, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  try {
    const category = await prisma.category.create({
      data: { name, slug, description: body.description || null, image: body.image || null, sort: body.sort || 0, active: body.active !== false, visible: body.visible !== false },
    });
    return json({ category }, 201);
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Failed" }, 409);
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);
  const data: Record<string, unknown> = {};
  for (const k of ["name", "slug", "description", "image", "sort", "active", "visible"]) {
    if (k in body) data[k] = body[k];
  }
  const category = await prisma.category.update({ where: { id: body.id }, data });
  return json({ category });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "id required" }, 422);
  await prisma.category.delete({ where: { id } });
  return json({ ok: true });
}
