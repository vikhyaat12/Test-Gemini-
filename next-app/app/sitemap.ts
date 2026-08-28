import type { MetadataRoute } from "next";
import { store } from "@/lib/commerce/store";
const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const primary = ["", "/shop", "/about", "/manufacturing", "/research-development", "/quality-assurance", "/contact", "/faq", "/b2b", "/doctors", "/blog"];
  const secondary = ["/careers", "/privacy", "/terms", "/track-order"];
  const products = await store.products.list();
  const posts = await store.posts.list();
  return [
    ...primary.map((path) => ({ url: `${origin}${path}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: path === "" ? 1 : 0.7 })),
    ...secondary.map((path) => ({ url: `${origin}${path}`, lastModified: new Date(), changeFrequency: "yearly" as const, priority: 0.3 })),
    ...products.map((p) => ({ url: `${origin}/products/${p.slug}`, lastModified: new Date(p.createdAt), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...posts.map((p) => ({ url: `${origin}/blog/${p.slug}`, lastModified: new Date(p.createdAt), changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
