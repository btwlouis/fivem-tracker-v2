"use client";

import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { colorMap } from "@/lib/utils";

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

export const columns: ColumnDef<ServerListItem>[] = [
  {
    accessorKey: "projectName",
    header: "Project Name",
    cell: ({ row }) => {
      const formattedProjectName =
        row?.original?.projectName?.replace(
          /\^(\d)/g,
          (_, code: string) =>
            `<span style='color: ${colorMap[`^${code}`] || "inherit"}'>`
        ) + "</span>";

      return (
        <div className="flex items-center space-x-2">
          <Image
            src={`https://servers-frontend.fivem.net/api/servers/icon/${row.original.id}/${row.original.iconVersion}.png`}
            width={32}
            height={32}
            loading="lazy"
            alt="Icon"
          />
          <div
            className="truncate"
            dangerouslySetInnerHTML={{ __html: formattedProjectName }}
          />
          <div className="truncate w-96 opacity-70">
            {row.original.projectDescription}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "localeCountry",
    header: "Country",
    cell: ({ row }) => {
      const localeCountry = row.original.localeCountry || "us";

      return (
        <>
          {/* <Flag code={localeCountry} /> */}

          <span className="ml-2">{localeCountry}</span>
        </>
      );
    },
  },
  {
    accessorKey: "playersCurrent",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Players
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: (data) => {
      return (
        <div className="flex items-center space-x-2">
          <span>{data.row.original.playersCurrent}</span>
          <span>/</span>
          <span>{data.row.original.playersMax}</span>
        </div>
      );
    },
  },
];
