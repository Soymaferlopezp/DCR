"use client";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export type OverviewPoint = {
  block: number;
  pings: number;
  registers: number;
  total: number;
};

export default function OverviewChart({ data }: { data: OverviewPoint[] }) {
  return (
    <div className="w-full h-64 rounded-lg border border-cyan/20 p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="block" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="pings" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="registers" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="total" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
