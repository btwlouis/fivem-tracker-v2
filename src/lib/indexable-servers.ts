import type { Prisma } from "@prisma/client";

import { getVisibleHistoryCutoffDate } from "@/lib/server-freshness";

export const SERVER_DIRECTORY_PAGE_SIZE = 100;

export function getIndexableServerWhere(): Prisma.ServerWhereInput {
  return {
    playersCurrent: { gt: 0 },
    projectName: { not: "" },
    updated_at: { gte: getVisibleHistoryCutoffDate() },
  };
}
