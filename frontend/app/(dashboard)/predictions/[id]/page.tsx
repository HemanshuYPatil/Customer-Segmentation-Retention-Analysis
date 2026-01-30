"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { Badge } from "@/components/ui/badge";

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString();
}

function getRiskBadge(churn: number, ltv: number) {
  if (churn >= 0.7) return { label: "High Risk", tone: "danger" as const };
  if (churn >= 0.4) return { label: "At Risk", tone: "warning" as const };
  if (ltv >= 1000 && churn < 0.3) return { label: "Loyal", tone: "success" as const };
  return { label: "Stable", tone: "neutral" as const };
}

export default function SinglePredictionPage() {
  const params = useParams<{ id: string }>();
  const predictionId = params?.id as string;

  const predictionQuery = useQuery({
    queryKey: ["prediction", predictionId],
    queryFn: () => api.predictionDetail(predictionId),
    enabled: Boolean(predictionId),
    refetchInterval: 5000
  });

  const result = predictionQuery.data?.result as
    | {
        customer_id?: number;
        segment?: number;
        churn_probability?: number;
        ltv_estimate?: number;
        recommended_action?: string;
      }
    | undefined;

  const churn = Number(result?.churn_probability ?? 0);
  const ltv = Number(result?.ltv_estimate ?? 0);
  const risk = getRiskBadge(churn, ltv);

  return (
    <Card>
      <CardTitle>Single Prediction</CardTitle>
      <CardDescription>Review the latest prediction output.</CardDescription>

      <div className="mt-4 rounded-xl border border-panelBorder bg-background p-4">
        {predictionQuery.isLoading ? (
          <p className="text-sm text-muted">Loading prediction...</p>
        ) : predictionQuery.isError ? (
          <p className="text-sm text-danger">Unable to load prediction.</p>
        ) : !result ? (
          <p className="text-sm text-muted">Prediction not ready yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-panelBorder bg-panel p-3">
              <p className="text-xs text-muted">Customer</p>
              <p className="text-sm font-semibold">{result.customer_id ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-panelBorder bg-panel p-3">
              <p className="text-xs text-muted">Segment</p>
              <p className="text-sm font-semibold">{formatNumber(result.segment)}</p>
            </div>
            <div className="rounded-lg border border-panelBorder bg-panel p-3">
              <p className="text-xs text-muted">Churn probability</p>
              <p className="text-sm font-semibold">{formatPercent(result.churn_probability)}</p>
            </div>
            <div className="rounded-lg border border-panelBorder bg-panel p-3">
              <p className="text-xs text-muted">LTV estimate</p>
              <p className="text-sm font-semibold">{formatNumber(result.ltv_estimate)}</p>
            </div>
            <div className="rounded-lg border border-panelBorder bg-panel p-3 md:col-span-2">
              <p className="text-xs text-muted">Recommended action</p>
              <p className="text-sm font-semibold">{result.recommended_action ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-panelBorder bg-panel p-3 md:col-span-2">
              <p className="text-xs text-muted">Risk</p>
              <div className="mt-2 flex items-center">
                <Badge tone={risk.tone}>{risk.label}</Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
