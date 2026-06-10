import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  // Public, indexable marketing pages only — never the per-user/auth surfaces.
  const routes = ["", "/start", "/how-it-works", "/pricing", "/faq", "/login"];
  return routes.map((r) => ({
    url: `${BASE}${r}`,
    changeFrequency: "weekly" as const,
    priority: r === "" ? 1 : 0.7,
  }));
}
