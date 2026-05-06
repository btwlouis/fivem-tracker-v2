import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Gamepad2,
  Globe,
  Hash,
  LogIn,
  Map,
  Server as ServerIcon,
  Shield,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";

import { Chart } from "./_components/chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import {
  getRetentionHistoryCutoffDate,
  getVisibleHistoryCutoffDate,
} from "@/lib/server-freshness";
import { siteConfig } from "@/lib/site";
import {
  formatRelativeDate,
  parseServerTags,
  parseStoredJson,
  stripFivemFormatting,
} from "@/lib/utils";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Array<{ server: string }>> {
  const servers = await prisma.server.findMany({
    select: {
      id: true,
    },
    where: {
      server_history: {
        some: {
          timestamp: {
            gte: getRetentionHistoryCutoffDate(),
          },
        },
      },
    },
    orderBy: {
      updated_at: "desc",
    },
    take: 500,
  });

  return servers.map((server) => ({ server: server.id }));
}

function getIndexableServerWhere(serverId: string) {
  return {
    id: serverId,
    server_history: {
      some: {
        timestamp: {
          gte: getRetentionHistoryCutoffDate(),
        },
      },
    },
  };
}

async function getServer(serverId: string) {
  return prisma.server.findFirst({
    where: getIndexableServerWhere(serverId),
  });
}

function getServerName(projectName?: string | null) {
  return stripFivemFormatting(projectName) || "FiveM Server";
}

function getServerDescription(projectDescription?: string | null, projectName?: string | null) {
  return (
    stripFivemFormatting(projectDescription) ||
    `${getServerName(projectName)} ist aktuell im FiveM Tracker gelistet.`
  );
}

function getGameName(game?: string | null) {
  if (game === "gta5") return "Grand Theft Auto V";
  if (game) return "Red Dead Redemption 2";
  return "FiveM";
}

function buildServerDescription(serverData: NonNullable<Awaited<ReturnType<typeof getServer>>>) {
  const name = getServerName(serverData.projectName);
  const description = getServerDescription(
    serverData.projectDescription,
    serverData.projectName
  );

  return `${name} ist ein aktiver ${serverData.localeCountry} ${
    serverData.gametype || "FiveM"
  } Server mit aktuell ${serverData.playersCurrent ?? 0} von ${
    serverData.playersMax ?? 0
  } belegten Slots. ${description}`;
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
      title: "Server nicht gefunden",
    };
  }

  const projectName = getServerName(serverData.projectName);
  const tags = parseServerTags(serverData.tags);
  const description = buildServerDescription(serverData);

  return {
    title: `${projectName} FiveM Server`,
    description,
    keywords: Array.from(
      new Set([
        ...siteConfig.keywords,
        projectName,
        `${projectName} FiveM`,
        `${projectName} Server`,
        `${projectName} FiveM Server`,
        `${projectName} ${serverData.localeCountry}`,
        serverData.gametype || "FiveM Server",
        ...tags,
      ])
    ),
    alternates: {
      canonical: `/server/${serverData.id}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "article",
      title: `${projectName} FiveM Server`,
      description,
      url: `${siteConfig.baseUrl}/server/${serverData.id}`,
      images: serverData.bannerDetail
        ? [
            {
              url: serverData.bannerDetail,
              alt: `${projectName} FiveM Server Banner`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${projectName} FiveM Server`,
      description,
      images: serverData.bannerDetail ? [serverData.bannerDetail] : undefined,
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

  const projectName = getServerName(serverData.projectName);
  const projectDescription = getServerDescription(
    serverData.projectDescription,
    serverData.projectName
  );
  
  const isFreshlyActive =
    (serverData.playersCurrent ?? 0) > 0 &&
    new Date(serverData.updated_at).getTime() >= getVisibleHistoryCutoffDate().getTime();
  const tags = parseServerTags(serverData.tags);
  const searchPhrases = [
    `${projectName} FiveM`,
    `${projectName} Server`,
    `${projectName} FiveM Server`,
    `${projectName} ${serverData.localeCountry}`,
    ...(serverData.gametype ? [`${projectName} ${serverData.gametype}`] : []),
  ];
  const connectEndPoints = parseStoredJson<string[]>(serverData.connectEndPoints) || [];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${projectName} FiveM Server`,
    url: `${siteConfig.baseUrl}/server/${serverData.id}`,
    description: buildServerDescription(serverData),
    inLanguage: "de-DE",
    about: {
      "@type": "Thing",
      name: projectName,
      description: projectDescription,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "FiveM Tracker",
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
    <main className="flex min-h-0 w-full flex-1 overflow-y-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="container mx-auto flex min-h-full w-full flex-col gap-4 px-4 py-4">
        <Card className="rounded-[1.75rem] border border-border/70 bg-card/85 shadow-xl backdrop-blur">
          {serverData.bannerDetail ? (
            <Image
              src={serverData.bannerDetail}
              alt={`${projectName} Banner`}
              width={1865}
              height={220}
              className="h-44 w-full object-cover"
              unoptimized
            />
          ) : null}

          <CardContent className="flex flex-col gap-5 px-6 py-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur Serverliste
            </Link>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 gap-4">
                {serverData.iconVersion ? (
                  <Image
                    src={`https://servers-frontend.fivem.net/api/servers/icon/${serverData.id}/${serverData.iconVersion}.png`}
                    width={72}
                    height={72}
                    alt={`${projectName} Icon`}
                    className="h-[72px] w-[72px] rounded-2xl border border-border/70 object-contain"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-border/70 bg-muted/40">
                    <ServerIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                <div className="min-w-0 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{serverData.localeCountry}</Badge>
                    <Badge variant="secondary">
                      {serverData.private ? "Privat" : "Öffentlich"}
                    </Badge>
                    <Badge variant={isFreshlyActive ? "secondary" : "outline"}>
                      {isFreshlyActive ? "Aktiv" : "Zuletzt aktiv"}
                    </Badge>
                    {serverData.gametype ? (
                      <Badge variant="outline">{serverData.gametype}</Badge>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                      {projectName} FiveM Server
                    </h1>
                    <p className="max-w-4xl text-sm leading-7 text-muted-foreground">
                      {projectDescription}
                    </p>
                  </div>
                </div>
              </div>

              {serverData.joinId ? (
                <Button asChild className="shrink-0">
                  <Link href={`fivem://connect/${serverData.joinId}`}>
                    <LogIn className="h-4 w-4" />
                    Server öffnen
                  </Link>
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {searchPhrases.map((phrase) => (
                <Badge key={phrase} variant="outline">
                  {phrase}
                </Badge>
              ))}
              {tags.slice(0, 4).map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 shadow-sm">
            <CardContent className="px-5 py-5">
              <Users className="h-5 w-5 text-primary" />
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Live-Spieler
              </p>
              <p className="mt-1 text-2xl font-semibold">
                {serverData.playersCurrent ?? 0}
                <span className="text-base text-muted-foreground">
                  /{serverData.playersMax ?? 0}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 shadow-sm">
            <CardContent className="px-5 py-5">
              <Globe className="h-5 w-5 text-primary" />
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Region
              </p>
              <p className="mt-1 text-2xl font-semibold">{serverData.localeCountry}</p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 shadow-sm">
            <CardContent className="px-5 py-5">
              <Map className="h-5 w-5 text-primary" />
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Map
              </p>
              <p className="mt-1 text-lg font-semibold">
                {serverData.mapname || "Unbekannt"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 shadow-sm">
            <CardContent className="px-5 py-5">
              <Clock3 className="h-5 w-5 text-primary" />
              <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Letztes Update
              </p>
              <p className="mt-1 text-lg font-semibold">
                {formatRelativeDate(serverData.updated_at)}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <Chart serverId={serverData.id} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-[1.75rem] border border-border/70 bg-card/85 shadow-xl backdrop-blur">
            <CardHeader>
              <h2 className="text-xl font-semibold tracking-tight">Server-Profil</h2>
              <CardDescription>
                Strukturierte Felder, die Spielern und Suchmaschinen Kontext geben.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Gamepad2 className="h-4 w-4 text-primary" />
                  Spiel
                </div>
                <p className="text-sm text-muted-foreground">{getGameName(serverData.gamename)}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Shield className="h-4 w-4 text-primary" />
                  Script Hook
                </div>
                <p className="text-sm text-muted-foreground">
                  {serverData.scriptHookAllowed ? "Erlaubt" : "Nicht erlaubt"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Hash className="h-4 w-4 text-primary" />
                  Server-ID
                </div>
                <p className="break-all text-sm text-muted-foreground">{serverData.id}</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Hash className="h-4 w-4 text-primary" />
                  Join-ID
                </div>
                <p className="text-sm text-muted-foreground">
                  {serverData.joinId || "Nicht verfügbar"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <ServerIcon className="h-4 w-4 text-primary" />
                  OneSync
                </div>
                <p className="text-sm text-muted-foreground">
                  {serverData.onesyncEnabled ? "Aktiv" : "Deaktiviert"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <Globe className="h-4 w-4 text-primary" />
                  Premium
                </div>
                <p className="text-sm text-muted-foreground">
                  {serverData.premium || "Nicht verfügbar"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border border-border/70 bg-card/85 shadow-xl backdrop-blur">
            <CardHeader>
              <h2 className="text-xl font-semibold tracking-tight">Technische Details</h2>
              <CardDescription>
                Zusätzliche Metadaten für Analyse, Zuordnung und Serververgleich.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-muted-foreground">
              <p>Hostname: {serverData.hostname || "Nicht verfügbar"}</p>
              <p>Server-Software: {serverData.server || "Nicht verfügbar"}</p>
              <p>Build: {serverData.enforceGameBuild || "Nicht verfügbar"}</p>
              <p>Historische Adresse: {serverData.historicalAddress || "Nicht verfügbar"}</p>
              <p>Owner: {serverData.ownerName || "Nicht verfügbar"}</p>
              <p>Support-Status: {serverData.supportStatus || "Nicht verfügbar"}</p>
              {connectEndPoints.length ? (
                <div className="space-y-2 pt-2">
                  <p className="font-medium text-foreground">Connect-Endpunkte</p>
                  {connectEndPoints.map((endpoint) => (
                    <div
                      key={endpoint}
                      className="break-all rounded-xl border border-border/70 bg-background/70 px-3 py-2"
                    >
                      {endpoint}
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
