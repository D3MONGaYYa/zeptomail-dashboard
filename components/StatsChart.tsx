"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { getEventMeta } from "@/lib/eventParser";

const HEX: Record<string, string> = {
  amber: "#E8A33D",
  red: "#E5646B",
  green: "#4FBF83",
  blue: "#5B9BD8",
  violet: "#9B8CF2",
  muted: "#8B92A0",
  faint: "#5B6270",
};

export interface TimeseriesPoint {
  day: string;
  [eventName: string]: string | number;
}

export default function StatsChart({
  timeseries,
  eventNames,
}: {
  timeseries: TimeseriesPoint[];
  eventNames: string[];
}) {
  if (timeseries.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-card border border-line bg-panel text-sm text-faint">
        No events yet in this window.
      </div>
    );
  }

  return (
    <div className="h-72 rounded-card border border-line bg-panel p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={timeseries} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#232830" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#8B92A0", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#232830" }}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis tick={{ fill: "#8B92A0", fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "#14171C",
              border: "1px solid #232830",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#E6E8EB" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#8B92A0" }}
            formatter={(value: string) => getEventMeta(value).label}
          />
          {eventNames.map((name) => (
            <Bar
              key={name}
              dataKey={name}
              stackId="events"
              fill={HEX[getEventMeta(name).color] ?? HEX.muted}
              radius={0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
