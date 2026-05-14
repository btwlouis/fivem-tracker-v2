"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Sun, Users, Trophy, Server } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CircleFlag } from "react-circle-flags";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompactNumber } from "@/lib/utils";
import { useTranslation, type Locale } from "@/lib/i18n";
import { useTheme } from "@/components/theme-provider";

type Stats = {
  totalPlayers: number;
  totalRecord: number;
  totalServers: number;
};

function StatPill({
  label,
  value,
  Icon,
  variant = "pill",
}: {
  label: string;
  value: string | null;
  Icon: typeof Users;
  variant?: "pill" | "card";
}) {
  return (
    <div
      className={
        variant === "card"
          ? "min-w-0 rounded-xl border border-border/70 bg-card/80 px-3 py-2 shadow-xs backdrop-blur"
          : "min-w-[8.75rem] rounded-full border border-border/70 bg-card/80 px-3 py-2 shadow-xs backdrop-blur"
      }
    >
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-[10px] sm:tracking-[0.18em]">
            {label}
          </p>
          {value ? (
            <p className="text-sm font-semibold tabular-nums text-foreground">
              {value}
            </p>
          ) : (
            <Skeleton className="mt-1 h-4 w-14" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const { resolvedTheme, setTheme } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const { t, locale, setLocale } = useTranslation();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const update = () => {
      if (headerRef.current) {
        document.documentElement.style.setProperty(
          "--header-height",
          `${headerRef.current.offsetHeight}px`
        );
      }
    };
    update();
    const observer = new ResizeObserver(update);
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data as Stats))
      .catch(() => {});
  }, []);

  const otherLocale: Locale = locale === "de" ? "en" : "de";

  return (
    <header
      ref={headerRef}
      className="shrink-0 border-b border-border/70 bg-background/85 backdrop-blur-xl"
    >
      <div className="container mx-auto flex w-full flex-col gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex w-full items-center gap-3">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-primary text-primary-foreground shadow-xs">
              <Image
                src="/icon_white_transparent.png"
                alt="FiveM Tracker"
                width={18}
                height={18}
                className="h-[18px] w-[18px]"
                priority
              />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight">
                {t("nav.title")}
              </span>
              {/* <span className="block text-[11px] text-muted-foreground">
                {t("nav.subtitle")}
              </span> */}
            </div>
          </Link>

          <div className="hidden flex-1 flex-wrap items-center justify-center gap-2 md:flex">
            <StatPill
              label={t("stats.playersOnline")}
              value={stats ? formatCompactNumber(stats.totalPlayers) : null}
              Icon={Users}
            />
            <StatPill
              label={t("stats.record")}
              value={stats ? formatCompactNumber(stats.totalRecord) : null}
              Icon={Trophy}
            />
            <StatPill
              label={t("stats.servers")}
              value={stats ? formatCompactNumber(stats.totalServers) : null}
              Icon={Server}
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-border/70 bg-card/80 p-1 shadow-xs backdrop-blur">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setLocale(otherLocale)}
            >
              <CircleFlag
                countryCode={locale === "de" ? "de" : "gb"}
                height={14}
                width={14}
                className="shrink-0"
              />
              {locale.toUpperCase()}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-8 w-8 rounded-full"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              aria-label={t("nav.toggleTheme")}
            >
              <Sun className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 md:hidden">
          <StatPill
            label={t("stats.playersOnline")}
            value={stats ? formatCompactNumber(stats.totalPlayers) : null}
            Icon={Users}
            variant="card"
          />
          <StatPill
            label={t("stats.record")}
            value={stats ? formatCompactNumber(stats.totalRecord) : null}
            Icon={Trophy}
            variant="card"
          />
          <StatPill
            label={t("stats.servers")}
            value={stats ? formatCompactNumber(stats.totalServers) : null}
            Icon={Server}
            variant="card"
          />
        </div>
      </div>
    </header>
  );
}
