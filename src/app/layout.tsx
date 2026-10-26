import type { Metadata, Viewport } from "next";
import {
  Anton,
  Barlow,
  Barlow_Condensed,
  Chakra_Petch,
  Orbitron,
  Share_Tech_Mono,
  Silkscreen,
  Titillium_Web,
} from "next/font/google";
import { Analytics } from "@/components/Analytics";
import { EasterEggs } from "@/components/EasterEggs";
import { SITE } from "@/content/site";
import { BOOT_SCRIPT } from "@/lib/stores/htmlAttr";
import { buildWorldCss } from "@/lib/worlds/css";
import "./globals.css";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});
const body = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});
const pixel = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-pixel",
  display: "swap",
});
// the other worlds' fonts load on demand (no preload) so football visitors don't pay for them
// (next/font needs literal options, so they are repeated)
const titillium = Titillium_Web({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["700", "900"],
  variable: "--font-titillium",
});
const orbitron = Orbitron({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["700", "900"],
  variable: "--font-orbitron",
});
const anton = Anton({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--font-anton",
});
const chakra = Chakra_Petch({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: ["600", "700"],
  variable: "--font-chakra",
});
const shareTech = Share_Tech_Mono({
  subsets: ["latin"],
  display: "swap",
  preload: false,
  weight: "400",
  variable: "--font-sharetech",
});
const FONT_CLASSES = [
  display,
  body,
  pixel,
  titillium,
  orbitron,
  anton,
  chakra,
  shareTech,
]
  .map((f) => f.variable)
  .join(" ");
const WORLD_CSS = buildWorldCss();

function siteUrl(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return new URL(explicit);
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return new URL(vercel ? `https://${vercel}` : "http://localhost:3000");
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: SITE.title,
  description: SITE.description,
  authors: [{ name: SITE.name }],
  openGraph: {
    type: "website",
    title: SITE.title,
    description: SITE.description,
    siteName: SITE.name,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#08130e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="night"
      data-var="off"
      data-world="football"
      className={FONT_CLASSES}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: WORLD_CSS }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <EasterEggs />
        <Analytics />
      </body>
    </html>
  );
}
