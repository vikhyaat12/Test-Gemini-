import { json } from "@/lib/http";
import { storeLocatorStore, storeLocatorPageStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || searchParams.get("query") || "";
    const type = searchParams.get("type") || "all";
    const latStr = searchParams.get("lat") || searchParams.get("latitude");
    const lngStr = searchParams.get("lng") || searchParams.get("longitude");

    const latitude = latStr ? parseFloat(latStr) : undefined;
    const longitude = lngStr ? parseFloat(lngStr) : undefined;

    const [pageConfig, locations] = await Promise.all([
      storeLocatorPageStore.get(),
      storeLocatorStore.search({
        query,
        type,
        latitude,
        longitude,
      }),
    ]);

    return json({
      success: true,
      query,
      type,
      total: locations.length,
      locations,
      pageConfig,
    });
  } catch (error) {
    console.error("Public store-locator API error:", error);
    return json({ success: false, error: "Failed to query store locations." }, 500);
  }
}
