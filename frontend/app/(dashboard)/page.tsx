"use client";

import { useQuery } from "@tanstack/react-query";
import { Activity, Gauge, Layers, ShieldCheck } from "lucide-react";
import MetricCard from "@/components/metric-card";
import SegmentChart from "@/components/segment-chart";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";

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
    </div>
  );
}
