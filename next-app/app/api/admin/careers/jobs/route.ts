import { json, requireUser } from "@/lib/http";
import { careerJobStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const jobs = await careerJobStore.all(true); // Include drafts & closed
  return json({ jobs });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body?.title) {
    return json({ error: "Job title is required." }, 422);
  }

  const job = await careerJobStore.create(body);
  return json({ job }, 201);
}
