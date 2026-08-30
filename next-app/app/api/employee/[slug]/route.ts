import { json } from "@/lib/http";
import { employeeStore } from "@/lib/commerce/store-extensions";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const employee = (await employeeStore.bySlug(slug)) as Record<string, unknown> | null;
  if (!employee || employee.active === false) return json({ error: "Employee not found" }, 404);

  return json({
    employee: {
      id: employee.id,
      name: employee.name,
      employeeId: employee.employeeId || employee.slug,
      designation: employee.designation || "",
      department: employee.department || "",
      photo: employee.photo || employee.profileImage || "",
      profileImage: employee.profileImage || employee.photo || "",
      bio: employee.bio || "",
      phone: employee.phone || "",
      email: employee.email || "",
      slug: employee.slug,
      active: employee.active !== false,
      gallery: Array.isArray(employee.gallery) ? employee.gallery : [],
      videos: Array.isArray(employee.videos) ? employee.videos : [],
      photoSettings: employee.photoSettings || {
        desktopSize: 180,
        mobileSize: 130,
        borderRadius: 50,
        objectFit: "cover",
        borderWidth: 3,
        borderColor: "#D4AF37",
        shadow: true,
      },
    },
  });
}
