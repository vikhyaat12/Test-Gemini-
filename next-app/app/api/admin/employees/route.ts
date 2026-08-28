import { json, requireUser, safeText } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const employees = await prisma.employee.findMany({ orderBy: { createdAt: "desc" } });
  return json({ employees });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const name = safeText(body.name, 80);
  if (!name) return json({ error: "Name required" }, 422);
  const slug = safeText(body.slug, 80).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  try {
    const employee = await prisma.employee.create({
      data: {
        name, slug, employeeId: body.employeeId || null, designation: body.designation || null,
        department: body.department || null, photo: body.photo || null, phone: body.phone || null,
        email: body.email || null, bio: body.bio || null,
      },
    });
    return json({ employee }, 201);
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Failed" }, 409);
  }
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);
  const data: Record<string, unknown> = {};
  for (const k of ["name", "slug", "employeeId", "designation", "department", "photo", "phone", "email", "bio", "active"]) {
    if (k in body) data[k] = body[k];
  }
  const employee = await prisma.employee.update({ where: { id: body.id }, data });
  return json({ employee });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "id required" }, 422);
  await prisma.employee.delete({ where: { id } });
  return json({ ok: true });
}
