import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Blindfold — Surprise Vacations",
  description:
    "Tell us your budget and dates. We hand you a whole trip to a place you won't see coming — flights, hotel, transfers, the lot. You just pack a bag.",
  applicationName: "Blindfold",
  appleWebApp: { capable: true, title: "Blindfold", statusBarStyle: "black-translucent" },
  openGraph: {
    title: "Blindfold — Surprise Vacations",
    description: "Book a whole trip to a place you won't see coming. Just pack a bag.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#120d24",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <SiteNav />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
