"use client";

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from "recharts";
import type { TreesDatum } from "../../lib/ward-report-data";

type TreesChartProps = {
  data: TreesDatum[];
};

export function TreesChart({ data }: TreesChartProps) {
  return (
    <div className="h-64 w-full print:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 24, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#ece0c0" />
          <XAxis
            dataKey="period"
            tickLine={false}
            axisLine={{ stroke: "#e2d1a3" }}
            tick={{ fill: "#293f5e", fontSize: 12 }}
          />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#293f5e", fontSize: 12 }} width={40} />
          <Bar dataKey="trees" fill="#0b1626" radius={[6, 6, 0, 0]} isAnimationActive={false}>
            <LabelList dataKey="trees" position="top" fill="#0b1626" fontSize={13} fontWeight={700} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
