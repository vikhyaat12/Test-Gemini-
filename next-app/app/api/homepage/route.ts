import { json } from "@/lib/http";
import { homepageStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  const sections = await homepageStore.active();
  return json({ sections });
}
