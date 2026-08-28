import { json, requireUser } from "@/lib/http";
import { offerStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return json({ offers: await offerStore.list() });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.title) return json({ error: "Title is required." }, 422);
  return json({ offer: await offerStore.create(body) }, 201);
}
