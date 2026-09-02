import { json, requireUser } from "@/lib/http";
import { careerJobStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null);
  if (!body?.orderedIds || !Array.isArray(body.orderedIds)) {
    return json({ error: "orderedIds array is required." }, 400);
  }

  await careerJobStore.reorder(body.orderedIds);
  const updatedJobs = await careerJobStore.all(true);
  return json({ success: true, jobs: updatedJobs });
}
