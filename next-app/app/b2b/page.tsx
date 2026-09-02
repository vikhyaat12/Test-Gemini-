import { Metadata } from "next";
import B2BDashboard from "./dashboard";
import { b2bPageStore } from "@/lib/commerce/store-extensions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const config = await b2bPageStore.get();
  return {
    title: config.seo?.metaTitle || "B2B Partnerships — Queens Care Laboratories",
    description: config.seo?.metaDescription || "Become a Queens Care distributor. Wholesale healthcare products with competitive pricing, marketing support, and priority fulfilment.",
    keywords: config.seo?.keywords,
    openGraph: {
      title: config.seo?.ogTitle || config.seo?.metaTitle || "B2B Partnerships — Queens Care Laboratories",
      description: config.seo?.ogDescription || config.seo?.metaDescription,
      images: config.seo?.ogImage ? [{ url: config.seo.ogImage }] : undefined,
      url: config.seo?.canonicalUrl || "https://queenscare.in/b2b",
    },
  };
}

export default function Page() {
  return <B2BDashboard />;
}
