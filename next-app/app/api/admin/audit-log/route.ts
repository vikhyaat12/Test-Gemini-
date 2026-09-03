import { json, requireUser } from "@/lib/http";
import { fileDb } from "@/lib/commerce/file-db";

export async function GET(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "100", 10);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);
  const action = url.searchParams.get("action") || undefined;

  let logs = fileDb.findMany("auditLogs");
  if (action) logs = logs.filter((l: Record<string, unknown>) => l.action === action);

  logs.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
    new Date(String(b.createdAt || 0)).getTime() - new Date(String(a.createdAt || 0)).getTime()
  );

  const total = logs.length;
  const paged = logs.slice(offset, offset + limit);

  return json({ logs: paged, total, offset, limit });
}
