import { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { getRetentionHistoryCutoffDate } from "@/lib/server-freshness";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const historyCutoff = getRetentionHistoryCutoffDate();
    const activeSummaryCount = await prisma.serverStats.count({
      where: {
        currentPlayers: { gt: 0 },
        lastSeen: { gte: historyCutoff },
      },
    });
    const activityWhere =
      activeSummaryCount > 0
        ? {
            server_stats: {
              is: {
                lastSeen: {
                  gte: historyCutoff,
                },
              },
            },
          }
        : {
            updated_at: {
              gte: historyCutoff,
            },
          };

    const servers = await prisma.server.findMany({
      select: {
        id: true,
        updated_at: true,
      },
      where: {
        ...activityWhere,
      },
      orderBy: {
        updated_at: "desc",
      },
      take: 5000,
    });

    const serverEntries: MetadataRoute.Sitemap = servers.map(
      (server: { id: string; updated_at: Date }) => ({
        url: `${siteConfig.baseUrl}/server/${server.id}`,
        lastModified: server.updated_at,
        changeFrequency: "daily",
        priority: 0.7,
      })
    );

    return [
      {
        url: `${siteConfig.baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      },
      ...serverEntries,
    ];
  } catch (error) {
    console.error("Failed to generate sitemap:", error);
    return [
      {
        url: `${siteConfig.baseUrl}/`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      },
    ];
  }
}
