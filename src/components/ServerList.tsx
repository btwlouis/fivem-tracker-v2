"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerColumns } from "@/components/list/servers/columns";
import { DataTable } from "@/components/list/servers/data-table";
import { useTranslation } from "@/lib/i18n";
import type { ServerListResponse, SortOption } from "@/lib/server-list-types";

const PAGE_SIZE = 30;
const ALL_COUNTRIES = "all";

function ServerListSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/85 shadow-xl backdrop-blur">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-4 py-3">
          <Skeleton className="h-10 w-56 rounded-full" />
          <Skeleton className="h-10 w-52 rounded-full" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 border-b border-border/40 px-4 py-3 last:border-0"
            >
              <Skeleton className="h-4 w-6 shrink-0" />
              <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
              <div className="min-w-0 flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-60" />
              </div>
              <Skeleton className="hidden h-5 w-14 sm:block" />
              <Skeleton className="h-5 w-10" />
              <Skeleton className="h-5 w-6" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type ServerListProps = {
  initialData?: ServerListResponse;
};

export default function ServerList({ initialData }: ServerListProps) {
  const { t } = useTranslation();
  const columns = getServerColumns(t);
  const [serverData, setServerData] = useState<ServerListResponse | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("players");
  const [countryFilter, setCountryFilter] = useState(ALL_COUNTRIES);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const latestRequestRef = useRef(0);
  const prevSortRef = useRef<SortOption>("players");
  const prevCountryRef = useRef(ALL_COUNTRIES);
  const hasLoadedDataRef = useRef(Boolean(initialData));
  const skipInitialFetchRef = useRef(Boolean(initialData));

  const fetchServers = useCallback(
    async ({
      page,
      search,
      sort,
      country,
      append,
    }: {
      page: number;
      search: string;
      sort: SortOption;
      country: string;
      append: boolean;
    }) => {
      const requestId = latestRequestRef.current + 1;
      latestRequestRef.current = requestId;

      try {
        if (append) {
          setIsFetchingMore(true);
        } else if (hasLoadedDataRef.current) {
          setIsRefreshing(true);
          setIsSearching(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: PAGE_SIZE.toString(),
          sort,
        });
        if (search.trim()) params.set("search", search.trim());
        if (country !== ALL_COUNTRIES) params.set("locale", country);

        const response = await fetch(`/api/servers/list?${params.toString()}`, {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Failed to fetch servers");

        const data = (await response.json()) as ServerListResponse;
        if (latestRequestRef.current !== requestId) return;

        hasLoadedDataRef.current = true;
        setActiveSearchQuery(search);
        setServerData((current) => {
          if (!append || !current) return data;
          const seen = new Set(current.servers.map((s) => s.id));
          return {
            ...data,
            servers: [
              ...current.servers,
              ...data.servers.filter((s) => !seen.has(s.id)),
            ],
          };
        });
      } catch (err) {
        if (latestRequestRef.current !== requestId) return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (latestRequestRef.current !== requestId) return;
        setLoading(false);
        setIsRefreshing(false);
        setIsSearching(false);
        setIsFetchingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (skipInitialFetchRef.current) {
      skipInitialFetchRef.current = false;
      return;
    }

    const sortChanged = prevSortRef.current !== sortBy;
    const countryChanged = prevCountryRef.current !== countryFilter;
    prevSortRef.current = sortBy;
    prevCountryRef.current = countryFilter;

    if (sortChanged || countryChanged) {
      fetchServers({
        page: 1,
        search: searchQuery,
        sort: sortBy,
        country: countryFilter,
        append: false,
      });
      return;
    }

    const timeoutId = window.setTimeout(() => {
      fetchServers({
        page: 1,
        search: searchQuery,
        sort: sortBy,
        country: countryFilter,
        append: false,
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [countryFilter, fetchServers, searchQuery, sortBy]);

  const loadNextPage = useCallback(() => {
    if (!serverData || loading || isSearching || isFetchingMore || !serverData.hasMore) return;
    fetchServers({
      page: serverData.currentPage + 1,
      search: activeSearchQuery,
      sort: sortBy,
      country: countryFilter,
      append: true,
    });
  }, [
    activeSearchQuery,
    countryFilter,
    fetchServers,
    isFetchingMore,
    isSearching,
    loading,
    serverData,
    sortBy,
  ]);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadNextPage();
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "300px 0px",
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadNextPage, serverData?.servers.length]);

  if (loading) {
    return (
      <div className="flex min-h-0 flex-1">
        <ServerListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4">
        <p className="text-sm text-destructive">{t("table.errorLoading")}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            fetchServers({
              page: 1,
              search: activeSearchQuery,
              sort: sortBy,
              country: countryFilter,
              append: false,
            })
          }
        >
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          {t("table.retry")}
        </Button>
      </div>
    );
  }

  if (!serverData) return null;

  return (
    <div className="flex min-h-0 w-full flex-1">
      <DataTable
        columns={columns}
        data={serverData.servers}
        totalCount={serverData.totalCount}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        isSearching={isSearching}
        isRefreshing={isRefreshing}
        isFetchingMore={isFetchingMore}
        hasMore={serverData.hasMore}
        scrollContainerRef={scrollContainerRef}
        loadMoreRef={loadMoreRef}
        sortBy={sortBy}
        onSortChange={setSortBy}
        countries={serverData.countries}
        countryFilter={countryFilter}
        onCountryChange={setCountryFilter}
      />
    </div>
  );
}
