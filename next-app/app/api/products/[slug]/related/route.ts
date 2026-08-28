import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

async function findProduct(slug: string) { return prisma.product.findFirst({ where: { OR: [{ id: slug }, { slug }] } }); }

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  const relations = await prisma.productRelation.findMany({ where: { fromProductId: product.id }, include: { relatedProduct: true } });
  return json({ related: relations.map(r => r.relatedProduct) });
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  const body = await request.json().catch(() => ({}));
  const relatedIds: string[] = Array.isArray(body.relatedIds) ? body.relatedIds : [];
  await prisma.productRelation.deleteMany({ where: { fromProductId: product.id } });
  if (relatedIds.length) {
    await prisma.productRelation.createMany({ data: relatedIds.map(rid => ({ fromProductId: product.id, relatedProductId: rid })) });
  }
  return json({ ok: true });
}
