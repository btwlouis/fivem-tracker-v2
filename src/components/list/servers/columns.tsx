"use client";

import type { Server } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { Flag } from "@next-languages/flags";
import { Suspense } from "react";
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button";
import { colorMap } from "@/lib/utils";

export const columns: ColumnDef<Server>[] = [
  {
    accessorKey: "iconVersion",
    header: "",
    cell: (data) => {
      return (
        <Image
          src={`https://servers-frontend.fivem.net/api/servers/icon/${data.row.original.id}/${data.row.original.iconVersion}.png`}
          width={29}
          height={29}
          alt="server icon"
        />
      );
    },
  },
  {
    accessorKey: "projectName",
    header: "Project Name",
    cell: (data) => {
      
  
      const formattedProjectName = data?.row?.original?.projectName?.replace(
        /\^(\d)/g,
        (_, code: string) => `<span style='color: ${colorMap[`^${code}`] || "inherit"}'>`
      ) + "</span>";
  
      return (
        <div className="flex items-center space-x-2">
          <div className="truncate" dangerouslySetInnerHTML={{ __html: formattedProjectName }} />
          <div className="truncate w-96">
            {data.row.original.projectDescription}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "localeCountry",
    header: "Country",
    cell: (data) => {
      return (
        <Suspense fallback={<>...</>}>
          <Flag countryCode={data.row.original.localeCountry} className="w-6 h-6" />
        </Suspense>
      );
    },
  },
  {
    accessorKey: "playersCurrent",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Players
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: (data) => {
      return (
        <div className="flex items-center space-x-2">
          <span>{data.row.original.playersCurrent}</span>
          <span>/</span>
          <span>{data.row.original.playersMax}</span>
        </div>
      );
    }
  },
];
