"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { Activity, Sparkles, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ServerHistory } from "@prisma/client";

const chartConfig = {
  clients: {
    label: "Spieler",
    theme: {
      light: "var(--primary)",
      dark: "var(--chart-2)",
    },
  },
} satisfies ChartConfig;

const timeRanges = ["1h", "1d", "7d", "1m"] as const;
type TimeRange = (typeof timeRanges)[number];

function convertToChartData(rawData: ServerHistory[], range: TimeRange) {
  return rawData
    .map((item) => {
      const date = new Date(item.timestamp);

      return {
        timestamp:
          range === "7d" || range === "1m"
            ? date.toLocaleDateString("de-DE", {
                month: "short",
                day: "2-digit",
              })
            : date.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              }),
        clients: item.clients,
      };
    })
    .reverse();
}

export function Chart({ serverId }: { serverId: string }) {
  const [range, setRange] = useState<TimeRange>("1d");
  const [rawData, setRawData] = useState<ServerHistory[]>([]);
  const chartData = useMemo(
    () => convertToChartData(rawData, range),
    [range, rawData]
  );

  const peakPlayers =
    chartData.length > 0
      ? Math.max(...chartData.map((entry) => entry.clients))
      : 0;
  const latestPlayers =
    chartData.length > 0 ? chartData[chartData.length - 1]?.clients || 0 : 0;

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/server-history/${serverId}?range=${range}`);

      const data: ServerHistory[] = await response.json();
      setRawData(data);
    };

    fetchData();
  }, [range, serverId]);

  return (
    <Card className="w-full rounded-[1.75rem] border border-border/70 bg-card/85 py-0 shadow-xl backdrop-blur">
      <CardHeader className="gap-3 border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Spielerverlauf
            </CardTitle>
            <CardDescription className="mt-1 max-w-2xl">
              Zeitverlauf der Spielerzahlen für diesen Server mit direkter, indexierbarer Darstellung.
            </CardDescription>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Höchstwert
              </div>
              <p className="mt-1 text-xl font-semibold">{peakPlayers}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Aktuell
              </div>
              <p className="mt-1 text-xl font-semibold">{latestPlayers}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="flex-col items-start gap-3 border-b border-border/60 bg-background/40 px-5 py-3 text-sm sm:px-6">
        <div className="flex flex-wrap gap-2">
          {timeRanges.map((item) => (
            <Button
              key={item}
              onClick={() => setRange(item)}
              variant={range === item ? "default" : "outline"}
              className="min-w-12"
            >
              {item}
            </Button>
          ))}
        </div>
      </CardFooter>

      <CardContent className="p-4 sm:p-5">
        <ChartContainer
          config={chartConfig}
          className="h-[380px] w-full max-w-none [&_.recharts-cartesian-grid_line]:stroke-border/70 [&_.recharts-curve.recharts-reference-line-line]:stroke-muted-foreground/40 [&_.recharts-text]:fill-muted-foreground"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 8, right: 8, top: 12, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`playersArea-${serverId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-clients)" stopOpacity={0.28} />
                <stop offset="65%" stopColor="var(--color-clients)" stopOpacity={0.1} />
                <stop offset="100%" stopColor="var(--color-clients)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={34}
              allowDecimals={false}
            />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            {peakPlayers > 0 ? (
              <ReferenceLine
                y={peakPlayers}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                strokeOpacity={0.4}
              />
            ) : null}
            <ChartTooltip
              cursor={{
                stroke: "var(--primary)",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
              content={<ChartTooltipContent className="shadow-lg" />}
            />
            <Area
              type="monotone"
              dataKey="clients"
              fill={`url(#playersArea-${serverId})`}
              stroke="var(--color-clients)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{
                r: 6,
                fill: "var(--background)",
                stroke: "var(--color-clients)",
                strokeWidth: 3,
              }}
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
