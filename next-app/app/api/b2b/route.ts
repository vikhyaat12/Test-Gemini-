import { json } from "@/lib/http";
import { b2bPageStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pageConfig = await b2bPageStore.get();
    return json({ pageConfig });
  } catch (error) {
    console.error("Public B2B page config error:", error);
    return json({ error: "Failed to load B2B configuration" }, 500);
  }
}
