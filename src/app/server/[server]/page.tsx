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
import type { Server } from "@prisma/client";
import { Metadata } from "next";

// Revalidate every 60 seconds (ISR)
export const revalidate = 60;

// Static paths for all server pages
export async function generateStaticParams() {
  const servers = await prisma.server.findMany({
    select: { id: true },
    take: 1000,
    orderBy: { playersCurrent: "desc" },
  });

  // console log the first 10 ids
  return servers.map((s) => ({ server: s.id }));
}

// Metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ server: string }>;
}): Promise<Metadata> {
  const { server } = await params;
  const serverResult = await getServer(server);

  return {
    title:
      serverResult?.serverData?.projectName?.replace(/\^(\d)/g, "") || "Server",
    description:
      serverResult?.serverData?.projectDescription?.replace(/\^(\d)/g, "") ||
      "Server",
    openGraph: {
      countryName: serverResult?.serverData?.localeCountry,
      locale: serverResult?.serverData?.locale,
      type: "website",
    },
  };
}

async function getServer(serverId: string) {
  try {
    const serverData = (await prisma.server.findUnique({
      where: { id: serverId },
    })) as Server;

    return {
      serverData,
    };
  } catch (error) {
    console.error("Failed to fetch server:", error);
    return null;
  }
}

// Static Page Component
export default async function Server({
  params,
}: {
  params: Promise<{ server: string }>;
}) {
  const { server } = await params;
  const serverResult = await getServer(server);

  if (!serverResult?.serverData) {
    return notFound();
  }

  const { serverData } = serverResult;

  const formattedProjectName =
    serverData.projectName?.replace(
      /\^(\d)/g,
      (_: string, code: string) =>
        `<span style='color: ${colorMap[`^${code}`] || "inherit"}'>`
    ) + "</span>";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Link
        prefetch={false}
        href="/"
        className="flex items-center text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Link>

      <Card className="shadow-lg">
        {serverData.bannerDetail && (
          <Image
            src={serverData.bannerDetail}
            alt="Server Banner"
            width={1865}
            height={108}
            className="w-full h-20 rounded-lg object-cover"
            unoptimized
          />
        )}

        <CardHeader className="flex flex-row items-center space-x-4">
          {serverData.iconVersion && serverData.id ? (
            <Image
              src={`https://servers-frontend.fivem.net/api/servers/icon/${serverData.id}/${serverData.iconVersion}.png`}
              width={48}
              height={48}
              loading="lazy"
              alt="Server Icon"
            />
          ) : (
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500" />
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
          <div className="flex items-center space-x-2">
            <ServerIcon className="w-5 h-5 text-primary" />
            <span>{serverData.server}</span>
          </div>

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

      <Chart serverId={serverData.id} />
    </div>
  );
}
