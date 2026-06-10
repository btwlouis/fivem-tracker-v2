import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  CalendarDays,
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
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { CircleFlag } from "react-circle-flags";

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
  parseServerTags,
  parseStoredJson,
  stripFivemFormatting,
} from "@/lib/utils";
import de from "@/locales/de.json";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import fr from "@/locales/fr.json";
import it from "@/locales/it.json";

export const revalidate = 300;
export const dynamicParams = true;

type ServerData = NonNullable<Awaited<ReturnType<typeof getServer>>>;

type ServerHistorySummary = {
  sampleCount: number;
  peakPlayers: number;
  averagePlayers: number;
  firstSeen: Date | null;
  lastSeen: Date | null;
  peakSeenAt: Date | null;
};

type RelatedServer = {
  id: string;
  projectName: string | null;
  projectDescription: string | null;
  playersCurrent: number | null;
  playersMax: number | null;
  localeCountry: string;
  iconVersion: number | null;
};

type Locale = "de" | "en" | "es" | "fr" | "it";

const translations = { de, en, es, fr, it } as const;
const supportedLocales = ["de", "en", "es", "fr", "it"] as const;

function isSupportedLocale(value: string | undefined): value is Locale {
  return supportedLocales.includes(value as Locale);
}

async function getRequestLocale(): Promise<Locale> {
  const store = await cookies();
  const locale = store.get("locale")?.value;
  return isSupportedLocale(locale) ? locale : "de";
}

function resolveTranslation(obj: Record<string, unknown>, path: string): string {
  const result = path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);

  return typeof result === "string" ? result : path;
}

function createTranslator(locale: Locale) {
  return (key: string, vars?: Record<string, string | number>) => {
    const raw = resolveTranslation(translations[locale] as Record<string, unknown>, key);
    if (!vars) return raw;

    return raw.replace(/\{\{(\w+)\}\}/g, (_, name) =>
      String(vars[name] ?? `{{${name}}}`)
    );
  };
}

function getIntlLocale(locale: Locale) {
  const localeMap: Record<Locale, string> = {
    de: "de-DE",
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    it: "it-IT",
  };

  return localeMap[locale];
}

function getSchemaLanguage(locale: Locale) {
  return getIntlLocale(locale);
}

function isFlagCode(code?: string | null) {
  return Boolean(code && /^[a-z]{2}$/i.test(code));
}

function CountryWithIcon({
  code,
  size = 16,
  className = "",
}: {
  code: string;
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {isFlagCode(code) ? (
        <CircleFlag
          countryCode={code.toLowerCase()}
          height={size}
          width={size}
          className="shrink-0"
        />
      ) : (
        <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <span>{code}</span>
    </span>
  );
}

export async function generateStaticParams(): Promise<Array<{ server: string }>> {
  const cutoff = getRetentionHistoryCutoffDate();
  const activeSummaryCount = await prisma.serverStats.count({
    where: {
      currentPlayers: { gt: 0 },
      lastSeen: { gte: cutoff },
    },
  });
  const activityWhere =
    activeSummaryCount > 0
      ? {
          server_stats: {
            is: {
              lastSeen: {
                gte: cutoff,
              },
            },
          },
        }
      : {
          updated_at: {
            gte: cutoff,
          },
        };

  const servers = await prisma.server.findMany({
    select: {
      id: true,
    },
    where: {
      ...activityWhere,
    },
    orderBy: {
      updated_at: "desc",
    },
    take: 1000,
  });

  return servers.map((server) => ({ server: server.id }));
}

async function getServer(serverId: string) {
  return prisma.server.findUnique({
    where: {
      id: serverId,
    },
  });
}

function getServerName(projectName?: string | null) {
  return stripFivemFormatting(projectName) || "FiveM Server";
}

function getServerDescription(
  projectDescription: string | null | undefined,
  projectName: string | null | undefined,
  t: ReturnType<typeof createTranslator>
) {
  return (
    stripFivemFormatting(projectDescription) ||
    t("serverPage.fallbackDescription", { name: getServerName(projectName) })
  );
}

function getGameName(game?: string | null) {
  if (game === "gta5") return "Grand Theft Auto V";
  if (game) return "Red Dead Redemption 2";
  return "FiveM";
}

function formatNumber(value: number | null | undefined, locale: Locale) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatAverage(value: number | null | undefined, locale: Locale) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    maximumFractionDigits: 1,
  }).format(value ?? 0);
}

function formatDate(
  value: Date | null | undefined,
  locale: Locale,
  t: ReturnType<typeof createTranslator>
) {
  if (!value) return t("serverPage.unknown");

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function formatRelativeServerDate(
  value: Date | string | null | undefined,
  locale: Locale,
  t: ReturnType<typeof createTranslator>
) {
  if (!value) return t("serverPage.unknown");

  const date = value instanceof Date ? value : new Date(value);
  const diff = Date.now() - date.getTime();

  if (diff < 60 * 60 * 1000) {
    return t("serverPage.relative.lessThanHour");
  }

  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return t("serverPage.relative.hoursAgo", { count: hours });
  }

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return t("serverPage.relative.daysAgo", { count: days });
}

async function getServerHistorySummary(serverId: string): Promise<ServerHistorySummary> {
  const cutoff = getRetentionHistoryCutoffDate();
  const rows = await prisma.$queryRaw<
    Array<{
      sample_count: bigint;
      peak_players: number | null;
      average_players: number | null;
      first_seen: Date | null;
      last_seen: Date | null;
      peak_seen_at: Date | null;
    }>
  >(Prisma.sql`
    WITH recent_history AS (
      SELECT clients, timestamp
      FROM "ServerHistory"
      WHERE server_id = ${serverId}
        AND timestamp >= ${cutoff}
    ),
    aggregate_history AS (
      SELECT
        COUNT(*) AS sample_count,
        MAX(clients) AS peak_players,
        AVG(clients)::float AS average_players,
        MIN(timestamp) AS first_seen,
        MAX(timestamp) AS last_seen
      FROM recent_history
    ),
    peak_history AS (
      SELECT timestamp AS peak_seen_at
      FROM recent_history
      ORDER BY clients DESC, timestamp DESC
      LIMIT 1
    )
    SELECT
      aggregate_history.sample_count,
      aggregate_history.peak_players,
      aggregate_history.average_players,
      aggregate_history.first_seen,
      aggregate_history.last_seen,
      peak_history.peak_seen_at
    FROM aggregate_history
    LEFT JOIN peak_history ON TRUE
  `);

  const summary = rows[0];

  return {
    sampleCount: Number(summary?.sample_count ?? 0),
    peakPlayers: summary?.peak_players ?? 0,
    averagePlayers: summary?.average_players ?? 0,
    firstSeen: summary?.first_seen ?? null,
    lastSeen: summary?.last_seen ?? null,
    peakSeenAt: summary?.peak_seen_at ?? null,
  };
}

async function getRelatedServers(serverData: ServerData): Promise<RelatedServer[]> {
  return prisma.server.findMany({
    select: {
      id: true,
      projectName: true,
      projectDescription: true,
      playersCurrent: true,
      playersMax: true,
      localeCountry: true,
      iconVersion: true,
    },
    where: {
      id: {
        not: serverData.id,
      },
      playersCurrent: {
        gt: 0,
      },
      updated_at: {
        gte: getVisibleHistoryCutoffDate(),
      },
      OR: [
        {
          localeCountry: serverData.localeCountry,
        },
        ...(serverData.gametype
          ? [
              {
                gametype: serverData.gametype,
              },
            ]
          : []),
      ],
    },
    orderBy: {
      playersCurrent: "desc",
    },
    take: 6,
  });
}

function buildServerDescription(
  serverData: ServerData,
  historySummary: ServerHistorySummary | undefined,
  locale: Locale,
  t: ReturnType<typeof createTranslator>
) {
  const name = getServerName(serverData.projectName);
  const description = getServerDescription(
    serverData.projectDescription,
    serverData.projectName,
    t
  );
  const peakText =
    historySummary && historySummary.sampleCount > 0
      ? ` ${t("serverPage.metaPeak", {
          peak: formatNumber(historySummary.peakPlayers, locale),
        })}`
      : "";

  return `${t("serverPage.metaDescription", {
    name,
    country: serverData.localeCountry,
    type: serverData.gametype || "FiveM",
    current: formatNumber(serverData.playersCurrent, locale),
    max: formatNumber(serverData.playersMax, locale),
  })}${peakText} ${description}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ server: string }>;
}): Promise<Metadata> {
  const locale = await getRequestLocale();
  const t = createTranslator(locale);
  const { server } = await params;
  const serverData = await getServer(server);

  if (!serverData) {
    return {
      title: t("serverPage.notFoundTitle"),
    };
  }

  const historySummary = await getServerHistorySummary(serverData.id);
  const projectName = getServerName(serverData.projectName);
  const tags = parseServerTags(serverData.tags);
  const description = buildServerDescription(serverData, historySummary, locale, t);

  return {
    title: t("serverPage.metaTitle", { name: projectName }),
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
      title: t("serverPage.metaTitle", { name: projectName }),
      description,
      url: `${siteConfig.baseUrl}/server/${serverData.id}`,
      images: serverData.bannerDetail
        ? [
            {
              url: serverData.bannerDetail,
              alt: t("serverPage.bannerAlt", { name: projectName }),
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: t("serverPage.metaTitle", { name: projectName }),
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
  const locale = await getRequestLocale();
  const t = createTranslator(locale);
  const { server } = await params;
  const serverData = await getServer(server);

  if (!serverData) {
    notFound();
  }

  const [historySummary, relatedServers] = await Promise.all([
    getServerHistorySummary(serverData.id),
    getRelatedServers(serverData),
  ]);
  const projectName = getServerName(serverData.projectName);
  const projectDescription = getServerDescription(
    serverData.projectDescription,
    serverData.projectName,
    t
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
  const hasHistory = historySummary.sampleCount > 0;
  const activitySummary = hasHistory
    ? t("serverPage.activitySummary", {
        name: projectName,
        peak: formatNumber(historySummary.peakPlayers, locale),
        average: formatAverage(historySummary.averagePlayers, locale),
        samples: formatNumber(historySummary.sampleCount, locale),
      })
    : t("serverPage.activitySummaryEmpty", { name: projectName });
  const faqItems = [
    {
      question: t("serverPage.faq.currentPlayers.question", { name: projectName }),
      answer: t("serverPage.faq.currentPlayers.answer", {
        name: projectName,
        current: formatNumber(serverData.playersCurrent, locale),
        max: formatNumber(serverData.playersMax, locale),
      }),
    },
    {
      question: t("serverPage.faq.record.question", { name: projectName }),
      answer: hasHistory
        ? t("serverPage.faq.record.answer", {
            peak: formatNumber(historySummary.peakPlayers, locale),
            date: historySummary.peakSeenAt
              ? t("serverPage.faq.record.dateSuffix", {
                  date: formatDate(historySummary.peakSeenAt, locale, t),
                })
              : "",
          })
        : t("serverPage.faq.record.empty", { name: projectName }),
    },
    {
      question: t("serverPage.faq.country.question", { name: projectName }),
      answer: t("serverPage.faq.country.answer", {
        name: projectName,
        country: serverData.localeCountry,
      }),
    },
    {
      question: t("serverPage.faq.join.question", { name: projectName }),
      answer: serverData.joinId
        ? t("serverPage.faq.join.answer", {
            name: projectName,
            joinId: serverData.joinId,
          })
        : t("serverPage.faq.join.empty", { name: projectName }),
    },
  ];

  const pageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t("serverPage.metaTitle", { name: projectName }),
    url: `${siteConfig.baseUrl}/server/${serverData.id}`,
    description: buildServerDescription(serverData, historySummary, locale, t),
    inLanguage: getSchemaLanguage(locale),
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
        name: siteConfig.name,
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
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
  const relatedServersJsonLd = relatedServers.length
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: t("serverPage.relatedJsonLdName", { name: projectName }),
        itemListElement: relatedServers.map((relatedServer, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${siteConfig.baseUrl}/server/${relatedServer.id}`,
          name: getServerName(relatedServer.projectName),
        })),
      }
    : null;

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {relatedServersJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(relatedServersJsonLd) }}
        />
      ) : null}

      <div className="container mx-auto flex min-h-full w-full flex-col gap-3 px-4 py-4">
        <Card
          className="rounded-[1.75rem] border border-border/70 bg-card/85 py-0 shadow-xl backdrop-blur"
          style={{ minHeight: 260 }}
        >
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
              {t("serverPage.backToList")}
            </Link>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 gap-4">
                {serverData.iconVersion ? (
                  <Image
                    src={`https://frontend.cfx-services.net/api/servers/icon/${serverData.id}/${serverData.iconVersion}.png`}
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
                    <Badge variant="secondary">
                      <CountryWithIcon code={serverData.localeCountry} />
                    </Badge>
                    <Badge variant="secondary">
                      {serverData.private
                        ? t("serverPage.badges.private")
                        : t("serverPage.badges.public")}
                    </Badge>
                    <Badge variant={isFreshlyActive ? "secondary" : "outline"}>
                      {isFreshlyActive
                        ? t("serverPage.badges.active")
                        : t("serverPage.badges.lastActive")}
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
                    {t("serverPage.openServer")}
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
                {t("serverPage.stats.livePlayers")}
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
                {t("serverPage.stats.region")}
              </div>
              <p className="mt-2 flex items-center justify-center text-2xl font-semibold">
                <CountryWithIcon code={serverData.localeCountry} size={22} />
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 py-0 shadow-sm">
            <CardContent className="flex min-h-24 flex-col items-center justify-center px-4 py-4 text-center">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Map className="h-3.5 w-3.5 shrink-0 text-primary" />
                {t("serverPage.stats.map")}
              </div>
              <p className="mt-2 text-lg font-semibold">
                {serverData.mapname || t("serverPage.unknown")}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border border-border/70 bg-card/85 py-0 shadow-sm">
            <CardContent className="flex min-h-24 flex-col items-center justify-center px-4 py-4 text-center">
              <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5 shrink-0 text-primary" />
                {t("serverPage.stats.lastUpdate")}
              </div>
              <p className="mt-2 text-lg font-semibold">
                {formatRelativeServerDate(serverData.updated_at, locale, t)}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-[1.75rem] border border-border/70 bg-card/85 shadow-xl backdrop-blur">
            <CardHeader className="pb-3">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <Activity className="h-4 w-4 text-primary" />
                {t("serverPage.analysis.title")}
              </h2>
              <CardDescription className="text-sm leading-6">
                {activitySummary}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">
                {t("serverPage.analysis.description", { name: projectName })}
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border border-border/70 bg-card/85 shadow-xl backdrop-blur">
            <CardHeader className="pb-3">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <BarChart3 className="h-4 w-4 text-primary" />
                {t("serverPage.historyNumbers.title")}
              </h2>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {[
                {
                  Icon: TrendingUp,
                  label: t("serverPage.historyNumbers.peak"),
                  value: formatNumber(historySummary.peakPlayers, locale),
                },
                {
                  Icon: Activity,
                  label: t("serverPage.historyNumbers.average"),
                  value: formatAverage(historySummary.averagePlayers, locale),
                },
                {
                  Icon: CalendarDays,
                  label: t("serverPage.historyNumbers.samples"),
                  value: formatNumber(historySummary.sampleCount, locale),
                },
                {
                  Icon: Clock3,
                  label: t("serverPage.historyNumbers.peakTime"),
                  value: formatDate(historySummary.peakSeenAt, locale, t),
                },
              ].map(({ Icon, label, value }) => (
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
        </section>

        <section className="w-full">
          <Chart serverId={serverData.id} />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-[1.75rem] border border-border/70 bg-card/85 shadow-xl backdrop-blur">
            <CardHeader className="pb-3">
              <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
                <ServerIcon className="h-4 w-4 text-primary" />
                {t("serverPage.profile.title")}
              </h2>
              <CardDescription className="text-xs">
                {t("serverPage.profile.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { Icon: Gamepad2, label: t("serverPage.profile.game"), value: getGameName(serverData.gamename) },
                  { Icon: Shield, label: "Script Hook", value: serverData.scriptHookAllowed ? t("serverPage.values.allowed") : t("serverPage.values.notAllowed") },
                  { Icon: ServerIcon, label: "OneSync", value: serverData.onesyncEnabled ? t("serverPage.values.active") : t("serverPage.values.disabled") },
                  { Icon: Star, label: "Premium", value: serverData.premium || t("serverPage.values.noPremium") },
                  { Icon: Hash, label: t("serverPage.profile.serverId"), value: serverData.id },
                  { Icon: Hash, label: t("serverPage.profile.joinId"), value: serverData.joinId || "–" },
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
                {t("serverPage.technical.title")}
              </h2>
              <CardDescription className="text-xs">
                {t("serverPage.technical.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {(
                [
                  { Icon: ServerIcon, label: "Hostname", value: stripFivemFormatting(serverData.hostname) || "–" },
                  { Icon: Code2, label: t("serverPage.technical.software"), value: serverData.server || "–" },
                  { Icon: Layers, label: "Game Build", value: serverData.enforceGameBuild || t("serverPage.values.standard") },
                  { Icon: Shield, label: "Pure Level", value: serverData.pureLevel || "–" },
                  { Icon: Languages, label: t("serverPage.technical.language"), value: serverData.locale || "–" },
                  { Icon: MapPin, label: t("serverPage.technical.historicalAddress"), value: serverData.historicalAddress || "–" },
                  { Icon: User, label: "Owner", value: stripFivemFormatting(serverData.ownerName) || "–" },
                  { Icon: Hash, label: t("serverPage.technical.supportStatus"), value: serverData.supportStatus || "–" },
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
                    {t("serverPage.technical.ownerProfile")}
                  </div>
                  <a
                    href={serverData.ownerProfile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm font-medium text-primary hover:underline"
                  >
                    {t("serverPage.technical.openProfile")}
                  </a>
                </div>
              ) : null}
              {connectEndPoints.length ? (
                <div className="rounded-xl border border-border/70 bg-background/70 px-3 py-2.5 sm:col-span-2">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    <ServerIcon className="h-3 w-3 shrink-0 text-primary" />
                    {t("serverPage.technical.connectEndpoints")}
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

        <section className="grid gap-4 lg:grid-cols-2">
          <Card className="rounded-[1.75rem] border border-border/70 bg-card/85 shadow-xl backdrop-blur">
            <CardHeader className="pb-3">
              <h2 className="text-base font-semibold tracking-tight">
                {t("serverPage.faqTitle", { name: projectName })}
              </h2>
              <CardDescription className="text-xs">
                {t("serverPage.faqDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {faqItems.map((item) => (
                <div key={item.question} className="rounded-xl border border-border/70 bg-background/70 px-3 py-3">
                  <h3 className="text-sm font-medium">{item.question}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border border-border/70 bg-card/85 shadow-xl backdrop-blur">
            <CardHeader className="pb-3">
              <h2 className="text-base font-semibold tracking-tight">
                {t("serverPage.related.title")}
              </h2>
              <CardDescription className="text-xs">
                {t("serverPage.related.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {relatedServers.length ? (
                relatedServers.map((relatedServer) => {
                  const relatedName = getServerName(relatedServer.projectName);
                  const relatedDescription = getServerDescription(
                    relatedServer.projectDescription,
                    relatedServer.projectName,
                    t
                  );

                  return (
                    <Link
                      key={relatedServer.id}
                      href={`/server/${relatedServer.id}`}
                      className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/70 px-3 py-3 transition-colors hover:bg-muted/35"
                    >
                      {relatedServer.iconVersion ? (
                        <Image
                          src={`https://frontend.cfx-services.net/api/servers/icon/${relatedServer.id}/${relatedServer.iconVersion}.png`}
                          width={36}
                          height={36}
                        alt={`${relatedName} Icon`}
                          className="h-9 w-9 shrink-0 rounded-lg object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-muted/40">
                          <ServerIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-medium">
                            {relatedName}
                          </h3>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            <CountryWithIcon code={relatedServer.localeCountry} size={14} />
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {relatedDescription}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {formatNumber(relatedServer.playersCurrent, locale)}/
                        {formatNumber(relatedServer.playersMax, locale)}
                      </span>
                    </Link>
                  );
                })
              ) : (
                <p className="rounded-xl border border-border/70 bg-background/70 px-3 py-3 text-sm text-muted-foreground">
                  {t("serverPage.related.empty")}
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
