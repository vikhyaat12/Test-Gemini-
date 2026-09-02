import { Metadata } from "next";
import StoreLocatorDashboard from "./dashboard";
import { storeLocatorPageStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const config = await storeLocatorPageStore.get();
  return {
    title: config.seo?.metaTitle || "Store & Distributor Locator | Queens Care Laboratories",
    description: config.seo?.metaDescription || "Find verified Queens Care pharmacies, authorized retail stockists, and wholesale distribution centers across India.",
    keywords: config.seo?.keywords,
    openGraph: {
      title: config.seo?.ogTitle || config.seo?.metaTitle || "Store & Distributor Locator | Queens Care Laboratories",
      description: config.seo?.ogDescription || config.seo?.metaDescription,
      images: config.seo?.ogImage ? [{ url: config.seo.ogImage }] : undefined,
      url: config.seo?.canonicalUrl || "https://queenscare.in/store-locator",
    },
  };
}

export default function Page() {
  return <StoreLocatorDashboard />;
}
