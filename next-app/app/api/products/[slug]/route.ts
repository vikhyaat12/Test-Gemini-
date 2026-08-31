import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const product = await store.products.bySlug(slug);
  return product ? json({ product }) : json({ error: "Not found" }, 404);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const identifier = (await params).slug;
  const body = await request.json().catch(() => ({}));

  const existing = await store.products.bySlug(identifier);
  if (!existing && !body.id && !body.slug) {
    return json({ error: "Product not found" }, 404);
  }

  try {
    const updated = await store.products.save({
      id: existing ? existing.id : identifier,
      slug: existing ? existing.slug : (body.slug || identifier),
      ...body,
    });
    return json({ product: updated });
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Update failed" }, 400);
  }
}

export async function PUT(request: Request, context: { params: Promise<{ slug: string }> }) {
  return PATCH(request, context);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const identifier = (await params).slug;
  const success = await store.products.delete(identifier);
  if (success) {
    return json({ ok: true });
  }
  return json({ error: "Delete failed or product not found" }, 400);
}
