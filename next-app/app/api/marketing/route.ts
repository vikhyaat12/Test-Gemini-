import { json } from "@/lib/http";
import { marketingStore, promoBannerStore } from "@/lib/commerce/store-extensions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const placement = searchParams.get("placement");

  const deals = await marketingStore.active(type || undefined);
  const banners = await promoBannerStore.active();
  const filteredBanners = placement ? banners.filter((b: Record<string, unknown>) => b.placement === placement || b.placement === "all") : banners;

  return json({ deals, banners: filteredBanners });
}
