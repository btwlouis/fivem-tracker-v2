import { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import { getVisibleHistoryCutoffDate } from "@/lib/server-freshness";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const servers = await prisma.server.findMany({
    select: { id: true },
    where: {
      playersCurrent: { gt: 0 },
      projectName: { not: "" },
      updated_at: { gte: getVisibleHistoryCutoffDate() },
    },
    orderBy: { updated_at: "desc" },
    take: 50000,
  });

  return [
    { url: `${siteConfig.baseUrl}/` },
    ...servers.map((server) => ({
      url: `${siteConfig.baseUrl}/server/${server.id}`,
    })),
  ];
}
