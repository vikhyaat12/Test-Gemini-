import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { fileDb } from "@/lib/commerce/file-db";
import { store } from "@/lib/commerce/store";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const product = await store.products.bySlug(slug);
  if (!product) return json({ error: "Not found" }, 404);

  try {
    const relations = await prisma.productRelation.findMany({
      where: { fromProductId: product.id },
      include: { relatedProduct: true },
    });
    if (relations.length > 0) {
      return json({ related: relations.map((r) => r.relatedProduct) });
    }
  } catch {}

  const rawRelated = (product as Record<string, unknown>).relatedProducts;
  const relatedSlugs = Array.isArray(rawRelated) ? rawRelated : [];
  const related = fileDb.findMany("products", (p) => relatedSlugs.includes(p.slug) || relatedSlugs.includes(p.id));
  return json({ related });
}

export async function PUT(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const slug = (await params).slug;
  const product = await store.products.bySlug(slug);
  if (!product) return json({ error: "Not found" }, 404);
  const body = await request.json().catch(() => ({}));
  const relatedIds: string[] = Array.isArray(body.relatedIds) ? body.relatedIds : [];

  try {
    await prisma.productRelation.deleteMany({ where: { fromProductId: product.id } });
    if (relatedIds.length) {
      await prisma.productRelation.createMany({
        data: relatedIds.map((rid) => ({ fromProductId: product.id, relatedProductId: rid })),
      });
    }
  } catch {}

  // Update fileDb
  fileDb.update("products", product.id, { relatedProducts: relatedIds });
  return json({ ok: true, relatedProducts: relatedIds });
}
