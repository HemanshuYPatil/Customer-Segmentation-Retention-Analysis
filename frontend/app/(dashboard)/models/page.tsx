"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { useToast } from "@/components/ui/toast";
import { Select } from "@/components/ui/select";
import { useState } from "react";
import { useAuth } from "@/components/auth-provider";

export default function ModelsPage() {
  const { push } = useToast();
  const { user } = useAuth();
  const [selectedModel, setSelectedModel] = useState("");

  const metricsQuery = useQuery({
    queryKey: ["metrics"],
    queryFn: api.metrics,
    retry: false
  });

  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: api.models,
    retry: false
  });

  const handleRetrain = async () => {
    push({ title: "Use the Onboarding page to upload and queue training.", tone: "info" });
  };

  const handleBatch = async () => {
    if (!user) {
      push({ title: "Login required.", tone: "error" });
      return;
    }
    if (!selectedModel) {
      push({ title: "Select a model.", tone: "error" });
      return;
    }
    await api.queueBatchPrediction({ tenant_id: user.uid, model_id: selectedModel });
    push({ title: "Batch prediction queued.", tone: "success" });
  };

  return (
    <Card>
      <CardTitle>Model Management</CardTitle>
      <CardDescription>View trained models and latest metrics.</CardDescription>
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

      <div className="mt-5 rounded-xl border border-panelBorder bg-panel p-4">
        <p className="text-sm font-semibold">Trained models</p>
        <p className="mt-1 text-xs text-muted">Select a model to use for predictions.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <Select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            <option value="">Select model</option>
            {(modelsQuery.data ?? []).map((model) => (
              <option key={model.model_id} value={model.model_id}>
                {model.name}
              </option>
            ))}
          </Select>
          <Button onClick={handleBatch}>Queue batch prediction</Button>
        </div>
      </div>

      <div className="mt-4">
        <Button onClick={handleRetrain} variant="secondary">
          Go to Onboarding to Train
        </Button>
      </div>
    </Card>
  );
}
