import { json, requireUser, safeText } from "@/lib/http";
import { prisma } from "@/lib/prisma";

async function findProduct(slug: string) { return prisma.product.findFirst({ where: { OR: [{ id: slug }, { slug }] } }); }

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  const { searchParams } = new URL(_req.url);
  const all = searchParams.get("all") === "1";
  const user = await requireUser(["admin"]);
  const where = all && user ? { productId: product.id } : { productId: product.id, visible: true };
  return json({ questions: await prisma.productQA.findMany({ where, orderBy: { createdAt: "desc" } }) });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const body = await request.json().catch(() => ({}));
  const question = safeText(body?.question, 1000);
  if (!question) return json({ error: "Question required" }, 422);
  const product = await findProduct((await params).slug);
  if (!product) return json({ error: "Not found" }, 404);
  const user = await requireUser();
  const qa = await prisma.productQA.create({ data: { productId: product.id, userId: user?.id || null, question } });
  return json({ question: qa }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.qaId) return json({ error: "qaId required" }, 422);
  const data: Record<string, unknown> = {};
  if (body.answer !== undefined) { data.answer = body.answer; data.answeredBy = user.id; }
  if (body.visible !== undefined) data.visible = body.visible;
  return json({ question: await prisma.productQA.update({ where: { id: body.qaId }, data }) });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const qaId = searchParams.get("qaId");
  if (!qaId) return json({ error: "qaId required" }, 422);
  await prisma.productQA.delete({ where: { id: qaId } });
  return json({ ok: true });
}
