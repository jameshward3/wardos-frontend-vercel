"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AlignmentSlice } from "../../lib/ward-report-data";

type DonutChartProps = {
  data: AlignmentSlice[];
  centerLabel: string;
  centerValue: string;
};

export function DonutChart({ data, centerLabel, centerValue }: DonutChartProps) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative h-56 w-56 shrink-0 print:h-48 print:w-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
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
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-serif text-3xl font-bold text-navy-900">{centerValue}</span>
          <span className="max-w-[7rem] text-center text-xs font-semibold uppercase tracking-wide text-navy-600">
            {centerLabel}
          </span>
        </div>
      </div>
      <ul className="flex flex-col gap-2.5">
        {data.map((slice) => (
          <li key={slice.name} className="flex items-center gap-2.5 text-sm text-navy-800">
            <span
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: slice.color }}
              aria-hidden="true"
            />
            <span className="font-semibold">{slice.value}%</span>
            <span>{slice.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
