import { json } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const employee = await prisma.employee.findUnique({ where: { slug } });
  if (!employee || !employee.active) return json({ error: "Employee not found" }, 404);
  // Only return public-safe fields
  return json({
    employee: {
      name: employee.name,
      designation: employee.designation,
      department: employee.department,
      photo: employee.photo,
      bio: employee.bio,
      slug: employee.slug,
    },
  });
}
