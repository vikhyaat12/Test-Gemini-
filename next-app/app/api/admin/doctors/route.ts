import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const doctors = await prisma.doctor.findMany({ orderBy: { createdAt: "desc" } });
  return json({ doctors });
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id || !body.status) return json({ error: "id and status required" }, 422);
  const doctor = await prisma.doctor.update({ where: { id: body.id }, data: { status: body.status } });
  return json({ doctor });
}
