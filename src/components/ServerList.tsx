"use client";

import { useState, useEffect, useCallback } from "react";
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

  const fetchServers = useCallback(async (search?: string) => {
    try {
      const searchValue = search !== undefined ? search : searchQuery;
      
      // Set different loading states for initial load vs search
      if (searchValue.trim()) {
        setIsSearching(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const searchParams = new URLSearchParams(window.location.search);
      const currentPage = searchParams.get("page") || "1";
      const locale = searchParams.get("locale") || "DE";
      
      // If we're searching, reset to page 1
      const pageToUse = searchValue.trim() && searchValue !== "" ? "1" : currentPage;
      
      const queryParams = new URLSearchParams({
        locale: locale,
        page: pageToUse,
      });
      
      if (searchValue.trim()) {
        queryParams.set("search", searchValue.trim());
      }
      
      const response = await fetch(
        `/api/servers/list?${queryParams.toString()}`,
        {
          cache: "no-store",
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch servers");
      }
      
      const data = await response.json();
      setServerData(data);
      
      // Update URL without causing re-render, only if page changed due to search
      if (pageToUse !== currentPage && searchValue.trim()) {
        const url = new URL(window.location.href);
        url.searchParams.set('page', pageToUse);
        window.history.replaceState({}, '', url.toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching servers:", err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchServers();
    }, 300); // 300ms debounce - faster response

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
      // Force re-fetch when page changes via navigation
      fetchServers();
    };

    const handlePopState = () => {
      handlePageChange();
    };

    const handleCustomPageChange = () => {
      handlePageChange();
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('pageChange', handleCustomPageChange);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('pageChange', handleCustomPageChange);
    };
  }, [fetchServers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <p className="text-white">Loading servers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-red-400 mb-2">Error loading servers: {error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!serverData || serverData.servers.length === 0) {
    return <p className="text-white text-center py-8">No servers available.</p>;
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
