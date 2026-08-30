import { json } from "@/lib/http";
import { testimonialStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const all = await testimonialStore.list();
  const visible = all.filter((t: Record<string, unknown>) => t.visible !== false);
  return json({ testimonials: visible });
}
