import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getVisibleHistoryCutoffDate } from "@/lib/server-freshness";
import type { ServerListItem, ServerListResponse, SortOption } from "@/lib/server-list-types";

type ServerRow = Omit<ServerListItem, "rank" | "record"> & {
  record: number | bigint;
};

type GetServerListPageOptions = {
  locale?: string | null;
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: SortOption;
};

export async function getServerListPage({
  locale,
  page = 1,
  pageSize = 30,
  search = "",
  sort = "players",
}: GetServerListPageOptions): Promise<ServerListResponse> {
  const normalizedPage = Math.max(page, 1);
  const normalizedPageSize = Math.min(Math.max(pageSize, 1), 100);
  const skip = (normalizedPage - 1) * normalizedPageSize;
  const trimmedSearch = search.trim();
  const historyCutoff = getVisibleHistoryCutoffDate();
  const activeSummaryCount = await prisma.serverStats.count({
    where: {
      currentPlayers: { gt: 0 },
      lastSeen: { gte: historyCutoff },
    },
  });
  const useSummary = activeSummaryCount > 0;

  const conditions: Prisma.Sql[] = [
    Prisma.sql`s."playersCurrent" > 0`,
    useSummary
      ? Prisma.sql`st."lastSeen" >= ${historyCutoff}`
      : Prisma.sql`s.updated_at >= ${historyCutoff}`,
  ];

  if (locale) {
    conditions.push(Prisma.sql`s."localeCountry" = ${locale}`);
  }

  if (trimmedSearch) {
    const pattern = `%${trimmedSearch}%`;
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
        COALESCE(st."maxPlayers30d", s."playersCurrent", 0) AS record
      FROM "Server" s
      LEFT JOIN "ServerStats" st ON st.server_id = s.id
      WHERE ${whereClause}
      ORDER BY ${orderClause}
      LIMIT ${normalizedPageSize} OFFSET ${skip}
    `),
    prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
      SELECT COUNT(*) AS count
      FROM "Server" s
      LEFT JOIN "ServerStats" st ON st.server_id = s.id
      WHERE ${whereClause}
    `),
  ]);

  const totalCount = Number(countResult[0]?.count ?? 0);

  return {
    servers: servers.map((server, index) => ({
      ...server,
      rank: skip + index + 1,
      record: Number(server.record),
    })),
    totalCount,
    currentPage: normalizedPage,
    totalPages: Math.ceil(totalCount / normalizedPageSize),
    hasMore: skip + servers.length < totalCount,
  };
}
