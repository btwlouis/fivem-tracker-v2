import { Activity, AlertTriangle, BarChart3, Database, Lock, Timer } from "lucide-react";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DebugPageProps = {
  searchParams: Promise<{ token?: string }>;
};

type QueryStat = {
  queryid: string | null;
  calls: bigint | number;
  rows: bigint | number;
  total_exec_time: number;
  mean_exec_time: number;
  max_exec_time: number;
  shared_blks_hit: bigint | number;
  shared_blks_read: bigint | number;
  temp_blks_read: bigint | number;
  temp_blks_written: bigint | number;
  query: string;
};

type ActiveQuery = {
  pid: number;
  state: string | null;
  wait_event_type: string | null;
  wait_event: string | null;
  duration: string | null;
  query: string;
};

type RelationStat = {
  relname: string;
  total_size: bigint | number;
  table_size: bigint | number;
  index_size: bigint | number;
  n_live_tup: bigint | number;
  seq_scan: bigint | number;
  idx_scan: bigint | number;
};

function assertDebugAccess(token?: string) {
  const expectedToken = process.env.DEBUG_SECRET || process.env.CRON_SECRET;

  if (!expectedToken || token !== expectedToken) {
    notFound();
  }
}

function toNumber(value: bigint | number | null | undefined) {
  if (typeof value === "bigint") return Number(value);
  return value ?? 0;
}

function formatNumber(value: bigint | number | null | undefined) {
  return new Intl.NumberFormat("de-DE").format(toNumber(value));
}

function formatMs(value: number | null | undefined) {
  return `${new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 1,
  }).format(value ?? 0)} ms`;
}

function formatBytes(value: bigint | number | null | undefined) {
  const bytes = toNumber(value);
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  }).format(size)} ${units[unitIndex]}`;
}

async function isPgStatStatementsEnabled() {
  const result = await prisma.$queryRaw<
    Array<{ extension_installed: boolean; preload_configured: boolean }>
  >`
    SELECT
      EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'pg_stat_statements'
      ) AS extension_installed,
      current_setting('shared_preload_libraries', true) ILIKE '%pg_stat_statements%' AS preload_configured
  `;

  const status = result[0];

  return Boolean(status?.extension_installed && status.preload_configured);
}

async function getQueryStats() {
  return prisma.$queryRaw<QueryStat[]>`
    SELECT
      queryid::text,
      calls,
      rows,
      total_exec_time,
      mean_exec_time,
      max_exec_time,
      shared_blks_hit,
      shared_blks_read,
      temp_blks_read,
      temp_blks_written,
      LEFT(REGEXP_REPLACE(query, '\\s+', ' ', 'g'), 260) AS query
    FROM pg_stat_statements
    WHERE dbid = (
      SELECT oid
      FROM pg_database
      WHERE datname = current_database()
    )
    ORDER BY total_exec_time DESC
    LIMIT 30
  `;
}

async function getQueryStatsSafe(enabled: boolean) {
  if (!enabled) {
    return {
      stats: [],
      error: null,
    };
  }

  try {
    return {
      stats: await getQueryStats(),
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "pg_stat_statements konnte nicht gelesen werden.";

    return {
      stats: [],
      error: message,
    };
  }
}

async function getActiveQueries() {
  return prisma.$queryRaw<ActiveQuery[]>`
    SELECT
      pid,
      state,
      wait_event_type,
      wait_event,
      (now() - query_start)::text AS duration,
      LEFT(REGEXP_REPLACE(query, '\\s+', ' ', 'g'), 260) AS query
    FROM pg_stat_activity
    WHERE datname = current_database()
      AND pid <> pg_backend_pid()
    ORDER BY query_start ASC NULLS LAST
    LIMIT 30
  `;
}

async function getRelationStats() {
  return prisma.$queryRaw<RelationStat[]>`
    SELECT
      relname,
      pg_total_relation_size(relid) AS total_size,
      pg_relation_size(relid) AS table_size,
      pg_indexes_size(relid) AS index_size,
      n_live_tup,
      seq_scan,
      idx_scan
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 15
  `;
}

export default async function DatabaseDebugPage({ searchParams }: DebugPageProps) {
  const { token } = await searchParams;
  assertDebugAccess(token);

  const [pgStatStatementsEnabled, activeQueries, relationStats] = await Promise.all([
    isPgStatStatementsEnabled(),
    getActiveQueries(),
    getRelationStats(),
  ]);

  const { stats: queryStats, error: queryStatsError } =
    await getQueryStatsSafe(pgStatStatementsEnabled);
  const canReadQueryStats = pgStatStatementsEnabled && !queryStatsError;
  const totalCalls = queryStats.reduce((sum, stat) => sum + toNumber(stat.calls), 0);
  const totalDbTime = queryStats.reduce(
    (sum, stat) => sum + (stat.total_exec_time ?? 0),
    0
  );
  const totalReads = queryStats.reduce(
    (sum, stat) => sum + toNumber(stat.shared_blks_read),
    0
  );
  const activeCount = activeQueries.filter((query) => query.state === "active").length;

  return (
    <main className="min-h-0 w-full flex-1 overflow-y-auto">
      <div className="container mx-auto flex min-h-full w-full flex-col gap-4 px-4 py-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">DB Debug</h1>
            <p className="text-sm text-muted-foreground">
              Query-Last über pg_stat_statements. Postgres zeigt hier DB-Ausführungszeit,
              nicht exakte CPU-Zeit pro Query.
            </p>
          </div>
          <Badge variant={canReadQueryStats ? "secondary" : "destructive"}>
            pg_stat_statements {canReadQueryStats ? "aktiv" : "nicht lesbar"}
          </Badge>
        </div>

        {!canReadQueryStats ? (
          <Card className="border-destructive/40 bg-destructive/10">
            <CardContent className="flex gap-3 px-5 py-4 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="font-medium">pg_stat_statements ist nicht vollständig aktiv.</p>
                <p className="mt-1 text-muted-foreground">
                  In Postgres muss die Extension installiert sein. Je nach Hoster:
                  <code className="mx-1 rounded bg-background/80 px-1.5 py-0.5">
                    CREATE EXTENSION pg_stat_statements;
                  </code>
                  und oft zusätzlich
                  <code className="mx-1 rounded bg-background/80 px-1.5 py-0.5">
                    shared_preload_libraries = &apos;pg_stat_statements&apos;
                  </code>
                  mit Neustart.
                </p>
                {queryStatsError ? (
                  <p className="mt-2 font-mono text-xs text-destructive">
                    {queryStatsError}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid gap-3 md:grid-cols-4">
          <MetricCard
            icon={BarChart3}
            label="Erfasste Calls"
            value={formatNumber(totalCalls)}
          />
          <MetricCard
            icon={Timer}
            label="DB-Zeit Top 30"
            value={formatMs(totalDbTime)}
          />
          <MetricCard
            icon={Database}
            label="Shared Reads"
            value={formatNumber(totalReads)}
          />
          <MetricCard
            icon={Activity}
            label="Aktive Queries"
            value={formatNumber(activeCount)}
          />
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-primary" />
              Teuerste Queries
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Calls</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Mean</TableHead>
                  <TableHead>Max</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Reads</TableHead>
                  <TableHead>Temp</TableHead>
                  <TableHead>Query</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queryStats.map((stat) => (
                  <TableRow key={stat.queryid ?? stat.query}>
                    <TableCell>{formatNumber(stat.calls)}</TableCell>
                    <TableCell>{formatMs(stat.total_exec_time)}</TableCell>
                    <TableCell>{formatMs(stat.mean_exec_time)}</TableCell>
                    <TableCell>{formatMs(stat.max_exec_time)}</TableCell>
                    <TableCell>{formatNumber(stat.rows)}</TableCell>
                    <TableCell>{formatNumber(stat.shared_blks_read)}</TableCell>
                    <TableCell>
                      {formatNumber(
                        toNumber(stat.temp_blks_read) + toNumber(stat.temp_blks_written)
                      )}
                    </TableCell>
                    <TableCell className="max-w-[560px] whitespace-normal font-mono text-xs leading-5">
                      {stat.query}
                    </TableCell>
                  </TableRow>
                ))}
                {queryStats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-muted-foreground">
                      Keine Query-Statistiken verfügbar.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Aktive Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Wait</TableHead>
                    <TableHead>Dauer</TableHead>
                    <TableHead>Query</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeQueries.map((query) => (
                    <TableRow key={query.pid}>
                      <TableCell>{query.pid}</TableCell>
                      <TableCell>{query.state ?? "-"}</TableCell>
                      <TableCell>
                        {[query.wait_event_type, query.wait_event]
                          .filter(Boolean)
                          .join(" / ") || "-"}
                      </TableCell>
                      <TableCell>{query.duration ?? "-"}</TableCell>
                      <TableCell className="max-w-[420px] whitespace-normal font-mono text-xs leading-5">
                        {query.query}
                      </TableCell>
                    </TableRow>
                  ))}
                  {activeQueries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-muted-foreground">
                        Keine aktiven Sessions.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                Größte Tabellen
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tabelle</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Index</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Scans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relationStats.map((stat) => (
                    <TableRow key={stat.relname}>
                      <TableCell className="font-medium">{stat.relname}</TableCell>
                      <TableCell>{formatBytes(stat.total_size)}</TableCell>
                      <TableCell>{formatBytes(stat.table_size)}</TableCell>
                      <TableCell>{formatBytes(stat.index_size)}</TableCell>
                      <TableCell>{formatNumber(stat.n_live_tup)}</TableCell>
                      <TableCell>
                        {formatNumber(stat.seq_scan)} / {formatNumber(stat.idx_scan)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardContent className="flex gap-3 px-5 py-4 text-sm text-muted-foreground">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Zugriff: <code>/debug/db?token=...</code>. Der Token kommt aus
              <code className="mx-1 rounded bg-muted px-1.5 py-0.5">DEBUG_SECRET</code>
              oder fallbackweise aus
              <code className="mx-1 rounded bg-muted px-1.5 py-0.5">CRON_SECRET</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {label}
          </p>
          <p className="truncate text-lg font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
