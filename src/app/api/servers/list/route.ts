import { prisma } from "@/lib/prisma";
import { getVisibleHistoryCutoffDate } from "@/lib/server-freshness";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get("locale");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);
  const search = searchParams.get("search") || "";

  try {
    const skip = (page - 1) * pageSize;
    const historyCutoff = getVisibleHistoryCutoffDate();

    const whereClause = {
      ...(locale ? { localeCountry: locale } : {}),
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
      ...(search && {
        OR: [
          {
            projectName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            projectDescription: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }),
    };

    const [servers, totalCount] = await Promise.all([
      prisma.server.findMany({
        where: whereClause,
        orderBy: {
          playersCurrent: "desc",
        },
        skip,
        take: pageSize,
        select: {
          id: true,
          projectName: true,
          playersCurrent: true,
          projectDescription: true,
          playersMax: true,
          localeCountry: true,
          iconVersion: true,
          mapname: true,
          gametype: true,
          updated_at: true,
        },
      }),
      prisma.server.count({
        where: whereClause,
      }),
    ]);

    const serversWithRank = servers.map((server, index) => ({
      ...server,
      rank: skip + index + 1,
    }));

    return NextResponse.json({
      servers: serversWithRank,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error("Failed to fetch servers:", error);
    return NextResponse.json(
      {
        servers: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        error: "Failed to fetch servers",
      },
      { status: 500 }
    );
  }
}
