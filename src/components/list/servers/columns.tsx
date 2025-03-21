"use client";

import type { Server } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { colorMap } from "@/lib/utils";
import React, { useState } from 'react';

const ServerIcon: React.FC<{ id: string; iconVersion: string }> = ({ id, iconVersion }) => {
  const [imgSrc, setImgSrc] = useState(`https://servers-frontend.fivem.net/api/servers/icon/${id}/${iconVersion}.png`);

  return (
    <Image
      src={imgSrc}
      onError={() => {
        setImgSrc("/images/placeholder.jpeg");
      }}
      width={32}
      height={32}
      className="object-contain"
      alt="Server Icon"
    />
  );
};

export const columns: ColumnDef<Server>[] = [
  {
    accessorKey: "projectName",
    header: "Project Name",
    cell: ({row}) => {
      const formattedProjectName =
        row?.original?.projectName?.replace(
          /\^(\d)/g,
          (_, code: string) =>
            `<span style='color: ${colorMap[`^${code}`] || "inherit"}'>`
        ) + "</span>";
      
      return (
        <div className="flex items-center space-x-2">
          <ServerIcon id={row.original.id} iconVersion={row.original.iconVersion?.toString() || "default"} />
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
