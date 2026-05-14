import { prisma } from "@/lib/prisma";
import { getVisibleHistoryCutoffDate } from "@/lib/server-freshness";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const page = request.nextUrl.searchParams.get("page");
  const localeCountry = request.nextUrl.searchParams.get("locale");

  const pageNumber = page ? parseInt(page, 10) : 1;

  const limit = 50;
  const offset = (pageNumber - 1) * limit;
  const historyCutoff = getVisibleHistoryCutoffDate();
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
    take: limit,
    skip: offset,
    where: {
      ...(localeCountry ? { localeCountry } : {}),
      playersCurrent: {
        gt: 0,
      },
      ...activityWhere,
    },
    orderBy: {
      playersCurrent: "desc",
    },
  });

  return Response.json(servers);
}
