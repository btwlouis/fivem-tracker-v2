import type { Metadata } from "next";
import { Roboto, Space_Grotesk } from "next/font/google";
import Script from "next/script";
import type { ScriptHTMLAttributes } from "react";

import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { I18nProvider } from "@/lib/i18n";
import HeaderShell from "@/components/HeaderShell";
import PlausibleProvider from "next-plausible";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

const roboto = Roboto({subsets:['latin'],variable:'--font-sans'});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.baseUrl),
  title: {
    default: "FiveM Tracker - Server Liste, Stats und Detailseiten",
    template: `%s | ${siteConfig.name}`,
  },
  applicationName: siteConfig.shortName,
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  icons: {
    icon: [
      { url: "/icon_white_transparent.png", type: "image/png" },
      { url: "/icon_black_white_background.png", type: "image/png" },
    ],
    shortcut: "/icon_white_transparent.png",
    apple: "/icon_black_white_background.png",
  },
  category: "gaming",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "FiveM Tracker - Server Liste, Stats und Detailseiten",
    description: siteConfig.description,
    siteName: siteConfig.name,
    url: siteConfig.baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "FiveM Tracker - Server Liste, Stats und Detailseiten",
    description: siteConfig.description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || "";
  const host = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST || "";
  const plausibleSrc = host ? `${host.replace(/\/$/, "")}/js/script.js` : null;
  const app = (
    <html
      lang="de"
      suppressHydrationWarning
      className={cn(spaceGrotesk.variable, "dark h-full font-sans", roboto.variable)}
    >
      <head>
        <link rel="preconnect" href="https://servers-frontend.fivem.net" />
        <link rel="dns-prefetch" href="https://servers-frontend.fivem.net" />
        <link rel="preconnect" href="//analytics.onlouis.de" />
      </head>
      <body className="flex h-dvh flex-col bg-background font-sans text-foreground antialiased">
        <ThemeProvider
          defaultTheme="dark"
          enableSystem
        >
          <I18nProvider>
            <HeaderShell />
            {children}
          </I18nProvider>
        </ThemeProvider>

        <Script id="matomo" strategy="afterInteractive">{`
          var _paq = window._paq = window._paq || [];
          _paq.push(['trackPageView']);
          _paq.push(['enableLinkTracking']);
          (function() {
            var u="//analytics.onlouis.de/";
            _paq.push(['setTrackerUrl', u+'matomo.php']);
            _paq.push(['setSiteId', '1']);
            var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
            g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
          })();
        `}</Script>
      </body>
    </html>
  );

  if (!plausibleSrc) {
    return app;
  }

  return (
    <PlausibleProvider
      src={plausibleSrc}
      scriptProps={
        domain
          ? ({ "data-domain": domain } as ScriptHTMLAttributes<HTMLScriptElement>)
          : undefined
      }
    >
      {app}
    </PlausibleProvider>
  );
}
