import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private / per-user surfaces out of the index.
        disallow: ["/admin", "/api", "/trip", "/trips", "/account", "/checkout"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
