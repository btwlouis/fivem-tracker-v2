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
import { useState } from "react";
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

export function Chart({ data }: { data: ServerHistory[] }) {
  const [range, setRange] = useState<TimeRanges["timeRanges"][number]>(
    timeRanges[0]
  );
  const [chartData, setChartData] = useState(convertToChartData(data, range));

  const handleTimeRangeChange = (newRange: string) => {
    const range = newRange as TimeRanges["timeRanges"][number];
    setRange(range);
    console.log(convertToChartData(data, range))
    setChartData(convertToChartData(data, range));
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
              variant={range === item ? "default" : "secondary"}>
              {item}
            </Button>
          ))}
        </div>
      </CardFooter>

      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("default", {
                  month: "short",
                  day: "2-digit",
                })
              }
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
