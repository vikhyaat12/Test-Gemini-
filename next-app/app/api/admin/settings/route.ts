import { json, requireUser } from "@/lib/http";
import { settingStore } from "@/lib/commerce/store-extensions";

export async function GET(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const group = searchParams.get("group");
  const settings = group ? await settingStore.getGroup(group) : await settingStore.getAll();
  return json({ settings });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => null);
  if (!body?.key || body?.value === undefined) return json({ error: "Key and value are required." }, 422);
  const setting = await settingStore.set(body.key, body.value, body.group);
  return json({ setting });
}
