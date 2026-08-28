import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  for (const k of ["label", "fullName", "phone", "address", "city", "state", "pincode", "isDefault"]) {
    if (k in body) data[k] = body[k];
  }
  if (body.isDefault) {
    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }
  const addr = await prisma.address.update({ where: { id }, data });
  return json({ address: addr });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { id } = await params;
  await prisma.address.delete({ where: { id } });
  return json({ ok: true });
}
