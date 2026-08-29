import { json } from "@/lib/http";
import { employeeStore } from "@/lib/commerce/store-extensions";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const employee = await employeeStore.bySlug(slug);
  if (!employee || !employee.active) return json({ error: "Employee not found" }, 404);
  // Only return public-safe fields
  return json({
    employee: {
      name: employee.name,
      employeeId: employee.employeeId,
      designation: employee.designation,
      department: employee.department,
      photo: employee.photo,
      bio: employee.bio,
      slug: employee.slug,
    },
  });
}

