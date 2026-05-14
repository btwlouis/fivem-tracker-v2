import type { Metadata } from "next";

import ServerList from "@/components/ServerList";
import { prisma } from "@/lib/prisma";
import { getServerListPage } from "@/lib/server-list-query";
import { getVisibleHistoryCutoffDate } from "@/lib/server-freshness";
import { siteConfig } from "@/lib/site";
import type { ServerListItem } from "@/lib/server-list-types";
import { stripFivemFormatting } from "@/lib/utils";

export const revalidate = 300;

type HomepageServer = {
  projectName: string | null;
  projectDescription: string | null;
  localeCountry: string;
};

async function getActiveWhere() {
  const cutoff = getVisibleHistoryCutoffDate();
  const activeSummaryCount = await prisma.serverStats.count({
    where: {
      currentPlayers: { gt: 0 },
      lastSeen: { gte: cutoff },
    },
  });
  const activityWhere =
    activeSummaryCount > 0
      ? {
          server_stats: {
            is: {
              lastSeen: {
                gte: cutoff,
              },
            },
          },
        }
      : {
          updated_at: {
            gte: cutoff,
          },
        };

  return {
    playersCurrent: {
      gt: 0,
    },
    ...activityWhere,
  };
}

function getServerName(server: HomepageServer) {
  return stripFivemFormatting(server.projectName) || "FiveM Server";
}

function getServerDescription(server: HomepageServer) {
  return (
    stripFivemFormatting(server.projectDescription) ||
    `${getServerName(server)} ist aktuell im FiveM Tracker gelistet.`
  );
}

async function getHomepageData() {
  const where = await getActiveWhere();

  const [initialServerData, stats, countries] = await Promise.all([
    getServerListPage({
      page: 1,
      pageSize: 30,
      sort: "players",
    }),
    prisma.serverStats.aggregate({
      where: {
        currentPlayers: { gt: 0 },
        lastSeen: { gte: getVisibleHistoryCutoffDate() },
      },
      _count: { server_id: true },
      _sum: { currentPlayers: true },
    }),
    prisma.server.findMany({
      where,
      distinct: ["localeCountry"],
      select: {
        localeCountry: true,
      },
      take: 8,
    }),
  ]);

  return {
    featuredServers: initialServerData.servers.slice(0, 6),
    initialServerData,
    totalServers: initialServerData.totalCount || stats._count.server_id,
    totalPlayers: stats._sum.currentPlayers || 0,
    countries: countries.map((country) => country.localeCountry).filter(Boolean),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { totalServers, totalPlayers, countries } = await getHomepageData();
  const countryText = countries.slice(0, 4).join(", ");

  return {
    title: "FiveM Server Liste mit Live-Spielerzahlen und Server-Detailseiten",
    description:
      totalServers > 0
        ? `Finde ${totalServers} aktive FiveM Server mit aktuell ${totalPlayers} Live-Spielern, Server-Historie und indexierbaren Detailseiten. Regionen im Tracker: ${countryText || "mehrere Länder"}.`
        : siteConfig.description,
    keywords: [
      ...siteConfig.keywords,
      "FiveM Server Ranking",
      "FiveM Server Details",
      "FiveM Server suchen",
    ],
    alternates: {
      canonical: "/",
    },
  };
}

export default async function Home() {
  const { featuredServers, initialServerData } = await getHomepageData();

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.baseUrl,
    description: siteConfig.description,
    inLanguage: "de-DE",
  };

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: featuredServers.length,
    itemListElement: featuredServers.map((server: ServerListItem, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteConfig.baseUrl}/server/${server.id}`,
      name: getServerName(server),
      description: getServerDescription(server),
    })),
  };

  return (
    <main
      className="flex min-h-0 w-full flex-1"
      style={{ height: "calc(100dvh - var(--header-height, 53px))" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <div className="container mx-auto flex h-full min-h-0 w-full flex-col gap-2 px-2 py-2 sm:gap-5 sm:px-4 sm:py-6">
        <section className="flex min-h-0 flex-1 w-full">
          <ServerList initialData={initialServerData} />
        </section>
      </div>
    </main>
  );
}
