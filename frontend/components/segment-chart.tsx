"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList
} from "recharts";
import { Card, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";

type SegmentChartProps = {
  data: Array<{ segment: number; customers: number }>;
  dataTour?: string;
};

export default function SegmentChart({ data, dataTour }: SegmentChartProps) {
  const prepared = useMemo(
    () =>
      data
        .map((item, index) => ({
          ...item,
          label: `S${item.segment ?? index + 1}`
        }))
        .sort((a, b) => b.customers - a.customers),
    [data]
  );
  const totalCustomers = useMemo(
    () => prepared.reduce((sum, item) => sum + (item.customers ?? 0), 0),
    [prepared]
  );
  const topSegment = prepared[0];

  return (
    <Card className="h-full" data-tour={dataTour}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <CardTitle>Active Segment Distribution</CardTitle>
          <p className="text-xs text-muted">
            {prepared.length
              ? `${prepared.length} segments · ${totalCustomers.toLocaleString()} customers`
              : "No segments yet"}
          </p>
          {topSegment ? (
            <p className="mt-1 text-xs text-muted">
              Top segment: {topSegment.label} ·{" "}
              {Math.round((topSegment.customers / Math.max(totalCustomers, 1)) * 100)}%
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Live
        </div>
      </div>
      <div className="h-64">
        {prepared.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-panelBorder bg-background text-sm text-muted">
            Waiting for segment data
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={prepared}
              margin={{ top: 8, right: 12, left: 4, bottom: 8 }}
            >
              <defs>
                <linearGradient id="segmentBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--color-accent))" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="rgb(var(--color-accent))" stopOpacity={0.55} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "rgb(var(--color-muted))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "rgb(var(--color-muted))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={(value: number) => value.toLocaleString()}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "rgb(var(--color-panel))",
                  border: "1px solid rgb(var(--color-panel-border))",
                  color: "rgb(var(--color-text))",
                  borderRadius: "12px",
                  boxShadow: "0 14px 30px rgba(0,0,0,0.28)"
                }}
                labelStyle={{ color: "rgb(var(--color-muted))" }}
                formatter={(value: number) => {
                  const percent = totalCustomers
                    ? `${Math.round((value / totalCustomers) * 100)}%`
                    : "0%";
                  return [`${value.toLocaleString()} (${percent})`, "Customers"];
                }}
              />
              <Bar
                dataKey="customers"
                fill="url(#segmentBar)"
                radius={[10, 10, 4, 4]}
                maxBarSize={42}
              >
                <LabelList
                  dataKey="customers"
                  position="top"
                  formatter={(value: number) => value.toLocaleString()}
                  fill="rgb(var(--color-text))"
                  fontSize={11}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}


