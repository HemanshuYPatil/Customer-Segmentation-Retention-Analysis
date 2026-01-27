"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import Link from "next/link";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";

function formatTimestamp(value: any) {
  if (!value) return "—";
  if (typeof value === "string") return value;
  if (value.seconds) {
    return new Date(value.seconds * 1000).toLocaleString();
  }
  if (value._seconds) {
    return new Date(value._seconds * 1000).toLocaleString();
  }
  if (value.toDate) {
    return value.toDate().toLocaleString();
  }
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

export default function PredictionsPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [selectedModel, setSelectedModel] = useState("");
  const [customerId, setCustomerId] = useState("");

  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: api.models
  });

  const predictionsQuery = useQuery({
    queryKey: ["predictions"],
    queryFn: api.predictions
  });

  const batches = useMemo(() => {
    const items = predictionsQuery.data ?? [];
    return items.filter((item: any) => item.payload?.mode === "batch");
  }, [predictionsQuery.data]);

  const runSingle = async () => {
    if (!user) {
      push({ title: "Login required.", tone: "error" });
      return;
    }
    if (!selectedModel) {
      push({ title: "Select a model.", tone: "error" });
      return;
    }
    const id = Number(customerId);
    if (!id) {
      push({ title: "Enter a valid customer ID.", tone: "error" });
      return;
    }
    await api.queueSinglePrediction({ tenant_id: user.uid, model_id: selectedModel, customer_id: id });
    push({ title: "Single prediction started.", tone: "success" });
  };

  const runBatch = async () => {
    if (!user) {
      push({ title: "Login required.", tone: "error" });
      return;
    }
    if (!selectedModel) {
      push({ title: "Select a model.", tone: "error" });
      return;
    }
    await api.queueBatchPrediction({ tenant_id: user.uid, model_id: selectedModel });
    push({ title: "Batch prediction started.", tone: "success" });
  };

  return (
    <Card>
      <CardTitle>Prediction Console</CardTitle>
      <CardDescription>Run single or batch predictions and review batch history.</CardDescription>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-panelBorder bg-background p-4">
          <p className="text-sm font-semibold">Select model</p>
          <p className="mt-1 text-xs text-muted">Choose a trained model.</p>
          <div className="mt-3">
            <Select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              <option value="">Select model</option>
              {(modelsQuery.data ?? []).map((model) => (
                <option key={model.model_id} value={model.model_id}>
                  {model.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-panelBorder bg-panel p-4">
          <p className="text-sm font-semibold">Single prediction</p>
          <p className="mt-1 text-xs text-muted">Enter a customer ID to run a prediction.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Customer ID"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
            <Button onClick={runSingle} disabled={!customerId}>
              Run single prediction
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-panelBorder bg-panel p-4 lg:col-span-2">
          <p className="text-sm font-semibold">Batch prediction</p>
          <p className="mt-1 text-xs text-muted">Run predictions for all customers in the model dataset.</p>
          <div className="mt-3">
            <Button onClick={runBatch}>Run batch prediction</Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold">Batch runs</p>
        <p className="text-xs text-muted">Open a batch run to view full results.</p>
        <div className="mt-3 grid gap-3">
          {batches.length === 0 && (
            <div className="rounded-xl border border-panelBorder bg-background p-4 text-sm text-muted">
              No batch runs yet.
            </div>
          )}
          {batches.map((item: any) => (
            <Link
              key={item.prediction_id}
              href={`/predictions/batch/${item.prediction_id}`}
              className="rounded-xl border border-panelBorder bg-background p-4 transition hover:border-accent/60"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Batch Run</p>
                  <p className="text-xs text-muted">
                    Model: {item.payload?.model_id || "—"} · {formatTimestamp(item.created_at)}
                  </p>
                </div>
                <p className="text-xs text-muted">{item.result?.count ?? "—"} customers</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}

