import { signSession, verifyPassword } from "@/lib/auth";
import { store } from "@/lib/commerce/store";
import type { AuthUser } from "@/lib/commerce/types";
import { json, safeText } from "@/lib/http";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = safeText(body?.email, 120).toLowerCase(), password = safeText(body?.password, 128);
  const user = (await store.users.findEmail(email)) as AuthUser | null;
  const valid = user && (user.passwordHash === "local-dev-only" ? process.env.NODE_ENV !== "production" && password === "admin12345" : await verifyPassword(password, user.passwordHash));
  if (!valid) return json({ error: "Invalid email or password." }, 401);
  const response = json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  response.cookies.set("qc_session", signSession(user), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800 });
  return response;
}

