"use client";
import * as React from "react";

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
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
import { Server } from "@prisma/client";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  searchQuery?: string;
  onSearch?: (value: string) => void;
  isSearching?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  totalCount,
  currentPage,
  totalPages,
  searchQuery = "",
  onSearch,
  isSearching = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    manualPagination: true,
    manualFiltering: true, // We handle filtering server-side
    pageCount: totalPages,
  });

  const redirectServer = (server: Server) => {
    window.location.href = `/server/${server.id}`;
  };

  const handlePageChange = (newPage: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', newPage.toString());
    window.history.pushState({}, '', url.toString());
    // Trigger a custom event so our ServerList component can listen for page changes
    window.dispatchEvent(new CustomEvent('pageChange', { detail: { page: newPage } }));
  };

  return (
    <div>
      <div className="flex items-center py-4">
        <div className="relative max-w-full">
          <Input
            placeholder="Search servers..."
            value={searchQuery}
            onChange={(event) => onSearch?.(event.target.value)}
            className="max-w-full"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:cursor-pointer"
                  onClick={() => redirectServer(row.original as Server)}
                  data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {data.length} of {totalCount} results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
