import type { MetadataRoute } from "next";

const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/analytics",
          "/account",
          "/checkout",
          "/api/",
        ],
      },
    ],
    sitemap: `${origin}/sitemap.xml`,
  };
}
