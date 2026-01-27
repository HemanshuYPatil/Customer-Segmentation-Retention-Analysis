"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function ModelsPage() {
  const { push } = useToast();
  const models = [
    {
      id: "mdl-2026-01-27-01",
      name: "Jan 27, 2026 - Retail v3",
      dataset: "retail_customers_v3.xlsx",
      trainedAt: "Jan 27, 2026 14:32",
      status: "active",
      accuracy: 0.71,
      f1: 0.62
    },
    {
      id: "mdl-2026-01-12-02",
      name: "Jan 12, 2026 - Ecom pilot",
      dataset: "ecom_pilot_q4.csv",
      trainedAt: "Jan 12, 2026 09:05",
      status: "previous",
      accuracy: 0.69,
      f1: 0.59
    },
    {
      id: "mdl-2025-12-20-01",
      name: "Dec 20, 2025 - Wholesale",
      dataset: "wholesale_master.xlsx",
      trainedAt: "Dec 20, 2025 18:41",
      status: "previous",
      accuracy: 0.67,
      f1: 0.55
    }
  ];

  return (
    <Card>
      <CardTitle>Model Management</CardTitle>
      <CardDescription>
        Review previous training runs and select a model for predictions.
      </CardDescription>

      <div className="mt-4 grid gap-3">
        {models.map((model) => (
          <div key={model.id} className="rounded-xl border border-panelBorder bg-background p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{model.name}</p>
                <p className="text-xs text-muted">{model.dataset}</p>
              </div>
              <Badge tone={model.status === "active" ? "success" : "neutral"}>
                {model.status === "active" ? "Latest model" : "Previous model"}
              </Badge>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-panelBorder bg-panel p-3">
                <p className="text-xs text-muted">Trained</p>
                <p className="text-sm font-semibold">{model.trainedAt}</p>
              </div>
              <div className="rounded-lg border border-panelBorder bg-panel p-3">
                <p className="text-xs text-muted">Accuracy</p>
                <p className="text-sm font-semibold">{(model.accuracy * 100).toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border border-panelBorder bg-panel p-3">
                <p className="text-xs text-muted">F1 Score</p>
                <p className="text-sm font-semibold">{model.f1.toFixed(2)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                onClick={() => push({ title: "Model selected for predictions.", tone: "success" })}
              >
                Use for predictions
              </Button>
              <Button
                variant="secondary"
                onClick={() => push({ title: "Retraining started.", tone: "info" })}
              >
                Retrain with this data
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
