import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

async function findProduct(slug: string) { return prisma.product.findFirst({ where: { OR: [{ id: slug }, { slug }] } }); }

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  return json({ variants: await prisma.productVariant.findMany({ where: { productId: product.id }, orderBy: { sort: "asc" } }) });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  const body = await request.json().catch(() => ({}));
  if (!body.name || body.price === undefined) return json({ error: "Name and price required" }, 422);
  const maxSort = await prisma.productVariant.findFirst({ where: { productId: product.id }, orderBy: { sort: "desc" } });
  const variant = await prisma.productVariant.create({
    data: { productId: product.id, name: body.name, sku: body.sku || null, price: Number(body.price), mrp: body.mrp ? Number(body.mrp) : null, stock: Number(body.stock || 0), image: body.image || null, sort: (maxSort?.sort ?? -1) + 1 },
  });
  return json({ variant }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.variantId) return json({ error: "variantId required" }, 422);
  const data: Record<string, unknown> = {};
  for (const k of ["name", "sku", "price", "mrp", "stock", "image", "active", "sort"]) { if (k in body) data[k] = body[k]; }
  return json({ variant: await prisma.productVariant.update({ where: { id: body.variantId }, data }) });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const vid = searchParams.get("variantId");
  if (!vid) return json({ error: "variantId required" }, 422);
  await prisma.productVariant.delete({ where: { id: vid } });
  return json({ ok: true });
}
