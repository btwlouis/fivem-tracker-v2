import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  Clock3,
  Gamepad2,
  Globe,
  Hash,
  LogIn,
  Map,
  Monitor,
  Server as ServerIcon,
  Shield,
  ThumbsUp,
  Users,
  Zap,
} from "lucide-react";
import { notFound } from "next/navigation";

import { Chart } from "./_components/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { getVisibleHistoryCutoffDate } from "@/lib/server-freshness";
import { siteConfig } from "@/lib/site";
import {
  formatCompactNumber,
  formatRelativeDate,
  parseServerTags,
  parseStoredJson,
  stripFivemFormatting,
} from "@/lib/utils";

export const revalidate = 300;
export const dynamicParams = true;

function getActiveServerWhere(serverId?: string) {
  return {
    ...(serverId ? { id: serverId } : {}),
    playersCurrent: {
      gt: 0,
    },
    server_history: {
      some: {
        timestamp: {
          gte: getVisibleHistoryCutoffDate(),
        },
      },
    },
  };
}

async function getServer(serverId: string) {
  return prisma.server.findFirst({
    where: getActiveServerWhere(serverId),
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ server: string }>;
}): Promise<Metadata> {
  const { server } = await params;
  const serverData = await getServer(server);

  if (!serverData) {
    return {
      title: "Server not found",
    };
  }

  const title = stripFivemFormatting(serverData.projectName) || "FiveM server";
  const description =
    stripFivemFormatting(serverData.projectDescription) ||
    `View ${title} on FiveM Tracker.`;

  return {
    title,
    description,
    keywords: [
      title,
      `${title} FiveM`,
      `FiveM server ${serverData.localeCountry}`,
      serverData.gametype || "FiveM server",
      "FiveM player history",
    ],
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `/server/${serverData.id}`,
    },
    openGraph: {
      type: "article",
      url: `${siteConfig.baseUrl}/server/${serverData.id}`,
      title,
      description,
      images: serverData.bannerDetail
        ? [
            {
              url: serverData.bannerDetail,
            },
          ]
        : undefined,
    },
  };
}

export default async function ServerPage({
  params,
}: {
  params: Promise<{ server: string }>;
}) {
  const { server } = await params;
  const serverData = await getServer(server);

  if (!serverData) {
    notFound();
  }

  const projectName =
    stripFivemFormatting(serverData.projectName) || "Unnamed FiveM server";
  const description =
    stripFivemFormatting(serverData.projectDescription) ||
    "No detailed description is available for this server.";
  const tags = parseServerTags(serverData.tags);
  const connectEndPoints = parseStoredJson<string[]>(serverData.connectEndPoints) || [];
  const rawVariables =
    parseStoredJson<Record<string, string>>(serverData.rawVariables) || {};
  const variables =
    parseStoredJson<Record<string, string>>(serverData.variables) || {};
  const resources = parseStoredJson<string[]>(serverData.resources) || [];
  const players =
    parseStoredJson<
      Array<{
        endpoint: string;
        id: number;
        identifiers: string[];
        name: string;
        ping: number;
      }>
    >(serverData.players) || [];
  const fallbackData = parseStoredJson<unknown>(serverData.fallback);
  const serverJsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: projectName,
    description,
    url: `${siteConfig.baseUrl}/server/${serverData.id}`,
    genre: serverData.gametype || "FiveM server",
    gamePlatform: serverData.gamename === "gta5" ? "PC" : "PC",
    image: serverData.bannerDetail || undefined,
    inLanguage: serverData.locale || "en",
    additionalProperty: [
      {
        "@type": "PropertyValue",
        name: "Region",
        value: serverData.localeCountry,
      },
      {
        "@type": "PropertyValue",
        name: "Current players",
        value: serverData.playersCurrent || 0,
      },
      {
        "@type": "PropertyValue",
        name: "Max players",
        value: serverData.playersMax || 0,
      },
      {
        "@type": "PropertyValue",
        name: "Map",
        value: serverData.mapname || "Unknown",
      },
    ],
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteConfig.baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: projectName,
        item: `${siteConfig.baseUrl}/server/${serverData.id}`,
      },
    ],
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serverJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <Link
        prefetch={false}
        href="/"
        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to explorer
      </Link>

      <Card className="overflow-hidden rounded-3xl border border-sky-500/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))] shadow-2xl shadow-sky-950/25">
        {serverData.bannerDetail ? (
          <Image
            src={serverData.bannerDetail}
            alt={`${projectName} banner`}
            width={1865}
            height={220}
            className="h-44 w-full object-cover sm:h-56"
            unoptimized
          />
        ) : null}

        <CardHeader className="gap-6 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.14),transparent_30%),linear-gradient(180deg,rgba(30,41,59,0.4),transparent)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex gap-4">
              {serverData.iconVersion && serverData.id ? (
                <Image
                  src={`https://servers-frontend.fivem.net/api/servers/icon/${serverData.id}/${serverData.iconVersion}.png`}
                  width={72}
                  height={72}
                  loading="lazy"
                  alt="Server icon"
                  className="h-[72px] w-[72px] rounded-2xl border border-border/70 object-contain bg-black/20 p-1"
                />
              ) : (
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400">
                  <ServerIcon className="h-8 w-8" />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{serverData.localeCountry}</Badge>
                  <Badge variant="secondary">
                    {serverData.private ? "Private" : "Public"}
                  </Badge>
                  <Badge variant="outline">
                    {serverData.gametype || "No gametype"}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <CardTitle className="text-3xl sm:text-4xl">
                    {projectName}
                  </CardTitle>
                  <CardDescription className="max-w-3xl text-base leading-7">
                    {description}
                  </CardDescription>
                </div>
              </div>
            </div>

            {serverData.joinId ? (
              <Button asChild className="bg-sky-600 text-white hover:bg-sky-500">
                <Link href={`fivem://connect/${serverData.joinId}`}>
                  <LogIn className="h-4 w-4" />
                  Join server
                </Link>
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-border/70 bg-slate-950/70 p-4 text-slate-50">
            <Users className="mb-3 h-5 w-5 text-sky-300" />
            <p className="text-sm text-slate-300">Players</p>
            <p className="text-xl font-semibold">
              {serverData.playersCurrent} / {serverData.playersMax}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-slate-950/70 p-4 text-slate-50">
            <Globe className="mb-3 h-5 w-5 text-sky-300" />
            <p className="text-sm text-slate-300">Region</p>
            <p className="text-xl font-semibold">{serverData.localeCountry}</p>
            <p className="text-xs text-slate-400">{serverData.locale}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-slate-950/70 p-4 text-slate-50">
            <Map className="mb-3 h-5 w-5 text-sky-300" />
            <p className="text-sm text-slate-300">Map</p>
            <p className="text-xl font-semibold">
              {serverData.mapname || "Unknown"}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-slate-950/70 p-4 text-slate-50">
            <Clock3 className="mb-3 h-5 w-5 text-sky-300" />
            <p className="text-sm text-slate-300">Last update</p>
            <p className="text-xl font-semibold">
              {formatRelativeDate(serverData.updated_at)}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6">
        <Chart serverId={serverData.id} />
      </section>

      <Card className="rounded-3xl border border-sky-500/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] shadow-xl shadow-sky-950/15">
        <CardHeader>
          <CardTitle>Server profile</CardTitle>
          <CardDescription>
            Structured server details that are actually stored in the
            database.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Gamepad2 className="h-4 w-4 text-sky-400" />
              Game
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.gamename == "gta5" ? "Grand Theft Auto V" : "Red Dead Redemption 2"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Shield className="h-4 w-4 text-sky-400" />
              Script hook
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.scriptHookAllowed ? "Allowed" : "Not allowed"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <ThumbsUp className="h-4 w-4 text-sky-400" />
              Upvotes
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.upvotePower || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Zap className="h-4 w-4 text-sky-400" />
              Burst power
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.burstPower || 0}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Hash className="h-4 w-4 text-sky-400" />
              Server ID
            </div>
            <p className="break-all text-sm text-muted-foreground">
              {serverData.id}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <LogIn className="h-4 w-4 text-sky-400" />
              Join ID
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.joinId || "Not available"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Monitor className="h-4 w-4 text-sky-400" />
              Server software
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.server || "Not available"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <CalendarClock className="h-4 w-4 text-sky-400" />
              Added to tracker
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(serverData.created_at).toLocaleString("en-US")}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Hash className="h-4 w-4 text-sky-400" />
              Details level
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.detailsLevel ?? "Not available"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Globe className="h-4 w-4 text-sky-400" />
              Premium tier
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.premium || "Not available"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Shield className="h-4 w-4 text-sky-400" />
              Pure level
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.pureLevel || "Not available"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <ServerIcon className="h-4 w-4 text-sky-400" />
              Support status
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.supportStatus || "Not available"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <Monitor className="h-4 w-4 text-sky-400" />
              OneSync
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.onesyncEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <ThumbsUp className="h-4 w-4 text-sky-400" />
              Can review
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.canReview ? "Yes" : "No"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-[linear-gradient(180deg,rgba(14,165,233,0.07),rgba(15,23,42,0.28))] p-4">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <ServerIcon className="h-4 w-4 text-sky-400" />
              Offline flag
            </div>
            <p className="text-sm text-muted-foreground">
              {serverData.offline ? "Yes" : "No"}
            </p>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border border-sky-500/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] shadow-xl shadow-sky-950/15">
          <CardHeader>
            <CardTitle>Search summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              {projectName} is an active FiveM server from{" "}
              {serverData.localeCountry}. This page shows current players,
              maximum slots, map, gametype, region, and technical metadata.
            </p>
            <p>
              The player history chart gives this subpage useful crawlable
              content instead of a thin placeholder. Search engines can index a
              real summary of the server and its current activity.
            </p>
            <p>
              Queries like {projectName}, FiveM server{" "}
              {serverData.localeCountry}, or {serverData.gametype || "roleplay"}{" "}
              FiveM are supported by the on-page text and metadata.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-sky-500/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] shadow-xl shadow-sky-950/15">
          <CardHeader>
            <CardTitle>Technical details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-muted-foreground">
            <p>Hostname: {serverData.hostname || "Not available"}</p>
            <p>Historical address: {serverData.historicalAddress || "Not available"}</p>
            <p>Historical icon URL: {serverData.historicalIconURL || "Not available"}</p>
            <p>Build: {serverData.enforceGameBuild || "Not available"}</p>
            <p>Icon version: {serverData.iconVersion ?? "Not available"}</p>
            <p>Current players: {formatCompactNumber(serverData.playersCurrent)}</p>
            <p>Max players: {formatCompactNumber(serverData.playersMax)}</p>
            <p>License key token: {serverData.licenseKeyToken || "Not available"}</p>
            <p>ActivityPub feed: {serverData.activitypubFeed || "Not available"}</p>
            <p>Updated at: {new Date(serverData.updated_at).toLocaleString("en-US")}</p>
            {tags.length ? <p>Tags: {tags.join(", ")}</p> : null}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border border-sky-500/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] shadow-xl shadow-sky-950/15">
          <CardHeader>
            <CardTitle>Ownership and endpoints</CardTitle>
            <CardDescription>
              Additional fields received from the upstream server payload.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <p>Owner ID: {serverData.ownerID || "Not available"}</p>
            <p>Owner name: {serverData.ownerName || "Not available"}</p>
            <p>Owner avatar: {serverData.ownerAvatar || "Not available"}</p>
            <p>Owner profile: {serverData.ownerProfile || "Not available"}</p>
            <div>
              <p className="mb-2 font-medium text-foreground">Connect endpoints</p>
              {connectEndPoints.length ? (
                <div className="space-y-2">
                  {connectEndPoints.map((endpoint) => (
                    <p key={endpoint} className="break-all rounded-xl border border-white/8 bg-black/10 px-3 py-2">
                      {endpoint}
                    </p>
                  ))}
                </div>
              ) : (
                <p>Not available</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-sky-500/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] shadow-xl shadow-sky-950/15">
          <CardHeader>
            <CardTitle>Payload collections</CardTitle>
            <CardDescription>
              Arrays and nested payload data saved from the upstream server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
            <div>
              <p className="mb-2 font-medium text-foreground">Resources</p>
              {resources.length ? (
                <div className="flex flex-wrap gap-2">
                  {resources.slice(0, 40).map((resource) => (
                    <Badge key={resource} variant="outline">
                      {resource}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p>Not available</p>
              )}
            </div>

            <div>
              <p className="mb-2 font-medium text-foreground">Players payload</p>
              {players.length ? (
                <div className="space-y-2">
                  {players.slice(0, 20).map((player) => (
                    <div
                      key={`${player.id}-${player.name}`}
                      className="rounded-xl border border-white/8 bg-black/10 px-3 py-2"
                    >
                      <p className="font-medium text-foreground">{player.name}</p>
                      <p>ID: {player.id}</p>
                      <p>Ping: {player.ping}</p>
                      <p className="break-all">Endpoint: {player.endpoint}</p>
                      <p>Identifiers: {player.identifiers.length}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>Not available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-3xl border border-sky-500/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] shadow-xl shadow-sky-950/15">
          <CardHeader>
            <CardTitle>Variables</CardTitle>
            <CardDescription>
              Parsed server variables saved from the payload.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-[420px] overflow-auto rounded-2xl border border-white/8 bg-black/20 p-4 text-xs leading-6 text-slate-300">
              {Object.keys(variables).length
                ? JSON.stringify(variables, null, 2)
                : "Not available"}
            </pre>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-sky-500/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] shadow-xl shadow-sky-950/15">
          <CardHeader>
            <CardTitle>Raw variables and fallback</CardTitle>
            <CardDescription>
              Raw upstream data saved for inspection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <pre className="max-h-[260px] overflow-auto rounded-2xl border border-white/8 bg-black/20 p-4 text-xs leading-6 text-slate-300">
              {Object.keys(rawVariables).length
                ? JSON.stringify(rawVariables, null, 2)
                : "Not available"}
            </pre>
            <pre className="max-h-[140px] overflow-auto rounded-2xl border border-white/8 bg-black/20 p-4 text-xs leading-6 text-slate-300">
              {fallbackData !== null
                ? JSON.stringify(fallbackData, null, 2)
                : "No fallback payload"}
            </pre>
          </CardContent>
        </Card>
      </section>

      {serverData.bannerConnecting ? (
        <Card className="overflow-hidden rounded-3xl border border-sky-500/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] shadow-xl shadow-sky-950/15">
          <CardHeader>
            <CardTitle>Connection banner</CardTitle>
            <CardDescription>
              Additional banner media stored for this server.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Image
              src={serverData.bannerConnecting}
              alt={`${projectName} connection banner`}
              width={1865}
              height={220}
              className="h-40 w-full rounded-2xl object-cover sm:h-48"
              unoptimized
            />
            <p className="break-all text-sm text-muted-foreground">
              {serverData.bannerConnecting}
            </p>
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
