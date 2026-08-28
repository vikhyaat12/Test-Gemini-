import { hashPassword, signSession } from "@/lib/auth";
import { store } from "@/lib/commerce/store";
import { json, safeText } from "@/lib/http";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = safeText(body?.name, 80), email = safeText(body?.email, 120).toLowerCase(), password = safeText(body?.password, 128);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) return json({ error: "Name, valid email, and a 10-character password are required." }, 422);
  if (await store.users.findEmail(email)) return json({ error: "An account already exists for this email." }, 409);
  // In dev mode without database, first user gets admin role for CMS access
  const hasDb = Boolean(process.env.DATABASE_URL);
  const anyUsersExist = await store.users.hasAny();
  const isFirstDevUser = !hasDb && !anyUsersExist;
  const user = await store.users.create({ name, email, role: isFirstDevUser ? "admin" : "customer", passwordHash: await hashPassword(password) });
  const response = json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } }, 201);
  response.cookies.set("qc_session", signSession(user), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800 });
  return response;
}

