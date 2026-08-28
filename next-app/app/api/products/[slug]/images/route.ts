import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

async function findProduct(slug: string) {
  return prisma.product.findFirst({ where: { OR: [{ id: slug }, { slug }] } });
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  const images = await prisma.productImage.findMany({ where: { productId: product.id }, orderBy: { sort: "asc" } });
  return json({ images });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  const body = await request.json().catch(() => ({}));
  if (!body.url) return json({ error: "URL is required" }, 422);
  const maxSort = await prisma.productImage.findFirst({ where: { productId: product.id }, orderBy: { sort: "desc" } });
  const image = await prisma.productImage.create({
    data: { productId: product.id, url: body.url, alt: body.alt || null, sort: (maxSort?.sort ?? -1) + 1 },
  });
  return json({ image }, 201);
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");
  if (!imageId) return json({ error: "imageId required" }, 422);
  await prisma.productImage.delete({ where: { id: imageId } });
  return json({ ok: true });
}
