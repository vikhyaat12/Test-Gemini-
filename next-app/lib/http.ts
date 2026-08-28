import { NextResponse } from "next/server";
import { currentSession } from "./auth";
import { store } from "./commerce/store";
import type { Role } from "./commerce/types";

export const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });

export async function requireUser(roles?: Role[]) {
  const session = await currentSession();
  if (!session) return null;
  const userFromStore = await store.users.byId(session.sub);
  const user = userFromStore || { id: session.sub, name: session.name, email: session.email, role: session.role, createdAt: "" };
  if (!user || (roles && !roles.includes(user.role))) return null;
  return user;
}

export const safeText = (value: unknown, max = 500) => (typeof value === "string" ? value.trim().slice(0, max) : "");
