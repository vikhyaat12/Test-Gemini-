import { json, safeText } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const name = safeText(body.name, 80);
  const email = safeText(body.email, 120).toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: "Name and valid email required." }, 422);
  }
  const existing = await prisma.doctor.findFirst({ where: { email } });
  if (existing) return json({ error: "An application with this email already exists." }, 409);

  const doctor = await prisma.doctor.create({
    data: {
      name, email,
      phone: safeText(body.phone, 20),
      clinic: safeText(body.clinic, 120),
      specialty: safeText(body.specialty, 60),
      qualification: safeText(body.qualification, 200),
      regNumber: safeText(body.regNumber, 60),
      message: safeText(body.message, 1000),
    },
  });
  return json({ doctor, message: "Your application has been submitted. Our medical affairs team will review it within 5 business days." }, 201);
}
