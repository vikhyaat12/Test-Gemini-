import { json, requireUser } from "@/lib/http";
import { testimonialStore } from "@/lib/commerce/store-extensions";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const id = (await params).id;
  const body = await request.json().catch(() => ({}));
  const testimonial = await testimonialStore.update(id, body);
  return json({ testimonial });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const id = (await params).id;
  await testimonialStore.delete(id);
  return json({ ok: true });
}
