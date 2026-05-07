"use client";

import { ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { CircleFlag } from "react-circle-flags";

import { Badge } from "@/components/ui/badge";
import type { ServerListItem } from "@/lib/server-list-types";
import { colorMap, formatCompactNumber, parseServerTags, stripFivemFormatting } from "@/lib/utils";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatFivemName(name: string | null): string {
  if (!name) return "";
  const parts = name.split(/(\^\d)/);
  let html = "";
  let open = false;
  for (const part of parts) {
    if (/^\^\d$/.test(part)) {
      if (open) html += "</span>";
      html += `<span style="color:${colorMap[part] ?? "inherit"}">`;
      open = true;
    } else {
      html += escapeHtml(part);
    }
  }
  if (open) html += "</span>";
  return html || escapeHtml(name);
}

export function getServerColumns(
  t: (key: string, vars?: Record<string, string | number>) => string
): ColumnDef<ServerListItem>[] {
  return [
    {
      id: "server",
      accessorKey: "projectName",
      header: t("table.server"),
      cell: ({ row }) => {
        const { id, iconVersion, rank, projectName, projectDescription } = row.original;
        const formattedName = formatFivemName(projectName);
        const description = stripFivemFormatting(projectDescription);

        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
              {rank}
            </span>
            <Image
              src={
                iconVersion
                  ? `https://servers-frontend.fivem.net/api/servers/icon/${id}/${iconVersion}.png`
                  : `https://placehold.co/28x28/1a1a2e/4a90d9?text=FV`
              }
              width={28}
              height={28}
              loading="lazy"
              sizes="28px"
              alt={t("table.serverIcon")}
              className="h-7 w-7 shrink-0 rounded-md object-cover"
            />
            <div className="min-w-0">
              <Link
                href={`/server/${id}`}
                className="block truncate text-sm font-medium leading-tight transition-colors hover:text-primary"
                dangerouslySetInnerHTML={{ __html: formattedName }}
              />
              <div className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground">
                {description || t("table.noDescription")}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "tags",
      accessorKey: "tags",
      header: t("table.tags"),
      cell: ({ row }) => {
        const tags = parseServerTags(row.original.tags).slice(0, 3);
        if (!tags.length) return null;
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag: string) => (
              <Badge
                key={tag}
                variant="secondary"
                className="h-5 px-1.5 text-[10px] font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "record",
      accessorKey: "record",
      header: t("table.record"),
      cell: ({ row }) => (
        <div className="flex items-center gap-1 tabular-nums text-xs sm:text-sm">
          <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span>{formatCompactNumber(row.original.record)}</span>
        </div>
      ),
    },
    {
      id: "country",
      accessorKey: "localeCountry",
      header: t("table.country"),
      cell: ({ row }) => {
        const code = row.original.localeCountry?.toLowerCase() ?? "";
        return (
          <div className="flex items-center gap-1.5">
            <CircleFlag countryCode={code} height={16} width={16} />
            <span className="text-[11px] uppercase text-muted-foreground">
              {row.original.localeCountry}
            </span>
          </div>
        );
      },
    },
    {
      id: "players",
      accessorKey: "playersCurrent",
      header: t("table.players"),
      cell: ({ row }) => (
        <div className="text-right text-xs tabular-nums sm:text-sm">
          <span className="font-medium">{row.original.playersCurrent ?? 0}</span>
          <span className="text-muted-foreground">/{row.original.playersMax ?? 0}</span>
        </div>
      ),
    },
  ];
}
