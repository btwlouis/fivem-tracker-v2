import { prisma } from "@/lib/prisma";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const servers = await prisma.server.findMany({
        select: {
            id: true,
            projectName: true,
            updated_at: true,
        },
        orderBy: {
            playersCurrent: "desc",
        },
        take: 100,
    });

    const serverEntries: MetadataRoute.Sitemap = servers.map((server) => ({
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/server/${server.id}`,
        lastModified: server.updated_at.toISOString(),
        changefreq: "daily",
    }))

    return [
        {
            url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
            lastModified: new Date(),
        },
        ...serverEntries,
    ]
}