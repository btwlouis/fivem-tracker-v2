import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

const rangeConfig = {
  "1h": { ms: 60 * 60 * 1000, bucketSeconds: 60 },
  "1d": { ms: 24 * 60 * 60 * 1000, bucketSeconds: 5 * 60 },
  "7d": { ms: 7 * 24 * 60 * 60 * 1000, bucketSeconds: 30 * 60 },
  "1m": { ms: 30 * 24 * 60 * 60 * 1000, bucketSeconds: 2 * 60 * 60 },
} as const;

type HistoryRange = keyof typeof rangeConfig;

function getRange(req: Request): HistoryRange {
  const url = new URL(req.url);
  const range = url.searchParams.get("range");

  return range && range in rangeConfig ? (range as HistoryRange) : "1d";
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;

    if (!serverId) {
      return new NextResponse("Server ID is required", { status: 400 });
    }

    const range = getRange(req);
    const { bucketSeconds, ms } = rangeConfig[range];
    const cutoff = new Date(Date.now() - ms);

    const history = await prisma.$queryRaw<
      Array<{ id: number; server_id: string; clients: number; timestamp: Date }>
    >(Prisma.sql`
      SELECT id, server_id, clients, timestamp
      FROM (
        SELECT
          id,
          server_id,
          clients,
          timestamp,
          ROW_NUMBER() OVER (
            PARTITION BY FLOOR(EXTRACT(EPOCH FROM timestamp) / ${bucketSeconds})
            ORDER BY timestamp DESC
          ) AS bucket_row
        FROM "ServerHistory"
        WHERE server_id = ${serverId}
          AND timestamp >= ${cutoff}
      ) history_buckets
      WHERE bucket_row = 1
      ORDER BY timestamp DESC
    `);

    return NextResponse.json(history, {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    });
  } catch (e) {
    console.error("Failed to load history", e);
    return new NextResponse("Error fetching data", { status: 500 });
  }
}
