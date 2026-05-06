import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getRetentionHistoryCutoffDate, getVisibleHistoryCutoffDate } from "@/lib/server-freshness";
import { NextResponse } from "next/server";

const fetchStats = unstable_cache(
  async () => {
    const historyCutoff = getVisibleHistoryCutoffDate();
    const retentionCutoff = getRetentionHistoryCutoffDate();

    const [serverStats, recordResult] = await Promise.all([
      prisma.server.aggregate({
        where: {
          playersCurrent: { gt: 0 },
          server_history: { some: { timestamp: { gte: historyCutoff } } },
        },
        _count: { id: true },
        _sum: { playersCurrent: true },
      }),
      prisma.$queryRaw<[{ total_record: bigint }]>`
        SELECT COALESCE(SUM(max_clients), 0) AS total_record
        FROM (
          SELECT MAX(clients) AS max_clients
          FROM "ServerHistory"
          WHERE timestamp >= ${retentionCutoff}
          GROUP BY server_id
        ) sub
      `,
    ]);

    return {
      totalPlayers: serverStats._sum.playersCurrent ?? 0,
      totalServers: serverStats._count.id,
      totalRecord: Number(recordResult[0]?.total_record ?? 0),
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
