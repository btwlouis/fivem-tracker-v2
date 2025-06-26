import { deleteOldServers, getServers } from "@/services/fivem.service";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401,
    });
  }
  void (async () => {
    try {
      await getServers();
      await deleteOldServers();
    } catch (err) {
      console.error("Background cron job failed:", err);
    }
  })();

  return Response.json({ success: true });
}