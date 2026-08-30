import { json, requireUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { aplusStore } from "@/lib/commerce/store-extensions";
import { fileDb } from "@/lib/commerce/file-db";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await aplusStore.getByProduct(slug);
  return json({ sections: res.sections, published: res.published, templateId: res.templateId });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin", "employee"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  
  if (body.templateId !== undefined || body.sections !== undefined) {
    const updated = await aplusStore.attachToProduct(slug, body.templateId || null, body.sections, body.published !== false);
    return json({ success: true, product: updated });
  }

  const res = await aplusStore.getByProduct(slug);
  const currentSections = res.sections || [];
  const newSection = {
    id: `sec-${Date.now().toString(36)}`,
    type: body.type || "richText",
    heading: body.heading || body.title || "",
    text: body.text || body.body || "",
    imageUrl: body.imageUrl || "",
    videoUrl: body.videoUrl || "",
    imageAlt: body.imageAlt || "",
    items: body.items || [],
    published: true,
  };
  const updatedSections = [...currentSections, newSection];
  await aplusStore.attachToProduct(slug, res.templateId, updatedSections, true);
  return json({ section: newSection, sections: updatedSections }, 201);
}

export async function PATCH(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const body = await request.json().catch(() => ({}));
  if (!body.sectionId) return json({ error: "sectionId required" }, 422);
  const data: Record<string, unknown> = {};
  for (const k of ["type", "title", "heading", "body", "imageUrl", "imageAlt", "content", "sort", "active"]) { if (k in body) data[k] = body[k]; }
  return json({ section: await prisma.productAPlusSection.update({ where: { id: body.sectionId }, data }) });
}

export async function DELETE(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { searchParams } = new URL(request.url);
  const sid = searchParams.get("sectionId");
  if (!sid) return json({ error: "sectionId required" }, 422);
  await prisma.productAPlusSection.delete({ where: { id: sid } });
  return json({ ok: true });
}
