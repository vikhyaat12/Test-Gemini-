import { json, requireUser } from "@/lib/http";
import { customerStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const [customers, total] = await Promise.all([customerStore.list(), customerStore.count()]);
  return json({ customers, total });
}
