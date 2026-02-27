"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
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
    label: "Players",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

const timeRanges = ["1h", "1d", "7d", "1m"] as const;
type TimeRange = (typeof timeRanges)[number];

function convertToChartData(rawData: ServerHistory[], range: TimeRange) {
  const filteredData = rawData.filter((item) => {
    const diffTime = Date.now() - new Date(item.timestamp).getTime();

    switch (range) {
      case "1h":
        return diffTime <= 60 * 60 * 1000;
      case "1d":
        return diffTime <= 24 * 60 * 60 * 1000;
      case "7d":
        return diffTime <= 7 * 24 * 60 * 60 * 1000;
      case "1m":
        return diffTime <= 30 * 24 * 60 * 60 * 1000;
    }
  });

  return filteredData
    .map((item) => {
      const date = new Date(item.timestamp);

      return {
        timestamp:
          range === "7d" || range === "1m"
            ? date.toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
              })
            : date.toLocaleTimeString("en-US", {
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
  const [chartData, setChartData] = useState<Array<{ timestamp: string; clients: number }>>([]);
  const [rawData, setRawData] = useState<ServerHistory[]>([]);

  const peakPlayers =
    chartData.length > 0
      ? Math.max(...chartData.map((entry) => entry.clients))
      : 0;
  const latestPlayers =
    chartData.length > 0 ? chartData[chartData.length - 1]?.clients || 0 : 0;

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch(`/api/server-history/${serverId}`, {
        cache: "no-store",
      });

      const data: ServerHistory[] = await response.json();
      setRawData(data);
      setChartData(convertToChartData(data, range));
    };

    fetchData();
  }, [range, serverId]);

  useEffect(() => {
    setChartData(convertToChartData(rawData, range));
  }, [range, rawData]);

  return (
    <Card className="overflow-hidden rounded-3xl border border-sky-500/15 bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))] shadow-2xl shadow-sky-950/25">
      <CardHeader className="relative overflow-hidden border-b border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_32%),linear-gradient(180deg,rgba(30,41,59,0.55),transparent)]">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-slate-50">
              <Activity className="h-5 w-5 text-sky-300" />
              Player history
            </CardTitle>
            <CardDescription className="mt-2 text-slate-300">
              Recorded player counts for this server with a smoother live view.
            </CardDescription>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-sky-400/15 bg-white/[0.04] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <TrendingUp className="h-3.5 w-3.5 text-sky-300" />
                Peak
              </div>
              <p className="mt-2 text-xl font-semibold text-slate-50">
                {peakPlayers}
              </p>
            </div>
            <div className="rounded-2xl border border-sky-400/15 bg-white/[0.04] px-4 py-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                Latest
              </div>
              <p className="mt-2 text-xl font-semibold text-slate-50">
                {latestPlayers}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardFooter className="flex-col items-start gap-3 border-b border-white/5 bg-black/10 text-sm">
        <div className="flex flex-wrap gap-2">
          {timeRanges.map((item) => (
            <Button
              key={item}
              onClick={() => setRange(item)}
              variant={range === item ? "default" : "secondary"}
              className={
                range === item
                  ? "border border-sky-300/30 bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-950/25"
                  : "border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-slate-50"
              }
            >
              {item}
            </Button>
          ))}
        </div>
      </CardFooter>

      <CardContent className="p-4 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="h-[380px] w-full max-w-none [&_.recharts-cartesian-grid_line]:stroke-sky-400/10 [&_.recharts-text]:fill-slate-400"
        >
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 8, right: 8, top: 12, bottom: 0 }}
          >
            <defs>
              <linearGradient id="playersArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-clients)" stopOpacity={0.55} />
                <stop offset="65%" stopColor="var(--color-clients)" stopOpacity={0.12} />
                <stop offset="100%" stopColor="var(--color-clients)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="playersStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#2563eb" />
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
                stroke="rgba(125,211,252,0.28)"
                strokeDasharray="4 4"
              />
            ) : null}
            <ChartTooltip
              cursor={{
                stroke: "rgba(56,189,248,0.35)",
                strokeWidth: 1,
                strokeDasharray: "3 3",
              }}
              content={
                <ChartTooltipContent className="border-sky-400/20 bg-slate-950/95 text-slate-50 shadow-2xl shadow-sky-950/30" />
              }
            />
            <Area
              type="monotone"
              dataKey="clients"
              fill="url(#playersArea)"
              stroke="none"
              animationDuration={700}
              animationEasing="ease-out"
            />
            <Line
              dataKey="clients"
              type="monotone"
              stroke="url(#playersStroke)"
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: "#f8fafc",
                stroke: "#38bdf8",
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
