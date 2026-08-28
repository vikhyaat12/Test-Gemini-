import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

async function findProduct(slug: string) { return prisma.product.findFirst({ where: { OR: [{ id: slug }, { slug }] } }); }

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  return json({ model: await prisma.product3DModel.findUnique({ where: { productId: product.id } }) });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  const body = await request.json().catch(() => ({}));
  if (!body.modelUrl) return json({ error: "modelUrl required" }, 422);
  const model = await prisma.product3DModel.upsert({
    where: { productId: product.id },
    update: { modelUrl: body.modelUrl, format: body.format || "glb", posterUrl: body.posterUrl || null, enabled: body.enabled !== false, visible: body.visible !== false, autoRotate: body.autoRotate !== false, rotationSpeed: body.rotationSpeed || 1.0, mobileFallback: body.mobileFallback || null },
    create: { productId: product.id, modelUrl: body.modelUrl, format: body.format || "glb", posterUrl: body.posterUrl || null, enabled: body.enabled !== false, visible: body.visible !== false, autoRotate: body.autoRotate !== false, rotationSpeed: body.rotationSpeed || 1.0, mobileFallback: body.mobileFallback || null },
  });
  return json({ model }, 201);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  const body = await request.json().catch(() => ({}));
  const existing = await prisma.product3DModel.findUnique({ where: { productId: product.id } });
  if (!existing) return json({ error: "No 3D model for this product" }, 404);
  const data: Record<string, unknown> = {};
  for (const k of ["modelUrl", "format", "posterUrl", "enabled", "visible", "autoRotate", "rotationSpeed", "cameraDistance", "mobileFallback"]) { if (k in body) data[k] = body[k]; }
  return json({ model: await prisma.product3DModel.update({ where: { productId: product.id }, data }) });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  await prisma.product3DModel.delete({ where: { productId: product.id } }).catch(() => {});
  return json({ ok: true });
}
