import { json, requireUser } from "@/lib/http";
import { aplusStore } from "@/lib/commerce/store-extensions";
import { fileDb } from "@/lib/commerce/file-db";

export async function GET() {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const templates = await aplusStore.listTemplates();
  const products = fileDb.findMany("products").map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    aplusTemplateId: p.aplusTemplateId || null,
    aplusPublished: p.aplusPublished !== false,
  }));
  return json({ templates, products });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));
  if (!body.title) {
    return json({ error: "Title is required for A+ template" }, 400);
  }

  const template = await aplusStore.createTemplate({
    title: body.title,
    description: body.description || "",
    category: body.category || "General",
    sections: body.sections || [],
    published: body.published !== false,
  });

  return json({ template }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => ({}));

  // Handle Attach or Save Sections action
  if (body.action === "attach" || body.action === "save_sections") {
    if (!body.productId) {
      return json({ error: "productId is required to attach/save A+ content" }, 400);
    }
    const updated = await aplusStore.attachToProduct(
      String(body.productId),
      body.templateId || null,
      body.sections,
      body.published !== false
    );
    return json({ success: true, product: updated });
  }

  // Handle Template update
  if (!body.id) {
    return json({ error: "Template ID is required" }, 400);
  }

  const updated = await aplusStore.updateTemplate(body.id, body);
  return json({ template: updated });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return json({ error: "Template ID is required" }, 400);

  await aplusStore.deleteTemplate(id);
  return json({ success: true });
}
