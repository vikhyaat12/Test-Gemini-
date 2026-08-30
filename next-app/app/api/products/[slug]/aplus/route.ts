import { prisma } from "@/lib/prisma";
import { json, requireUser } from "@/lib/api";
import { aplusStore } from "@/lib/commerce/store-extensions";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const aplus = await aplusStore.getByProduct(slug);
  return json(aplus);
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));

  if (body.action === "attach") {
    const updated = await aplusStore.attachToProduct(
      slug,
      body.templateId ? String(body.templateId) : null,
      body.sections || [],
      body.published !== false
    );
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
  const templateId = res.templateId ? String(res.templateId) : null;
  await aplusStore.attachToProduct(slug, templateId, updatedSections, true);
  return json({ section: newSection, sections: updatedSections }, 201);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { slug } = await params;
  const body = await request.json().catch(() => ({}));
  if (!body.sectionId) return json({ error: "sectionId required" }, 422);

  const res = await aplusStore.getByProduct(slug);
  const updatedSections = (res.sections || []).map((s) => {
    if (s.id === body.sectionId) {
      return { ...s, ...body };
    }
    return s;
  });
  const templateId = res.templateId ? String(res.templateId) : null;
  await aplusStore.attachToProduct(slug, templateId, updatedSections, true);
  return json({ ok: true, sections: updatedSections });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const sid = searchParams.get("sectionId");
  if (!sid) return json({ error: "sectionId required" }, 422);

  const res = await aplusStore.getByProduct(slug);
  const updatedSections = (res.sections || []).filter((s) => s.id !== sid);
  const templateId = res.templateId ? String(res.templateId) : null;
  await aplusStore.attachToProduct(slug, templateId, updatedSections, true);
  return json({ ok: true, sections: updatedSections });
}
