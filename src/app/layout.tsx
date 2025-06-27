import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import PlausibleProvider from 'next-plausible'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FiveM Tracker",
  description: "Unlock the power of FiveM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const domain = process.env.PLAUSIBLE_DOMAIN || "";
  const host = process.env.PLAUSIBLE_HOST || "";

  return (
    <>
      <PlausibleProvider domain={domain} customDomain={host}>
        <html lang="en" suppressHydrationWarning>
          <body className={`${inter.className} antialiased `}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange>
              {children}
            </ThemeProvider>
          </body>
        </html>
      </PlausibleProvider>
    </>
  );
}
