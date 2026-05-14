import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getVisibleHistoryCutoffDate } from "@/lib/server-freshness";
import { NextResponse } from "next/server";

const fetchStats = unstable_cache(
  async () => {
    const historyCutoff = getVisibleHistoryCutoffDate();

    const stats = await prisma.serverStats.aggregate({
      where: {
        currentPlayers: { gt: 0 },
        lastSeen: { gte: historyCutoff },
      },
      _count: { server_id: true },
      _sum: {
        currentPlayers: true,
        maxPlayers30d: true,
      },
    });

    if (stats._count.server_id > 0) {
      return {
        totalPlayers: stats._sum.currentPlayers ?? 0,
        totalServers: stats._count.server_id,
        totalRecord: stats._sum.maxPlayers30d ?? 0,
      };
    }

    if (process.env.NODE_ENV === "production") {
      return {
        totalPlayers: 0,
        totalServers: 0,
        totalRecord: 0,
      };
    }

    const serverStats = await prisma.server.aggregate({
      where: {
        playersCurrent: { gt: 0 },
        server_history: { some: { timestamp: { gte: historyCutoff } } },
      },
      _count: { id: true },
      _sum: { playersCurrent: true },
    });

    return {
      totalPlayers: serverStats._sum.playersCurrent ?? 0,
      totalServers: serverStats._count.id,
      totalRecord: 0,
    };
  },
  ["homepage-stats"],
  { revalidate: 60 }
);

export async function GET() {
  try {
    const stats = await fetchStats();
    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return NextResponse.json(
      { totalPlayers: 0, totalServers: 0, totalRecord: 0 },
      { status: 500 }
    );
  }
}
