"use client";

import { useMemo } from "react";
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

  const predictionsQuery = useQuery({
    queryKey: ["predictions"],
    queryFn: api.predictions,
    retry: false
  });

  const segmentData =
    segmentsQuery.data?.map((s) => ({ segment: s.segment, customers: s.customers })) ?? [];

  const stats = useMemo(() => {
    const items = predictionsQuery.data ?? [];
    let total = 0;
    let highRisk = 0;
    let highValue = 0;
    let avgChurn = 0;
    let sumChurn = 0;
    items.forEach((item: any) => {
      const result = item.result;
      if (result?.rows) {
        result.rows.forEach((row: any) => {
          total += 1;
          const churn = Number(row.churn_probability ?? 0);
          const ltv = Number(row.ltv_estimate ?? 0);
          if (churn >= 0.7) highRisk += 1;
          if (ltv >= 1000) highValue += 1;
          sumChurn += churn;
        });
      } else if (result?.churn_probability !== undefined) {
        total += 1;
        const churn = Number(result.churn_probability ?? 0);
        const ltv = Number(result.ltv_estimate ?? 0);
        if (churn >= 0.7) highRisk += 1;
        if (ltv >= 1000) highValue += 1;
        sumChurn += churn;
      }
    });
    avgChurn = total > 0 ? sumChurn / total : 0;
    return { total, highRisk, highValue, avgChurn };
  }, [predictionsQuery.data]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="System Health"
          value={healthQuery.data?.status ?? "—"}
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
          value={segmentsQuery.data ? `${segmentsQuery.data.length}` : "—"}
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
              { label: "High-Risk Alerts", value: stats.total ? String(stats.highRisk) : "—", icon: ShieldCheck },
              { label: "High-Value Users", value: stats.total ? String(stats.highValue) : "—", icon: Layers },
              { label: "Active Predictions", value: stats.total ? String(stats.total) : "—", icon: Activity },
              { label: "Avg Churn", value: stats.total ? stats.avgChurn.toFixed(2) : "—", icon: Gauge }
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
