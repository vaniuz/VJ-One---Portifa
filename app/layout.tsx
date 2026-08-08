import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const title = "VJ One — Cinematic film for luxury villas & real estate";
const description =
  "A cinematic content system that turns rooms, light and atmosphere into a reason to book. Property films for villas, resorts and luxury real estate.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  applicationName: "VJ One",
  keywords: [
    "VJ One",
    "luxury real estate video",
    "villa video production",
    "property film",
    "cinematic real estate",
    "hospitality content",
    "resort videography",
  ],
  authors: [{ name: "VJ One" }],
  creator: "VJ One",
  publisher: "VJ One",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "VJ One — From listing to longing.",
    description,
    type: "website",
    locale: "en_US",
    siteName: "VJ One",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "VJ One — cinematic film for luxury villas and real estate.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const introFlagsScript = `
  try {
    if (sessionStorage.getItem('vj-one-seen-v1') === 'true') {
      document.documentElement.dataset.vjReturning = 'true';
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.dataset.vjReduced = 'true';
    }
  } catch (_) {}
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        {/* App Router root layout applies to every route, so the pages/
            _document caveat behind this rule does not apply. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;700&family=Instrument+Serif:ital@1&display=swap"
        />
        {/* Painted before the bundle arrives so the intro never flashes white. */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              "html,body{margin:0;background:#060606;color:#f2f0ea}body{min-height:100vh}",
          }}
        />
        {/* Runs before first paint: CSS hides the preloader outright for
            returning visitors, so hydration never flashes a frame of it. */}
        <script dangerouslySetInnerHTML={{ __html: introFlagsScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
