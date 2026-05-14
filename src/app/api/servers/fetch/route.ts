import { deleteOldServers, getServers } from "@/services/fivem.service";
import type { NextRequest } from "next/server";
import { Client } from "pg";

const CRON_LOCK_NAMESPACE = 20260514;
const CRON_LOCK_KEY = 1;

async function withCronLock<T>(callback: () => Promise<T>) {
  const client = new Client({
    connectionString: process.env.DATABASE_URL ?? "",
  });

  await client.connect();

  try {
    const lockResult = await client.query<{ locked: boolean }>(
      "SELECT pg_try_advisory_lock($1, $2) AS locked",
      [CRON_LOCK_NAMESPACE, CRON_LOCK_KEY]
    );

    if (!lockResult.rows[0]?.locked) {
      return { locked: false as const };
    }

    try {
      const result = await callback();
      return { locked: true as const, result };
    } finally {
      await client.query("SELECT pg_advisory_unlock($1, $2)", [
        CRON_LOCK_NAMESPACE,
        CRON_LOCK_KEY,
      ]);
    }
  } finally {
    await client.end();
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }

  try {
    const lock = await withCronLock(async () => {
      await getServers();
      await deleteOldServers();
    });

    if (!lock.locked) {
      return Response.json(
        { success: false, skipped: true, reason: "Cron job already running" },
        { status: 409 }
      );
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("Cron job failed:", err);
    return Response.json({ success: false }, { status: 500 });
  }
}
