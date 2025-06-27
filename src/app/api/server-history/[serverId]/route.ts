import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;

    if (!serverId) {
      return new NextResponse("Server ID is required", { status: 400 });
    }
    
    const history = await prisma.serverHistory.findMany({
      where: { server_id: serverId },
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json(history);
  } catch (e) {
    console.error("Failed to load history", e);
    return new NextResponse("Error fetching data", { status: 500 });
  }
}
