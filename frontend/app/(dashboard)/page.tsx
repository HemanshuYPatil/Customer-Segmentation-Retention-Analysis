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
    queryFn: api.health,
    refetchInterval: 5000
  });

  const metricsQuery = useQuery({
    queryKey: ["metrics"],
    queryFn: api.metrics,
    retry: false,
    refetchInterval: 5000
  });

  const segmentsQuery = useQuery({
    queryKey: ["segments"],
    queryFn: api.segments,
    retry: false,
    refetchInterval: 5000
  });

  const predictionsQuery = useQuery({
    queryKey: ["predictions"],
    queryFn: api.predictions,
    retry: false,
    refetchInterval: 5000
  });

  const segmentData =
    segmentsQuery.data?.map((s) => ({ segment: s.segment, customers: s.customers })) ?? [];

  const riskThreshold = useMemo(() => {
    const metrics = metricsQuery.data ?? {};
    const logregAcc = metrics.logreg_acc;
    const xgbAcc = metrics.xgb_acc;
    const logregThreshold = metrics.logreg_best_threshold;
    const xgbThreshold = metrics.xgb_best_threshold;

    if (typeof logregAcc === "number" && typeof xgbAcc === "number") {
      if (logregAcc >= xgbAcc && typeof logregThreshold === "number") {
        return logregThreshold;
      }
      if (typeof xgbThreshold === "number") {
        return xgbThreshold;
      }
    }

    if (typeof logregThreshold === "number") return logregThreshold;
    if (typeof xgbThreshold === "number") return xgbThreshold;
    return 0.7;
  }, [metricsQuery.data]);

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
          if (churn >= riskThreshold) highRisk += 1;
          if (ltv >= 1000) highValue += 1;
          sumChurn += churn;
        });
      } else if (result?.churn_probability !== undefined) {
        total += 1;
        const churn = Number(result.churn_probability ?? 0);
        const ltv = Number(result.ltv_estimate ?? 0);
        if (churn >= riskThreshold) highRisk += 1;
        if (ltv >= 1000) highValue += 1;
        sumChurn += churn;
      }
    });
    avgChurn = total > 0 ? sumChurn / total : 0;
    return { total, highRisk, highValue, avgChurn };
  }, [predictionsQuery.data, riskThreshold]);

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="System Health"
          value={healthQuery.data?.status ?? "—"}
          subtitle="FastAPI uptime"
          dataTour="metric-health"
        />
        <MetricCard
          title="Best Accuracy"
          value={metricsQuery.data?.logreg_acc ? `${(metricsQuery.data.logreg_acc * 100).toFixed(1)}%` : "—"}
          subtitle="Latest churn model"
          dataTour="metric-accuracy"
        />
        <MetricCard
          title="Business Cost"
          value={metricsQuery.data?.business_cost ? metricsQuery.data.business_cost.toFixed(0) : "—"}
          subtitle="Lower is better"
          dataTour="metric-cost"
        />
        <MetricCard
          title="Active Segments"
          value={segmentsQuery.data ? `${segmentsQuery.data.length}` : "—"}
          subtitle="Current persona clusters"
          dataTour="metric-segments"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SegmentChart data={segmentData} dataTour="segment-distribution" />
        <Card className="lg:col-span-2" data-tour="latest-predictions">
          <CardTitle>Latest Predictions</CardTitle>
          <CardDescription>
            Track high-risk customers and high-value segments to trigger retention programs.
          </CardDescription>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {[
              { label: "High-Risk Alerts", value: String(stats.highRisk), icon: ShieldCheck },
              { label: "High-Value Users", value: String(stats.highValue), icon: Layers },
              { label: "Active Predictions", value: String(stats.total), icon: Activity },
              { label: "Avg Churn", value: stats.avgChurn.toFixed(2), icon: Gauge }
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
