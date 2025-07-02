import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get("locale") || "DE";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "50");
  const search = searchParams.get("search") || "";

  try {
    const skip = (page - 1) * pageSize;

    // Build the where clause with search functionality
    const whereClause = {
      localeCountry: locale,
      playersCurrent: {
        gt: 0,
      },
      ...(search && {
        OR: [
          {
            projectName: {
              contains: search,
            },
          },
          {
            projectDescription: {
              contains: search,
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
