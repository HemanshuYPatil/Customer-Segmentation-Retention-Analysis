"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from "recharts";
import { Card, CardTitle } from "@/components/ui/card";

type SegmentChartProps = {
  data: Array<{ segment: number; customers: number }>;
};

export default function SegmentChart({ data }: SegmentChartProps) {
  return (
    <Card className="h-full">
      <CardTitle className="mb-3">Active Segment Distribution</CardTitle>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="segment" tick={{ fill: "rgb(var(--color-muted))" }} />
            <Tooltip
              contentStyle={{
                background: "rgb(var(--color-panel))",
                border: "1px solid rgb(var(--color-panel-border))",
                color: "rgb(var(--color-text))"
              }}
            />
            <Bar
              dataKey="customers"
              fill="rgb(var(--color-accent))"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
