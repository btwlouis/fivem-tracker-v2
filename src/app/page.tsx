import type { Metadata } from "next";

import ServerList from "@/components/ServerList";
import { prisma } from "@/lib/prisma";
import { getVisibleHistoryCutoffDate } from "@/lib/server-freshness";
import { siteConfig } from "@/lib/site";
import { stripFivemFormatting } from "@/lib/utils";

export const revalidate = 300;

type HomepageServer = {
  id: string;
  projectName: string | null;
  projectDescription: string;
  localeCountry: string;
  gametype: string | null;
  playersCurrent: number | null;
  playersMax: number | null;
  tags: string | null;
};

function getActiveWhere() {
  return {
    playersCurrent: {
      gt: 0,
    },
    server_history: {
      some: {
        timestamp: {
          gte: getVisibleHistoryCutoffDate(),
        },
      },
    },
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
  const where = getActiveWhere();

  const [featuredServers, stats, countries] = await Promise.all([
    prisma.server.findMany({
      where,
      select: {
        id: true,
        projectName: true,
        projectDescription: true,
        localeCountry: true,
        gametype: true,
        playersCurrent: true,
        playersMax: true,
        tags: true,
      },
      orderBy: {
        playersCurrent: "desc",
      },
      take: 6,
    }),
    prisma.server.aggregate({
      where,
      _count: {
        id: true,
      },
      _sum: {
        playersCurrent: true,
      },
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
    featuredServers,
    totalServers: stats._count.id,
    totalPlayers: stats._sum.playersCurrent || 0,
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
  const { featuredServers } = await getHomepageData();

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
    itemListElement: featuredServers.map((server, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${siteConfig.baseUrl}/server/${server.id}`,
      name: getServerName(server),
      description: getServerDescription(server),
    })),
  };

  return (
    <main
      className="flex min-h-0 w-full flex-1 "
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

      <div className="container mx-auto flex h-full min-h-0 w-full flex-col px-4 py-6">
        <section className="flex flex-1 min-h-0 w-full">
          <ServerList />
        </section>
      </div>
    </main>
  );
}
