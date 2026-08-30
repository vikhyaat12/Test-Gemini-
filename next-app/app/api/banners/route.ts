import { json } from "@/lib/http";
import { bannerStore } from "@/lib/commerce/store-extensions";

export async function GET() {
  const all = await bannerStore.list();
  const active = all.filter((b: Record<string, unknown>) => b.active !== false);
  return json({ banners: active });
}
