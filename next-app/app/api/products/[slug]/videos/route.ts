import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

async function findProduct(slug: string) { return prisma.product.findFirst({ where: { OR: [{ id: slug }, { slug }] } }); }

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  return json({ videos: await prisma.productVideo.findMany({ where: { productId: product.id }, orderBy: { sort: "asc" } }) });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  const body = await request.json().catch(() => ({}));
  if (!body.url) return json({ error: "URL required" }, 422);
  const maxSort = await prisma.productVideo.findFirst({ where: { productId: product.id }, orderBy: { sort: "desc" } });
  const video = await prisma.productVideo.create({
    data: { productId: product.id, url: body.url, title: body.title || null, posterUrl: body.posterUrl || null, description: body.description || null, sort: (maxSort?.sort ?? -1) + 1 },
  });
  return json({ video }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.videoId) return json({ error: "videoId required" }, 422);
  const data: Record<string, unknown> = {};
  for (const k of ["title", "url", "posterUrl", "description", "sort", "active"]) { if (k in body) data[k] = body[k]; }
  return json({ video: await prisma.productVideo.update({ where: { id: body.videoId }, data }) });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const vid = searchParams.get("videoId");
  if (!vid) return json({ error: "videoId required" }, 422);
  await prisma.productVideo.delete({ where: { id: vid } });
  return json({ ok: true });
}
