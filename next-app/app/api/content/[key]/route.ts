import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET(_: Request, { params }: { params: Promise<{ key: string }> }) {
  const item = await store.content.get((await params).key);
  return item ? json({ content: item }) : json({ error: "Not found" }, 404);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  if (!(await requireUser(["admin"]))) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body || !("value" in body)) return json({ error: "A content value is required." }, 422);
  return json({ content: await store.content.save((await params).key, body.value) });
}
