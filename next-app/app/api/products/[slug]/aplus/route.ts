import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

async function findProduct(slug: string) { return prisma.product.findFirst({ where: { OR: [{ id: slug }, { slug }] } }); }

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  return json({ sections: await prisma.productAPlusSection.findMany({ where: { productId: product.id }, orderBy: { sort: "asc" } }) });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  const body = await request.json().catch(() => ({}));
  if (!body.type) return json({ error: "Type required" }, 422);
  const maxSort = await prisma.productAPlusSection.findFirst({ where: { productId: product.id }, orderBy: { sort: "desc" } });
  const section = await prisma.productAPlusSection.create({
    data: { productId: product.id, type: body.type, title: body.title || null, heading: body.heading || null, body: body.body || null, imageUrl: body.imageUrl || null, imageAlt: body.imageAlt || null, content: body.content || undefined, sort: (maxSort?.sort ?? -1) + 1 },
  });
  return json({ section }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.sectionId) return json({ error: "sectionId required" }, 422);
  const data: Record<string, unknown> = {};
  for (const k of ["type", "title", "heading", "body", "imageUrl", "imageAlt", "content", "sort", "active"]) { if (k in body) data[k] = body[k]; }
  return json({ section: await prisma.productAPlusSection.update({ where: { id: body.sectionId }, data }) });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const sid = searchParams.get("sectionId");
  if (!sid) return json({ error: "sectionId required" }, 422);
  await prisma.productAPlusSection.delete({ where: { id: sid } });
  return json({ ok: true });
}
