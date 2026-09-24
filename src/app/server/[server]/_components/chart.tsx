"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
    label: "Spieler",
    theme: {
      light: "var(--primary)",
      dark: "var(--chart-2)",
    },
  },
} satisfies ChartConfig;

const timeRanges = ["1h", "1d", "7d", "1m"] as const;
type TimeRange = (typeof timeRanges)[number];

function convertToChartData(rawData: ServerHistory[]) {
  return rawData
    .map((item) => ({
      time: new Date(item.timestamp).getTime(),
      clients: item.clients,
    }))
    .sort((a, b) => a.time - b.time);
}

function formatAxisTime(value: number, range: TimeRange) {
  const date = new Date(value);
  return range === "7d" || range === "1m"
    ? date.toLocaleDateString("de-DE", { month: "short", day: "2-digit" })
    : date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function formatTooltipTime(value: number) {
  if (!Number.isFinite(value)) return "";
  return new Date(value).toLocaleString("de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Chart({ serverId }: { serverId: string }) {
  const [range, setRange] = useState<TimeRange>("1d");
  const [rawData, setRawData] = useState<ServerHistory[]>([]);
  const [hoverPosition, setHoverPosition] = useState<{
    x: number;
    tooltipX: number;
    tooltipY: number;
  } | null>(null);
  const chartData = useMemo(() => convertToChartData(rawData), [rawData]);

  const peakPlayers =
    chartData.length > 0
      ? Math.max(...chartData.map((entry) => entry.clients))
      : 0;
  const latestPlayers =
    chartData.length > 0 ? chartData[chartData.length - 1]?.clients || 0 : 0;

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/server-history/${serverId}?range=${range}`,
          {
            signal: controller.signal,
          }
        );
        if (!response.ok) throw new Error("Failed to load server history");

        const data: ServerHistory[] = await response.json();
        setRawData(data);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load server history:", error);
          setRawData([]);
        }
      }
    };

    fetchData();
    return () => controller.abort();
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
              Zeitverlauf der Spielerzahlen für diesen Server mit direkter,
              indexierbarer Darstellung.
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
              onClick={() => {
                if (range === item) return;
                setRange(item);
                setRawData([]);
                setHoverPosition(null);
              }}
              variant={range === item ? "default" : "outline"}
              className="min-w-12"
            >
              {item}
            </Button>
          ))}
        </div>
      </CardFooter>

      <CardContent className="p-4 sm:p-5">
        <div className="relative">
          <ChartContainer
            config={chartConfig}
            className="relative h-[380px] w-full max-w-none [&_.recharts-cartesian-grid_line]:stroke-border/70 [&_.recharts-curve.recharts-reference-line-line]:stroke-muted-foreground/40 [&_.recharts-text]:fill-muted-foreground"
            onMouseMove={(event) => {
              const bounds = event.currentTarget.getBoundingClientRect();
              const x = event.clientX - bounds.left;
              const y = event.clientY - bounds.top;
              setHoverPosition({
                x,
                tooltipX:
                  x + 170 > bounds.width ? Math.max(0, x - 170) : x + 12,
                tooltipY: y + 80 > bounds.height ? Math.max(0, y - 80) : y + 12,
              });
            }}
            onMouseLeave={() => setHoverPosition(null)}
          >
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{ left: 8, right: 8, top: 12, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={`playersArea-${serverId}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="var(--color-clients)"
                    stopOpacity={0.28}
                  />
                  <stop
                    offset="65%"
                    stopColor="var(--color-clients)"
                    stopOpacity={0.1}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-clients)"
                    stopOpacity={0}
                  />
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
                dataKey="time"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(value: number) => formatAxisTime(value, range)}
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
                cursor={false}
                isAnimationActive={false}
                position={
                  hoverPosition
                    ? { x: hoverPosition.tooltipX, y: hoverPosition.tooltipY }
                    : undefined
                }
                content={
                  <ChartTooltipContent
                    className="shadow-lg"
                    labelFormatter={(_, payload) =>
                      formatTooltipTime(Number(payload?.[0]?.payload?.time))
                    }
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="clients"
                fill={`url(#playersArea-${serverId})`}
                stroke="var(--color-clients)"
                strokeWidth={2.5}
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
          {hoverPosition && chartData.length > 0 ? (
            <div
              className="pointer-events-none absolute bottom-8 top-3 border-l border-dashed border-primary/60"
              style={{ left: hoverPosition.x }}
            />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
