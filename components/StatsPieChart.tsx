"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
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

export default function StatsPieChart({
  data,
}: {
  data: { name: string; count: number }[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-card border border-line bg-panel text-sm text-faint">
        No events yet.
      </div>
    );
  }

  return (
    <div className="h-72 rounded-card border border-line bg-panel p-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            innerRadius={40}
            stroke="#14171C"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell
                key={entry.name}
                fill={HEX[getEventMeta(entry.name).color] ?? HEX.muted}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#14171C",
              border: "1px solid #232830",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "#E6E8EB" }}
            formatter={(value: number, name: string) => [
              value.toLocaleString(),
              getEventMeta(name).label,
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#8B92A0" }}
            formatter={(value: string) => getEventMeta(value).label}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
