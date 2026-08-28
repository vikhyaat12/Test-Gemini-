import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

async function findProduct(slug: string) { return prisma.product.findFirst({ where: { OR: [{ id: slug }, { slug }] } }); }

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  return json({ specs: await prisma.productSpecification.findMany({ where: { productId: product.id }, orderBy: { sort: "asc" } }) });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  const body = await request.json().catch(() => ({}));
  if (!body.name || !body.value) return json({ error: "Name and value required" }, 422);
  const maxSort = await prisma.productSpecification.findFirst({ where: { productId: product.id }, orderBy: { sort: "desc" } });
  const spec = await prisma.productSpecification.create({ data: { productId: product.id, name: body.name, value: body.value, sort: (maxSort?.sort ?? -1) + 1 } });
  return json({ spec }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.specId) return json({ error: "specId required" }, 422);
  const data: Record<string, unknown> = {};
  if (body.name) data.name = body.name;
  if (body.value) data.value = body.value;
  if (body.sort !== undefined) data.sort = body.sort;
  return json({ spec: await prisma.productSpecification.update({ where: { id: body.specId }, data }) });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const sid = searchParams.get("specId");
  if (!sid) return json({ error: "specId required" }, 422);
  await prisma.productSpecification.delete({ where: { id: sid } });
  return json({ ok: true });
}
