import { json } from "@/lib/http";
import { careerJobStore, careerPageStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const job = await careerJobStore.bySlug(slug);

    if (!job || (!job.published && !job.active)) {
      return json({ error: "Opportunity not found or no longer active." }, 404);
    }

    const pageConfig = await careerPageStore.get();

    return json({
      job,
      pageConfig: {
        recruitmentInfo: pageConfig.recruitmentInfo,
        published: pageConfig.published,
      },
    });
  } catch (error) {
    console.error("Single job fetch error:", error);
    return json({ error: "Failed to fetch job details." }, 500);
  }
}
