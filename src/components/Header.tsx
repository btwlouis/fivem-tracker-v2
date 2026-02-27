"use client";

import { useEffect, useState } from "react";
import { Activity, Globe2, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCompactNumber } from "@/lib/utils";

interface HeaderProps {
  localeCount: number;
  totalPlayers: number;
  totalServers: number;
}

export default function Header({
  localeCount,
  totalPlayers,
  totalServers,
}: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/95 shadow-2xl shadow-sky-950/20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_30%),linear-gradient(180deg,rgba(2,8,23,0.25),transparent)]" />
      <div className="relative space-y-8 p-6 sm:p-8 lg:p-10">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-sky-300">
              FiveM Tracker 
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                FiveM Tracker with player history
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                Browse active servers with player history of the last month. 
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
            className="border-sky-400/20 bg-background/60"
          >
            {!mounted ? (
              <div className="h-4 w-4" />
            ) : theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-sky-500/15 bg-slate-950/70 text-slate-50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-sky-500/15 p-3 text-sky-300">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Active servers</p>
                <p className="text-2xl font-semibold">
                  {formatCompactNumber(totalServers)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sky-500/15 bg-slate-950/70 text-slate-50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-sky-500/15 p-3 text-sky-300">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Players live</p>
                <p className="text-2xl font-semibold">
                  {formatCompactNumber(totalPlayers)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-sky-500/15 bg-slate-950/70 text-slate-50">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-sky-500/15 p-3 text-sky-300">
                <Globe2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-300">Visible regions</p>
                <p className="text-2xl font-semibold">
                  {formatCompactNumber(localeCount)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
