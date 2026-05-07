"use client";

import * as React from "react";
import { Loader2, Search, Trophy, TrendingUp, Users } from "lucide-react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SortOption } from "@/lib/server-list-types";
import { useTranslation } from "@/lib/i18n";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount: number;
  searchQuery?: string;
  onSearch?: (value: string) => void;
  isSearching?: boolean;
  isRefreshing?: boolean;
  isFetchingMore?: boolean;
  hasMore?: boolean;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  loadMoreRef?: React.RefObject<HTMLDivElement | null>;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
}

const SORT_OPTIONS: { key: SortOption; Icon: typeof Users }[] = [
  { key: "players", Icon: Users },
  { key: "upvotes", Icon: TrendingUp },
  { key: "record", Icon: Trophy },
];

export function DataTable<TData, TValue>({
  columns,
  data,
  totalCount,
  searchQuery = "",
  onSearch,
  isSearching = false,
  isRefreshing = false,
  isFetchingMore = false,
  hasMore = false,
  scrollContainerRef,
  loadMoreRef,
  sortBy = "players",
  onSortChange,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const visibleColumnCount = Math.max(columns.length, 1);
  const skeletonRowCount = Math.min(Math.max(data.length, 8), 12);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const redirectServer = (server: TData) => {
    const candidate = server as { id?: string };
    if (candidate.id) {
      window.location.href = `/server/${candidate.id}`;
    }
  };

  return (
    <Card className="grid h-full min-h-0 w-full max-w-none flex-1 grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden rounded-[1.75rem] border-border/70 bg-card/85 py-0 shadow-xl backdrop-blur">
      {/* toolbar */}
      <div className="shrink-0 border-b border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/75 p-1">
            {SORT_OPTIONS.map(({ key, Icon }) => (
              <Button
                key={key}
                variant={sortBy === key ? "default" : "ghost"}
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                onClick={() => onSortChange?.(key)}
              >
                <Icon className="h-3.5 w-3.5" />
                {t(`sort.${key}`)}
              </Button>
            ))}
          </div>

          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("table.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => onSearch?.(e.target.value)}
              className="h-10 rounded-full border-border/70 bg-background/75 pl-9 pr-8 text-sm shadow-none"
            />
            {isSearching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* body */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="relative min-h-0 flex-1 overflow-auto overscroll-contain"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-transparent hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-9 border-b border-border/60 bg-background/95 px-2 py-2 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isRefreshing ? (
                Array.from({ length: skeletonRowCount }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`} className="border-b border-border/50">
                    <TableCell colSpan={visibleColumnCount} className="py-2.5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-6 shrink-0" />
                        <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
                        <div className="min-w-0 flex flex-1 flex-col gap-1">
                          <Skeleton className="h-3.5 w-36 max-w-[45%]" />
                          <Skeleton className="h-3 w-56 max-w-[65%]" />
                        </div>
                        <div className="ml-auto hidden items-center gap-2 md:flex">
                          <Skeleton className="h-5 w-12 rounded-full" />
                          <Skeleton className="h-5 w-14 rounded-full" />
                          <Skeleton className="h-4 w-12" />
                          <Skeleton className="h-5 w-6 rounded-full" />
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer border-b border-border/50 hover:bg-muted/25"
                    onClick={() => redirectServer(row.original)}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-2 py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumnCount}
                    className="h-20 text-center text-sm text-muted-foreground"
                  >
                    {t("table.noResults")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div ref={loadMoreRef} className="flex min-h-12 items-center justify-center px-4 py-3">
            {isFetchingMore ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("table.loadingMore")}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
          <span>{t("table.showing", { loaded: data.length, total: totalCount })}</span>
          <span>{hasMore ? "" : t("table.allLoaded")}</span>
        </div>
      </div>
    </Card>
  );
}
