import { json, requireUser } from "@/lib/http";
import { mediaStore } from "@/lib/commerce/store-extensions";

export async function GET(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || undefined;
  return json({ media: await mediaStore.list(type) });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.url || !body?.type) return json({ error: "URL and type are required." }, 422);
  return json({ media: await mediaStore.create(body) }, 201);
}
