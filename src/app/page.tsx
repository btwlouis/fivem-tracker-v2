import { Suspense } from "react";

import Header from "@/components/Header";
import ServerList from "@/components/ServerList";
import { prisma } from "@/lib/prisma";
import { getVisibleHistoryCutoffDate } from "@/lib/server-freshness";
import { siteConfig } from "@/lib/site";

export const revalidate = 300;
export const dynamic = "force-dynamic";

async function getHomepageStats() {
  try {
    const historyCutoff = getVisibleHistoryCutoffDate();
    const where = {
      playersCurrent: {
        gt: 0,
      },
      server_history: {
        some: {
          timestamp: {
            gte: historyCutoff,
          },
        },
      },
    };

    const [languages, totalServers, playerTotals] = await Promise.all([
      prisma.server.findMany({
        distinct: ["localeCountry"],
        where,
        select: {
          localeCountry: true,
        },
      }),
      prisma.server.count({
        where,
      }),
      prisma.server.aggregate({
        where,
        _sum: {
          playersCurrent: true,
        },
      }),
    ]);

    return {
      localeCount: languages.length,
      totalPlayers: playerTotals._sum.playersCurrent || 0,
      totalServers,
    };
  } catch (error) {
    console.error("Failed to load homepage stats:", error);
    return {
      localeCount: 0,
      totalPlayers: 0,
      totalServers: 0,
    };
  }
}

export const metadata = {
  title: "FiveM Server Tracker - Browse active FiveM servers with player history",
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: {
    canonical: "/",
  },
};

export default async function Home() {
  const stats = await getHomepageStats();
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.baseUrl,
    description: siteConfig.description,
    inLanguage: "en",
  };

  return (
    <main className="container mx-auto flex min-h-screen w-full flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Header {...stats} />

      <section id="explorer" className="scroll-mt-24">
        <Suspense
          fallback={
            <div className="flex items-center justify-center rounded-3xl border border-border/70 bg-card/95 py-10 text-muted-foreground">
              Loading servers...
            </div>
          }
        >
          <ServerList />
        </Suspense>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card/95 p-6 shadow-xl shadow-sky-950/10">
        <h2 className="text-2xl font-semibold">Why these pages can rank</h2>
        <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
          <p>
            The homepage targets broad discovery intent around FiveM server
            browsing, while subpages target server-specific search terms. Only
            servers with fresh history are shown, which reduces stale index
            pages and improves content quality.
          </p>
          <p>
            Each server page includes structured metadata, descriptive text,
            technical fields, and a player-history chart. That gives crawlers
            meaningful content instead of thin placeholder pages.
          </p>
        </div>
      </section>
    </main>
  );
}
