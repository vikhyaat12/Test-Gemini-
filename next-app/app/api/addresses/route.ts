import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const addresses = await prisma.address.findMany({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });
  return json({ addresses });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  const { fullName, phone, address, city, state, pincode } = body;
  if (!fullName || !phone || !address || !city || !state || !pincode) {
    return json({ error: "All fields required" }, 422);
  }
  // If setting as default, unset other defaults
  if (body.isDefault) {
    await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
  }
  const addr = await prisma.address.create({
    data: { userId: user.id, label: body.label || "Home", fullName, phone, address, city, state, pincode, isDefault: !!body.isDefault },
  });
  return json({ address: addr }, 201);
}
