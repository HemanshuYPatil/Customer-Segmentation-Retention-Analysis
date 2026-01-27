"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Gauge, Layers, ShieldCheck, TrendingUp, RefreshCcw, Sparkles } from "lucide-react";
import MetricCard from "@/components/metric-card";
import SegmentChart from "@/components/segment-chart";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

export default function DashboardPage() {
  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: api.health
  });

  const metricsQuery = useQuery({
    queryKey: ["metrics"],
    queryFn: api.metrics,
    retry: false
  });

  const segmentsQuery = useQuery({
    queryKey: ["segments"],
    queryFn: api.segments,
    retry: false
  });

  const segmentData =
    segmentsQuery.data?.map((s) => ({ segment: s.segment, customers: s.customers })) ??
    [
      { segment: 0, customers: 220 },
      { segment: 1, customers: 180 },
      { segment: 2, customers: 140 },
      { segment: 3, customers: 90 }
    ];

  const churnTrend = [
    { month: "Aug", risk: 18 },
    { month: "Sep", risk: 22 },
    { month: "Oct", risk: 19 },
    { month: "Nov", risk: 24 },
    { month: "Dec", risk: 21 },
    { month: "Jan", risk: 17 }
  ];

  const ltvTrend = [
    { month: "Aug", value: 820 },
    { month: "Sep", value: 860 },
    { month: "Oct", value: 900 },
    { month: "Nov", value: 940 },
    { month: "Dec", value: 980 },
    { month: "Jan", value: 1020 }
  ];

  const segmentMix = [
    { name: "Loyalist", value: 38 },
    { name: "Growth", value: 24 },
    { name: "At-Risk", value: 21 },
    { name: "Churn", value: 17 }
  ];

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="System Health"
          value={healthQuery.data?.status ?? "checking"}
          subtitle="FastAPI uptime"
        />
        <MetricCard
          title="Best Accuracy"
          value={metricsQuery.data?.logreg_acc ? `${(metricsQuery.data.logreg_acc * 100).toFixed(1)}%` : "—"}
          subtitle="Latest churn model"
        />
        <MetricCard
          title="Business Cost"
          value={metricsQuery.data?.business_cost ? metricsQuery.data.business_cost.toFixed(0) : "—"}
          subtitle="Lower is better"
        />
        <MetricCard
          title="Active Segments"
          value={segmentsQuery.data ? `${segmentsQuery.data.length}` : "4"}
          subtitle="Current persona clusters"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SegmentChart data={segmentData} />
        <Card className="lg:col-span-2">
          <CardTitle>Latest Predictions</CardTitle>
          <CardDescription>
            Track high-risk customers and high-value segments to trigger retention programs.
          </CardDescription>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              { label: "High-Risk Alerts", value: 34, icon: ShieldCheck },
              { label: "High-Value Users", value: 128, icon: Layers },
              { label: "Active Experiments", value: 7, icon: Activity },
              { label: "Drift Watch", value: 2, icon: Gauge }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-lg border border-panelBorder bg-background p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted">{item.label}</p>
                    <Icon size={16} className="text-accent" />
                  </div>
                  <p className="mt-1 text-xl font-semibold">{item.value}</p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Churn Risk Trend</CardTitle>
              <CardDescription>Share of customers flagged as high-risk.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <TrendingUp size={14} className="text-accent" />
              6 month window
            </div>
          </div>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={churnTrend}>
                <Tooltip
                  contentStyle={{
                    background: "rgb(var(--color-panel))",
                    border: "1px solid rgb(var(--color-panel-border))",
                    color: "rgb(var(--color-text))"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="risk"
                  stroke="rgb(var(--color-accent))"
                  fill="rgba(var(--color-accent), 0.2)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Segment Mix</CardTitle>
          <CardDescription>Distribution across current segments.</CardDescription>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip
                  contentStyle={{
                    background: "rgb(var(--color-panel))",
                    border: "1px solid rgb(var(--color-panel-border))",
                    color: "rgb(var(--color-text))"
                  }}
                />
                <Pie
                  data={segmentMix}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={70}
                  fill="rgb(var(--color-accent))"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue Retention</CardTitle>
              <CardDescription>LTV trend for retained cohorts.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted">
              <RefreshCcw size={14} className="text-accent" />
              Updated weekly
            </div>
          </div>
          <div className="mt-4 h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ltvTrend}>
                <Tooltip
                  contentStyle={{
                    background: "rgb(var(--color-panel))",
                    border: "1px solid rgb(var(--color-panel-border))",
                    color: "rgb(var(--color-text))"
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="rgb(var(--color-success))"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest model and retention actions.</CardDescription>
          <div className="mt-4 space-y-3">
            {[
              { title: "Model retrained", detail: "Retail v3 - 14:32", icon: RefreshCcw },
              { title: "New insight generated", detail: "Growth segment uplift +4.2%", icon: Sparkles },
              { title: "Churn alert sent", detail: "34 users flagged", icon: ShieldCheck }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-3 rounded-lg border border-panelBorder bg-background p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accentSoft text-accent">
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-muted">{item.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
