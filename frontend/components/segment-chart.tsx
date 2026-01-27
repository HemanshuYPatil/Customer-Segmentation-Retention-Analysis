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
            <XAxis dataKey="segment" tick={{ fill: "#9FB0C7" }} />
            <Tooltip
              contentStyle={{
                background: "#121823",
                border: "1px solid #1C2533",
                color: "#E6EDF6"
              }}
            />
            <Bar dataKey="customers" fill="#3BA3FF" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
