import { json, requireUser } from "@/lib/http";
import { otpSettingsStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const settings = await otpSettingsStore.get();
  return json({ settings });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid payload" }, 400);

  const updated = await otpSettingsStore.save(body);
  return json({ settings: updated });
}
