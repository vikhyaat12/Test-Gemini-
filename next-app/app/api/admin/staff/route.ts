import { json, requireUser } from "@/lib/http";
import { fileDb } from "@/lib/commerce/file-db";
import { randomBytes } from "crypto";
import { createHash } from "crypto";

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

const DEFAULT_PERMISSIONS = [
  "orders", "products", "customers", "homepage", "pages", "blog",
  "reviews", "marketing", "notifications", "analytics", "employees",
  "b2b", "careers", "settings", "payments", "shipping", "media",
  "social_links", "coupons", "staff",
];

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const users = fileDb.findMany("users");
  const admins = users.filter((u) => u.role === "admin" || u.role === "staff");
  const safe = admins.map((u) => {
    const { password, ...rest } = u as Record<string, unknown> & { password?: string };
    return rest;
  });
  return json({ staff: safe });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.password) {
    return json({ error: "name, email, and password required." }, 422);
  }
  const existing = fileDb.findOne("users", (u: Record<string, unknown>) => u.email === body.email);
  if (existing) return json({ error: "Email already exists." }, 409);

  const staffUser = fileDb.insert("users", {
    name: body.name,
    email: body.email,
    password: hashPassword(body.password),
    role: body.role === "staff" ? "staff" : "admin",
    permissions: body.permissions || DEFAULT_PERMISSIONS,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Log the action
  fileDb.insert("auditLogs", {
    action: "staff_created",
    actorId: String(user.id || user.email),
    targetType: "user",
    targetId: staffUser.id,
    details: `Created staff user: ${body.email} (${body.role || "admin"})`,
    createdAt: new Date().toISOString(),
  });

  const { password: _, ...safe } = staffUser as Record<string, unknown> & { password?: string };
  return json({ staff: safe });
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.id) return json({ error: "id required." }, 422);

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (body.name) updateData.name = body.name;
  if (body.email) updateData.email = body.email;
  if (body.role) updateData.role = body.role;
  if (body.permissions) updateData.permissions = body.permissions;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.password) updateData.password = hashPassword(body.password);

  fileDb.update("users", body.id, updateData);

  fileDb.insert("auditLogs", {
    action: "staff_updated",
    actorId: String(user.id || user.email),
    targetType: "user",
    targetId: body.id,
    details: `Updated staff: ${Object.keys(updateData).filter((k) => k !== "updatedAt" && k !== "password").join(", ")}`,
    createdAt: new Date().toISOString(),
  });

  return json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.id) return json({ error: "id required." }, 422);
  if (String(body.id) === String(user.id)) return json({ error: "Cannot delete your own account." }, 400);

  fileDb.remove("users", body.id);

  fileDb.insert("auditLogs", {
    action: "staff_deleted",
    actorId: String(user.id || user.email),
    targetType: "user",
    targetId: body.id,
    details: "Staff user deleted",
    createdAt: new Date().toISOString(),
  });

  return json({ ok: true });
}
