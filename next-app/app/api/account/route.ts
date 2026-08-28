import { json, requireUser, safeText } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, createdAt: true } });
  return json({ user: fullUser });
}

export async function PATCH(request: Request) {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (body.name) data.name = safeText(body.name, 80);
  if (body.phone !== undefined) data.phone = safeText(body.phone, 20);
  if (Object.keys(data).length) {
    await prisma.user.update({ where: { id: user.id }, data });
  }
  return json({ ok: true });
}
