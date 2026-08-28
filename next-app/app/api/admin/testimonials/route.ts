import { json, requireUser } from "@/lib/http";
import { testimonialStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  return json({ testimonials: await testimonialStore.list() });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.name || !body.body) return json({ error: "Name and body required" }, 422);
  return json({ testimonial: await testimonialStore.create(body) }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.id) return json({ error: "id required" }, 422);
  const data: Record<string, unknown> = {};
  for (const k of ["name", "title", "body", "rating", "image", "visible", "sort"]) { if (k in body) data[k] = body[k]; }
  const testimonial = await testimonialStore.update(body.id, data);
  return json({ testimonial });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "id required" }, 422);
  await testimonialStore.delete(id);
  return json({ ok: true });
}
