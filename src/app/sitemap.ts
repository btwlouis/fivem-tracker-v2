import { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { getVisibleHistoryCutoffDate } from "@/lib/server-freshness";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const historyCutoff = getVisibleHistoryCutoffDate();

    const servers = await prisma.server.findMany({
      select: {
        id: true,
        updated_at: true,
      },
      where: {
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
      },
      orderBy: {
        playersCurrent: "desc",
      },
      take: 5000,
    });

    const serverEntries: MetadataRoute.Sitemap = servers.map((server) => ({
      url: `${siteConfig.baseUrl}/server/${server.id}`,
      lastModified: server.updated_at,
      changeFrequency: "daily",
      priority: 0.7,
    }));

    return [
      {
        url: `${siteConfig.baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1,
      },
      ...serverEntries,
    ];
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    return [
      {
        url: `${siteConfig.baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: "hourly",
        priority: 1,
      },
    ];
  }
}
