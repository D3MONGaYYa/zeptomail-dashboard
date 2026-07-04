"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function DomainBarChart({
  data,
}: {
  data: { name: string; totalEvents: number; bounceEvents: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-card border border-line bg-panel text-sm text-faint">
        No domains yet.
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => b.totalEvents - a.totalEvents);

  return (
    <div className="h-72 rounded-card border border-line bg-panel p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke="#232830" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#8B92A0", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#232830" }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#8B92A0", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={140}
          />
          <Tooltip
            contentStyle={{
              background: "#14171C",
              border: "1px solid #232830",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#E6E8EB" }}
          />
          <Bar dataKey="totalEvents" fill="#5B9BD8" radius={[0, 3, 3, 0]} name="Total events" />
          <Bar dataKey="bounceEvents" fill="#E5646B" radius={[0, 3, 3, 0]} name="Bounced" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
