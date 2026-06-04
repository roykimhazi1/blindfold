import type { MetadataRoute } from "next";

// PWA manifest — makes Blindfold installable and gives it a standalone,
// app-like shell on mobile (no browser chrome). Next serves this at
// /manifest.webmanifest and injects the <link rel="manifest"> automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Blindfold — Surprise Vacations",
    short_name: "Blindfold",
    description: "Book a whole trip to a place you won't see coming. Just pack a bag.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#120d24",
    theme_color: "#120d24",
    categories: ["travel", "lifestyle"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
