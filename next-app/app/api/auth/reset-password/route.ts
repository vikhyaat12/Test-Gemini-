import { json, safeText } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = safeText(body.token, 128);
  const password = safeText(body.password, 128);
  if (!token || !password) return json({ error: "Token and password required" }, 422);
  if (password.length < 10) return json({ error: "Password must be at least 10 characters" }, 422);

  const emailToken = await prisma.emailToken.findUnique({ where: { token } });
  if (!emailToken || emailToken.type !== "reset" || emailToken.used || emailToken.expiresAt < new Date()) {
    return json({ error: "Invalid or expired reset token" }, 400);
  }

  await prisma.user.update({ where: { id: emailToken.userId }, data: { passwordHash: await hashPassword(password) } });
  await prisma.emailToken.update({ where: { id: emailToken.id }, data: { used: true } });

  return json({ message: "Password has been reset successfully." });
}
