import { json } from "@/lib/http";
import { pageSettingsStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function GET() {
  const [activePages, headerPages, footerPages] = await Promise.all([
    pageSettingsStore.active(),
    pageSettingsStore.headerVisible(),
    pageSettingsStore.footerVisible(),
  ]);

  return json({
    pages: activePages,
    header: headerPages,
    footer: footerPages,
  });
}
