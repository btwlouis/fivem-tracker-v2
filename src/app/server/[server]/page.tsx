import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Clock3,
  Code2,
  Cpu,
  ExternalLink,
  Gamepad2,
  Globe,
  Hash,
  Languages,
  Layers,
  LogIn,
  Map,
  MapPin,
  Server as ServerIcon,
  Shield,
  Star,
  User,
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
      server_stats: {
        is: {
          lastSeen: {
            gte: getRetentionHistoryCutoffDate(),
          },
        },
      },
    },
    orderBy: {
      updated_at: "desc",
    },
    take: 1000
  });

  return servers.map((server) => ({ server: server.id }));
}

function getIndexableServerWhere(serverId: string) {
  const activityWhere =
    process.env.NODE_ENV === "production"
      ? {
          server_stats: {
            is: {
              lastSeen: {
                gte: getRetentionHistoryCutoffDate(),
              },
            },
          },
        }
      : {
          OR: [
            {
              server_stats: {
                is: {
                  lastSeen: {
                    gte: getRetentionHistoryCutoffDate(),
                  },
                },
              },
            },
            {
              server_history: {
                some: {
                  timestamp: {
                    gte: getRetentionHistoryCutoffDate(),
                  },
                },
              },
            },
          ],
        };

  return {
    id: serverId,
    ...activityWhere,
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

      <div className="container mx-auto flex min-h-full w-full flex-col gap-3 px-4 py-4">
        <Card className="rounded-[1.75rem] border border-border/70 bg-card/85 py-0 shadow-xl backdrop-blur">
          <div className="relative overflow-hidden" style={{ minHeight: 260 }}>
            {serverData.bannerDetail ? (
              <Image
                src={serverData.bannerDetail}
                alt={`${projectName} Banner`}
                fill
                sizes="(min-width: 1280px) 1280px, 100vw"
                className="object-cover"
                priority
                unoptimized
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-b from-background/35 via-background/70 to-card" />
            <CardContent
              className="relative z-10 flex flex-col justify-end gap-5 px-5 py-5 sm:px-6 sm:py-6"
              style={{ minHeight: 260 }}
            >
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
          </div>
        </Card>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 py-0 shadow-sm">
            <CardContent className="flex min-h-24 flex-col items-center justify-center px-4 py-4 text-center">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
                Live-Spieler
              </div>
              <p className="mt-2 text-2xl font-semibold">
                {serverData.playersCurrent ?? 0}
                <span className="text-base text-muted-foreground">
                  /{serverData.playersMax ?? 0}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 py-0 shadow-sm">
            <CardContent className="flex min-h-24 flex-col items-center justify-center px-4 py-4 text-center">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
                Region
              </div>
              <p className="mt-2 text-2xl font-semibold">{serverData.localeCountry}</p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 py-0 shadow-sm">
            <CardContent className="flex min-h-24 flex-col items-center justify-center px-4 py-4 text-center">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Map className="h-3.5 w-3.5 shrink-0 text-primary" />
                Map
              </div>
              <p className="mt-2 text-lg font-semibold">
                {serverData.mapname || "Unbekannt"}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 py-0 shadow-sm">
            <CardContent className="flex min-h-24 flex-col items-center justify-center px-4 py-4 text-center">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5 shrink-0 text-primary" />
                Letztes Update
              </div>
              <p className="mt-2 text-lg font-semibold">
                {formatRelativeDate(serverData.updated_at)}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="w-full">
          <Chart serverId={serverData.id} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-[1.75rem] border border-border/70 bg-card/85 shadow-xl backdrop-blur">
            <CardHeader className="pb-3">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <ServerIcon className="h-4 w-4 text-primary" />
                Server-Profil
              </h2>
              <CardDescription className="text-xs">
                Strukturierte Felder, die Spielern und Suchmaschinen Kontext geben.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { Icon: Gamepad2, label: "Spiel", value: getGameName(serverData.gamename) },
                  { Icon: Shield, label: "Script Hook", value: serverData.scriptHookAllowed ? "Erlaubt" : "Nicht erlaubt" },
                  { Icon: ServerIcon, label: "OneSync", value: serverData.onesyncEnabled ? "Aktiv" : "Deaktiviert" },
                  { Icon: Star, label: "Premium", value: serverData.premium || "Kein Premium" },
                  { Icon: Hash, label: "Server-ID", value: serverData.id },
                  { Icon: Hash, label: "Join-ID", value: serverData.joinId || "–" },
                ] as const
              ).map(({ Icon, label, value }) => (
                <div key={label} className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    <Icon className="h-3 w-3 shrink-0 text-primary" />
                    {label}
                  </div>
                  <p className="truncate text-sm font-medium">{value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border border-border/70 bg-card/85 shadow-xl backdrop-blur">
            <CardHeader className="pb-3">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <Cpu className="h-4 w-4 text-primary" />
                Technische Details
              </h2>
              <CardDescription className="text-xs">
                Metadaten für Analyse, Zuordnung und Serververgleich.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { Icon: ServerIcon, label: "Hostname", value: stripFivemFormatting(serverData.hostname) || "–" },
                  { Icon: Code2, label: "Server-Software", value: serverData.server || "–" },
                  { Icon: Layers, label: "Game Build", value: serverData.enforceGameBuild || "Standard" },
                  { Icon: Shield, label: "Pure Level", value: serverData.pureLevel || "–" },
                  { Icon: Languages, label: "Sprache", value: serverData.locale || "–" },
                  { Icon: MapPin, label: "Hist. Adresse", value: serverData.historicalAddress || "–" },
                  { Icon: User, label: "Owner", value: stripFivemFormatting(serverData.ownerName) || "–" },
                  { Icon: Hash, label: "Support-Status", value: serverData.supportStatus || "–" },
                ] as const
              ).map(({ Icon, label, value }) => (
                <div key={label} className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    <Icon className="h-3 w-3 shrink-0 text-primary" />
                    {label}
                  </div>
                  <p className="truncate text-sm font-medium">{String(value)}</p>
                </div>
              ))}
              {serverData.ownerProfile ? (
                <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    <ExternalLink className="h-3 w-3 shrink-0 text-primary" />
                    Owner-Profil
                  </div>
                  <a
                    href={serverData.ownerProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm font-medium text-primary hover:underline"
                  >
                    Profil öffnen
                  </a>
                </div>
              ) : null}
              {connectEndPoints.length ? (
                <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 sm:col-span-2">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    <ServerIcon className="h-3 w-3 shrink-0 text-primary" />
                    Connect-Endpunkte
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {connectEndPoints.map((endpoint) => (
                      <span
                        key={endpoint}
                        className="break-all rounded-lg border border-border/70 bg-muted/40 px-2 py-1 text-xs text-muted-foreground"
                      >
                        {endpoint}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
