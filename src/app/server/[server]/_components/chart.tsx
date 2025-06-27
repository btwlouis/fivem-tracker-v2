"use client";

import { CartesianGrid, Line, LineChart, XAxis } from "recharts";

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
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const chartConfig = {
  clients: {
    label: "Players",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface TimeRanges {
  timeRanges: ["1h", "1d", "7d", "1m"];
}

const timeRanges: TimeRanges["timeRanges"] = ["1h", "1d", "7d", "1m"];

const convertToChartData = (
  rawData: ServerHistory[],
  range: TimeRanges["timeRanges"][number]
) => {
  const filteredData = rawData.filter((item) => {
    const now = new Date();
    const createdAt = new Date(item.timestamp);
    const diffTime = now.getTime() - createdAt.getTime();

    switch (range) {
      case "1h":
        return diffTime <= 60 * 60 * 1000; // 1 hour
      case "1d":
        return diffTime <= 24 * 60 * 60 * 1000; // 1 day
      case "7d":
        return diffTime <= 7 * 24 * 60 * 60 * 1000; // 7 days
      case "1m":
        return diffTime <= 30 * 24 * 60 * 60 * 1000; // 1 month
      default:
        return diffTime <= 60 * 60 * 1000; // 1 hour
    }
  });

  return filteredData
    .map((item) => {
      const dateObj = new Date(item.timestamp);
      let formattedTimestamp = dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      switch(range) {
        case "1h":
          formattedTimestamp = dateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          break;
        case "1d":
          formattedTimestamp = dateObj.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          break;
        case "7d":
          formattedTimestamp = dateObj.toLocaleDateString([], {
            hour: "2-digit",
            month: "short",
            day: "2-digit",
          });
          break;
        case "1m":
          formattedTimestamp = dateObj.toLocaleDateString([], {
            month: "short",
            day: "2-digit",
          });
          break;
      }

      return {
        timestamp: formattedTimestamp,
        clients: item.clients,
      };
    })
    .reverse();
};

interface ChartDataPoint {
  timestamp: string;
  clients: number;
}

export function Chart({ serverId }: { serverId: string }) {
  const [range, setRange] = useState<TimeRanges["timeRanges"][number]>("1h");
const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [rawData, setRawData] = useState<ServerHistory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/server-history/${serverId}`, {
        next: { revalidate: 60 },
      });
      console.log("Fetching server history data for:", serverId);
      const data: ServerHistory[] = await res.json();
      setRawData(data);
      setChartData(convertToChartData(data, range));
    };

    fetchData();
  }, [serverId]);

  const handleTimeRangeChange = (newRange: string) => {
    const selected = newRange as TimeRanges["timeRanges"][number];
    setRange(selected);
    setChartData(convertToChartData(rawData, selected));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Activity</CardTitle>
        <CardDescription>Last recorded player counts</CardDescription>
      </CardHeader>

      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2">
          {timeRanges.map((item) => (
            <Button
              key={item}
              onClick={() => handleTimeRangeChange(item)}
              variant={range === item ? "default" : "secondary"}
            >
              {item}
            </Button>
          ))}
        </div>
      </CardFooter>

      <CardContent>
        <ChartContainer config={chartConfig} className="max-h-[300px] w-full">
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Line
              dataKey="clients"
              type="natural"
              stroke="var(--color-clients)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

