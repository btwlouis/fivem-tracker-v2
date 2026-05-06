import { prisma } from "@/lib/prisma";
import { getRetentionHistoryCutoffDate, getVisibleHistoryCutoffDate } from "@/lib/server-freshness";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

type SortOption = "players" | "upvotes" | "record";

type ServerRow = {
  id: string;
  projectName: string | null;
  projectDescription: string | null;
  playersCurrent: number | null;
  playersMax: number | null;
  localeCountry: string;
  iconVersion: number | null;
  tags: string | null;
  upvotePower: number | null;
  record: number | bigint;
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const locale = searchParams.get("locale");
  const parsedPage = parseInt(searchParams.get("page") || "1", 10);
  const parsedPageSize = parseInt(searchParams.get("pageSize") || "30", 10);
  const page = Math.max(Number.isNaN(parsedPage) ? 1 : parsedPage, 1);
  const pageSize = Math.min(
    Math.max(Number.isNaN(parsedPageSize) ? 30 : parsedPageSize, 1),
    100
  );
  const search = searchParams.get("search") || "";
  const sort = (searchParams.get("sort") || "players") as SortOption;

  try {
    const skip = (page - 1) * pageSize;
    const historyCutoff = getVisibleHistoryCutoffDate();
    const retentionCutoff = getRetentionHistoryCutoffDate();

    const conditions: Prisma.Sql[] = [
      Prisma.sql`s."playersCurrent" > 0`,
      Prisma.sql`EXISTS (
        SELECT 1 FROM "ServerHistory" sh2
        WHERE sh2.server_id = s.id AND sh2.timestamp >= ${historyCutoff}
      )`,
    ];

    if (locale) {
      conditions.push(Prisma.sql`s."localeCountry" = ${locale}`);
    }

    if (search.trim()) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        Prisma.sql`(s."projectName" ILIKE ${pattern} OR s."projectDescription" ILIKE ${pattern})`
      );
    }

    const whereClause = Prisma.join(conditions, " AND ");

    const orderClause =
      sort === "record"
        ? Prisma.sql`record DESC NULLS LAST`
        : sort === "upvotes"
          ? Prisma.sql`s."upvotePower" DESC NULLS LAST`
          : Prisma.sql`s."playersCurrent" DESC`;

    const [servers, countResult] = await Promise.all([
      prisma.$queryRaw<ServerRow[]>(Prisma.sql`
        SELECT
          s.id,
          s."projectName",
          s."projectDescription",
          s."playersCurrent",
          s."playersMax",
          s."localeCountry",
          s."iconVersion",
          s.tags,
          s."upvotePower",
          COALESCE(h."maxClients", s."playersCurrent", 0) AS record
        FROM "Server" s
        LEFT JOIN (
          SELECT server_id, MAX(clients) AS "maxClients"
          FROM "ServerHistory"
          WHERE timestamp >= ${retentionCutoff}
          GROUP BY server_id
        ) h ON h.server_id = s.id
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT ${pageSize} OFFSET ${skip}
      `),
      prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
        SELECT COUNT(*) AS count
        FROM "Server" s
        WHERE ${whereClause}
      `),
    ]);

    const totalCount = Number(countResult[0]?.count ?? 0);

    const serversWithRank = servers.map(
      (server: ServerRow, index: number) => ({
        ...server,
        rank: skip + index + 1,
        record: Number(server.record),
      })
    );

    const isDefaultQuery = !search && page === 1 && !locale;
    const cacheControl = isDefaultQuery
      ? "public, s-maxage=30, stale-while-revalidate=60"
      : "no-store";

    return NextResponse.json(
      {
        servers: serversWithRank,
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
        hasMore: skip + servers.length < totalCount,
      },
      {
        headers: { "Cache-Control": cacheControl },
      }
    );
  } catch (error) {
    console.error("Failed to fetch servers:", error);
    return NextResponse.json(
      {
        servers: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasMore: false,
        error: "Failed to fetch servers",
      },
      { status: 500 }
    );
  }
}
