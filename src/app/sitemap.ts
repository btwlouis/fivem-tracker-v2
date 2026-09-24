import { MetadataRoute } from "next";

import { prisma } from "@/lib/prisma";
import {
  getIndexableServerWhere,
  SERVER_DIRECTORY_PAGE_SIZE,
} from "@/lib/indexable-servers";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const servers = await prisma.server.findMany({
    select: { id: true },
    where: getIndexableServerWhere(),
    orderBy: { updated_at: "desc" },
    take: 50000,
  });

  return [
    { url: `${siteConfig.baseUrl}/` },
    ...Array.from(
      {
        length: Math.max(
          1,
          Math.ceil(servers.length / SERVER_DIRECTORY_PAGE_SIZE)
        ),
      },
      (_, index) => ({ url: `${siteConfig.baseUrl}/servers/page/${index + 1}` })
    ),
    ...servers.map((server) => ({
      url: `${siteConfig.baseUrl}/server/${server.id}`,
    })),
  ];
}
