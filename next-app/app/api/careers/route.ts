import { json } from "@/lib/http";
import { careerJobStore, careerPageStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pageConfig = await careerPageStore.get();
    const jobs = await careerJobStore.all(false); // Only active & published jobs

    return json({
      pageConfig,
      jobs,
    });
  } catch (error) {
    console.error("Public careers API error:", error);
    return json({ error: "Failed to fetch careers information" }, 500);
  }
}
