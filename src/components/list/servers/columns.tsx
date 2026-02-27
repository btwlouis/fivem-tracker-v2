"use client";

import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { colorMap, formatRelativeDate, stripFivemFormatting } from "@/lib/utils";

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

export const columns: ColumnDef<ServerListItem>[] = [
  {
    accessorKey: "projectName",
    header: "Server",
    cell: ({ row }) => {
      const formattedProjectName =
        row.original.projectName?.replace(
          /\^(\d)/g,
          (_, code: string) =>
            `<span style='color: ${colorMap[`^${code}`] || "inherit"}'>`
        ) + "</span>";

      return (
        <div className="flex items-center gap-3">
          <Image
            src={`https://servers-frontend.fivem.net/api/servers/icon/${row.original.id}/${row.original.iconVersion}.png`}
            width={36}
            height={36}
            loading="lazy"
            alt="Server icon"
            className="rounded-lg"
          />
          <div className="min-w-0">
            <div
              className="truncate font-medium"
              dangerouslySetInnerHTML={{ __html: formattedProjectName }}
            />
            <div className="truncate text-sm text-muted-foreground">
              {stripFivemFormatting(row.original.projectDescription) ||
                "No description available."}
            </div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "localeCountry",
    header: "Country",
    cell: ({ row }) => (
      <div className="space-y-1">
        <div>{row.original.localeCountry}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.mapname || "Unknown map"}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "playersCurrent",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Players
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span>{row.original.playersCurrent}</span>
        <span>/</span>
        <span>{row.original.playersMax}</span>
      </div>
    ),
  },
  {
    accessorKey: "updated_at",
    header: "Updated",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {formatRelativeDate(row.original.updated_at)}
      </div>
    ),
  },
];
