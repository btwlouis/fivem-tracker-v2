"use client";

import { useCallback, useEffect, useState } from "react";

import { columns } from "@/components/list/servers/columns";
import { DataTable } from "@/components/list/servers/data-table";

type ServerListItem = {
  id: string;
  projectName: string | null;
  playersCurrent: number | null;
  playersMax: number | null;
  localeCountry: string;
  iconVersion: number | null;
  rank: number;
  projectDescription: string | null;
  mapname: string | null;
  gametype: string | null;
  updated_at: string;
};

type ServerData = {
  servers: ServerListItem[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
};

export default function ServerList() {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const fetchServers = useCallback(
    async (search?: string) => {
      try {
        const searchValue = search !== undefined ? search : searchQuery;

        if (searchValue.trim()) {
          setIsSearching(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const searchParams = new URLSearchParams(window.location.search);
        const currentPage = searchParams.get("page") || "1";

        const pageToUse =
          searchValue.trim() && searchValue !== "" ? "1" : currentPage;

        const queryParams = new URLSearchParams({
          page: pageToUse,
        });

        if (searchValue.trim()) {
          queryParams.set("search", searchValue.trim());
        }

        const response = await fetch(`/api/servers/list?${queryParams.toString()}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch servers");
        }

        const data = await response.json();
        setServerData(data);

        if (pageToUse !== currentPage && searchValue.trim()) {
          const url = new URL(window.location.href);
          url.searchParams.set("page", pageToUse);
          window.history.replaceState({}, "", url.toString());
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        console.error("Error fetching servers:", err);
      } finally {
        setLoading(false);
        setIsSearching(false);
      }
    },
    [searchQuery]
  );

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchServers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchServers]);

  const handleRetry = () => {
    fetchServers();
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  useEffect(() => {
    const handlePageChange = () => {
      fetchServers();
    };

    const handlePopState = () => {
      handlePageChange();
    };

    const handleCustomPageChange = () => {
      handlePageChange();
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("pageChange", handleCustomPageChange);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("pageChange", handleCustomPageChange);
    };
  }, [fetchServers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-border/70 bg-card/95 py-10">
        <div className="flex items-center space-x-3">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-sky-400" />
          <p className="text-slate-300">Loading servers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-red-500/30 bg-card/95 py-10">
        <div className="text-center">
          <p className="mb-3 text-red-400">Error loading servers: {error}</p>
          <button
            onClick={handleRetry}
            className="rounded-lg bg-sky-600 px-4 py-2 text-white transition-colors hover:bg-sky-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!serverData || serverData.servers.length === 0) {
    return (
      <p className="rounded-3xl border border-border/70 bg-card/95 py-10 text-center text-muted-foreground">
        No servers available.
      </p>
    );
  }

  return (
    <DataTable
      columns={columns}
      data={serverData.servers}
      totalCount={serverData.totalCount}
      currentPage={serverData.currentPage}
      totalPages={serverData.totalPages}
      searchQuery={searchQuery}
      onSearch={handleSearch}
      isSearching={isSearching}
    />
  );
}
