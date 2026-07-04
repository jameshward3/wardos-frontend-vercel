"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { SpendingSlice } from "../../lib/ward-report-data";

type SpendingChartProps = {
  data: SpendingSlice[];
};

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="h-56 w-56 shrink-0 print:h-48 print:w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="98%"
              paddingAngle={2}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((slice) => (
                <Cell key={slice.name} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value}%`, name]} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid w-full grid-cols-1 gap-2.5 sm:w-auto">
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2.5 text-sm text-navy-800">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: slice.color }}
              aria-hidden="true"
            />
            <span className="w-10 font-serif font-bold text-navy-900">{slice.value}%</span>
            <span>{slice.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
