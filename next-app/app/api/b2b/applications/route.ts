import { json, requireUser } from "@/lib/http";
import { b2bStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const applications = await b2bStore.applications.list();
  const userApps = user.role === "admin" ? applications : applications.filter(a => a.email === user.email);
  return json({ applications: userApps });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.company || !body?.name || !body?.email) {
    return json({ error: "Company, name, and email are required." }, 422);
  }
  const app = await b2bStore.applications.create({
    company: body.company,
    name: body.name,
    email: body.email,
    phone: body.phone || null,
    type: body.type || "distributor",
    message: body.message || null,
  });
  return json({ application: app }, 201);
}
