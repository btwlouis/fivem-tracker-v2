import {
  ArrowLeft,
  Globe,
  Map,
  Users,
  Server as ServerIcon,
  Lock,
  Unlock,
  Gamepad2,
  ThumbsUp,
  Zap,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Chart } from "./_components/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { notFound } from "next/navigation";
import Image from "next/image";
import { colorMap } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Server, ServerHistory } from "@prisma/client";

async function getServer(serverId: string) {
  try {
    const serverData = await prisma.server.findUnique({
      where: {
        id: serverId,
      },
    }) as Server;

    const serverHistory = await prisma.serverHistory.findMany({
      where: {
        server_id: serverId,
      },
      orderBy: {
        timestamp: "desc",
      },
    }) as ServerHistory[];

    return {
      serverData,
      serverHistory,
    };
  } catch (error) {
    console.error("Failed to fetch server:", error);
    return null;
  }
}

export default async function Server({
  params,
}: Readonly<{
  params: Promise<{ server: string }>;
}>) {
  const { server } = await params;

  const serverResult = await getServer(server);

  if (!serverResult) {
    return notFound();
  }

  const { serverData, serverHistory } = serverResult;

  if (!serverData) {
    return notFound();
  }

  const formattedProjectName =
    serverData.projectName?.replace(
      /\^(\d)/g,
      (_: string, code: string) =>
        `<span style='color: ${colorMap[`^${code}`] || "inherit"}'>`
    ) + "</span>";

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Button */}
      <Link
        href="/"
        className="flex items-center text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Main Page
      </Link>

      {/* Server Card */}
      <Card className="shadow-lg">
        {JSON.stringify(serverData)}

        <CardHeader className="flex flex-row items-center space-x-4">
          {serverData.bannerDetail && (
            <Image
              src={`https://servers-frontend.fivem.net/api/servers/icon/${serverData.id}/${serverData.iconVersion}.png`}
              width={48}
              height={48}
              alt="server icon"
            />

            // <Image
            //   src={serverData.logo}
            //   alt="Server Banner"
            //   width={100}
            //   height={100}
            //   className="rounded-lg shadow-sm"
            //   unoptimized={true}
            // />
          )}
          <div>
            <CardTitle>
              <div
                className="truncate"
                dangerouslySetInnerHTML={{ __html: formattedProjectName }}
              />
            </CardTitle>
            <CardDescription>{serverData.projectDescription}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Server Version */}
          <div className="flex items-center space-x-2">
            <ServerIcon className="w-5 h-5 text-primary" />
            <span>{serverData.server}</span>
          </div>

          {/* Player Count */}
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-primary" />
            <span>
              {serverData.playersCurrent} / {serverData.playersMax} Players
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Map className="w-5 h-5 text-primary" />
            <span>{serverData.mapname}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-primary" />
            <span>{serverData.localeCountry}</span>
          </div>

          <div className="flex items-center space-x-2">
            {serverData.private ? (
              <Lock className="w-5 h-5 text-red-500" />
            ) : (
              <Unlock className="w-5 h-5 text-green-500" />
            )}
            <span>{serverData.private ? "Private" : "Public"}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            <span>{serverData.gamename}</span>
          </div>

          <div className="flex items-center space-x-2">
            <ThumbsUp className="w-5 h-5 text-primary" />
            <span>{serverData.upvotePower} Upvotes</span>
          </div>

          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-primary" />
            <span>{serverData.burstPower} Burst Power</span>
          </div>

          <div className="col-span-2 sm:col-span-4 flex justify-center">
            <Button asChild variant="default">
              <Link href={`fivem://connect/${serverData.joinId}`}>
                <LogIn className="w-5 h-5" />
                Join
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Player History Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Player Activity</CardTitle>
          <CardDescription>Last recorded player counts</CardDescription>
        </CardHeader>
        <CardContent>
          <Chart data={serverHistory} />
        </CardContent>
      </Card>
    </div>
  );
}
