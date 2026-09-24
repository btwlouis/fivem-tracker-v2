import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  getIndexableServerWhere,
  SERVER_DIRECTORY_PAGE_SIZE,
} from "@/lib/indexable-servers";
import { prisma } from "@/lib/prisma";
import { stripFivemFormatting } from "@/lib/utils";

export const revalidate = 300;

type PageProps = { params: Promise<{ page: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `Aktive FiveM Server – Seite ${page}`,
    description: `Durchsuche aktive FiveM Server mit aktuellen Spielerzahlen. Serververzeichnis, Seite ${page}.`,
    alternates: { canonical: `/servers/page/${page}` },
  };
}

export default async function ServerDirectoryPage({ params }: PageProps) {
  const { page: pageParam } = await params;
  const page = Number(pageParam);
  if (!Number.isSafeInteger(page) || page < 1 || String(page) !== pageParam) {
    notFound();
  }

  const where = getIndexableServerWhere();
  const totalCount = await prisma.server.count({ where });
  const pageCount = Math.max(
    1,
    Math.ceil(totalCount / SERVER_DIRECTORY_PAGE_SIZE)
  );
  if (page > pageCount) notFound();
  const servers = await prisma.server.findMany({
    where,
    select: {
      id: true,
      projectName: true,
      localeCountry: true,
      playersCurrent: true,
    },
    orderBy: { id: "asc" },
    skip: (page - 1) * SERVER_DIRECTORY_PAGE_SIZE,
    take: SERVER_DIRECTORY_PAGE_SIZE,
  });

  return (
    <main className="container mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-5 text-sm text-muted-foreground"
      >
        <Link href="/" className="hover:text-foreground hover:underline">
          Startseite
        </Link>
        <span aria-hidden="true"> / </span>
        <span>Serververzeichnis</span>
      </nav>

      <h1 className="text-3xl font-semibold tracking-tight">
        Aktive FiveM Server
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {totalCount.toLocaleString("de-DE")} Server mit aktuellen Spielerzahlen
        · Seite {page} von {pageCount}
      </p>

      <ul className="mt-6 grid gap-2 sm:grid-cols-2">
        {servers.map((server) => (
          <li key={server.id}>
            <Link
              href={`/server/${server.id}`}
              className="flex h-full items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/85 px-4 py-3 hover:border-primary/50 hover:bg-muted/30"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {stripFivemFormatting(server.projectName) || "FiveM Server"}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {server.localeCountry} · {server.id}
                </span>
              </span>
              <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                {server.playersCurrent?.toLocaleString("de-DE")} Spieler
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <nav
        aria-label="Verzeichnisseiten"
        className="mt-8 flex items-center justify-between gap-4 text-sm"
      >
        {page > 1 ? (
          <Link
            href={`/servers/page/${page - 1}`}
            className="text-primary hover:underline"
          >
            ← Vorherige Seite
          </Link>
        ) : (
          <span />
        )}
        <span className="text-muted-foreground">
          {page} / {pageCount}
        </span>
        {page < pageCount ? (
          <Link
            href={`/servers/page/${page + 1}`}
            className="text-primary hover:underline"
          >
            Nächste Seite →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
