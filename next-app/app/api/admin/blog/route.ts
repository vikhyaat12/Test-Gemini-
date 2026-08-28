import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);
  const data: Record<string, unknown> = {};
  for (const k of ["title", "slug", "excerpt", "body", "content", "category", "readTime", "image", "published", "visible", "seoTitle", "seoDescription"]) {
    if (k in body) data[k] = body[k];
  }
  const post = await prisma.blogPost.update({ where: { id: body.id }, data });
  return json({ post });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "id required" }, 422);
  await prisma.blogPost.delete({ where: { id } });
  return json({ ok: true });
}
