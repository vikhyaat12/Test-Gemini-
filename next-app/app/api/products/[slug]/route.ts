import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  // Try by ID first, then by slug
  const product = await prisma.product.findFirst({
    where: { OR: [{ id: slug }, { slug }] },
    include: {
      images: { orderBy: { sort: "asc" } },
      variants: { orderBy: { sort: "asc" } },
      specifications: { orderBy: { sort: "asc" } },
      model3d: true,
      productFaqs: { orderBy: { sort: "asc" } },
      reviews: { where: { visible: true }, orderBy: { createdAt: "desc" }, include: { user: true } },
      relatedFrom: { include: { relatedProduct: true } },
      aplusSections: { where: { active: true }, orderBy: { sort: "asc" } },
      videos: { where: { active: true }, orderBy: { sort: "asc" } },
    },
  });
  return product ? json({ product }) : json({ error: "Not found" }, 404);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const identifier = (await params).slug;
  const body = await request.json().catch(() => ({}));
  const allowed: Record<string, unknown> = {};
  const fields = [
    "name", "slug", "brand", "description", "shortDescription", "category",
    "subcategory", "price", "mrp", "discount", "stock", "lowStockThreshold",
    "image", "thumbnail", "video", "active", "visible", "featured",
    "homepageVisible", "benefits", "ingredients", "usage", "safetyInfo",
    "tags", "searchKeywords", "seoTitle", "seoDescription", "seoOgImage", "altText",
  ];
  for (const f of fields) { if (f in body) allowed[f] = body[f]; }
  try {
    const product = await prisma.product.update({
      where: { id: identifier },
      data: allowed as never,
    });
    return json({ product });
  } catch {
    // Try by slug
    try {
      const existing = await prisma.product.findFirst({ where: { slug: identifier } });
      if (!existing) return json({ error: "Not found" }, 404);
      const product = await prisma.product.update({ where: { id: existing.id }, data: allowed as never });
      return json({ product });
    } catch (e: unknown) {
      return json({ error: e instanceof Error ? e.message : "Update failed" }, 400);
    }
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const identifier = (await params).slug;
  try {
    await prisma.product.delete({ where: { id: identifier } });
    return json({ ok: true });
  } catch {
    try {
      const existing = await prisma.product.findFirst({ where: { slug: identifier } });
      if (!existing) return json({ error: "Not found" }, 404);
      await prisma.product.delete({ where: { id: existing.id } });
      return json({ ok: true });
    } catch {
      return json({ error: "Delete failed" }, 400);
    }
  }
}
