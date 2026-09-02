import { store } from "@/lib/commerce/store";
import OurStoryClient, { OurStoryData } from "./OurStoryClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const item = await store.content.get("about");
  const data = (item?.value || {}) as OurStoryData;

  return <OurStoryClient initialData={data} />;
}
