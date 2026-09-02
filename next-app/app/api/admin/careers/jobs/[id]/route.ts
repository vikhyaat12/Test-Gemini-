import { json, requireUser } from "@/lib/http";
import { careerJobStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const job = await careerJobStore.byId(id);
  if (!job) return json({ error: "Job opening not found" }, 404);

  return json({ job });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "Invalid payload" }, 400);

  // Special action triggers: duplicate, toggleActive, togglePublished
  if (body._action === "duplicate") {
    const duplicated = await careerJobStore.duplicate(id);
    if (!duplicated) return json({ error: "Failed to duplicate job." }, 404);
    return json({ job: duplicated, message: "Job duplicated as draft." }, 201);
  }

  const updated = await careerJobStore.update(id, body);
  if (!updated) return json({ error: "Job opening not found" }, 404);

  return json({ job: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { id } = await params;
  const ok = await careerJobStore.delete(id);
  if (!ok) return json({ error: "Job opening not found or delete failed." }, 404);

  return json({ success: true, message: "Job deleted successfully." });
}
