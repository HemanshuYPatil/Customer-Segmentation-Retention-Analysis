"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { useToast } from "@/components/ui/toast";

export default function ModelsPage() {
  const { push } = useToast();
  const metricsQuery = useQuery({
    queryKey: ["metrics"],
    queryFn: api.metrics,
    retry: false
  });

  const handleRetrain = async () => {
    try {
      await api.retrain();
      push({ title: "Retraining started.", tone: "success" });
    } catch (err) {
      push({ title: "Retrain failed. Check FastAPI endpoint.", tone: "error" });
    }
  };

  return (
    <Card>
      <CardTitle>Model Management</CardTitle>
      <CardDescription>Track MLflow metrics and retrain on demand.</CardDescription>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-panelBorder bg-background p-3">
          <p className="text-xs text-muted">Accuracy</p>
          <p className="text-2xl font-semibold">
            {metricsQuery.data?.logreg_acc
              ? `${(metricsQuery.data.logreg_acc * 100).toFixed(1)}%`
              : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-panelBorder bg-background p-3">
          <p className="text-xs text-muted">F1 Score</p>
          <p className="text-2xl font-semibold">
            {metricsQuery.data?.logreg_f1 ? metricsQuery.data.logreg_f1.toFixed(2) : "—"}
          </p>
        </div>
      </div>
      <div className="mt-4">
        <Button onClick={handleRetrain}>Retrain Model</Button>
      </div>
    </Card>
  );
}
