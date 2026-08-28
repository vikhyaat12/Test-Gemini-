import { json, safeText } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = safeText(body.email, 120).toLowerCase();
  if (!email) return json({ error: "Email required" }, 422);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return json({ message: "If an account exists, a reset link has been sent." });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour

  // Delete any existing reset tokens for this user
  await prisma.emailToken.deleteMany({ where: { userId: user.id, type: "reset" } });
  await prisma.emailToken.create({ data: { userId: user.id, token, type: "reset", expiresAt } });

  // In production, send email with reset link. For now, return token for dev.
  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password?token=${token}`;

  return json({
    message: "If an account exists, a reset link has been sent.",
    ...(process.env.NODE_ENV !== "production" ? { resetUrl, token } : {}),
  });
}
