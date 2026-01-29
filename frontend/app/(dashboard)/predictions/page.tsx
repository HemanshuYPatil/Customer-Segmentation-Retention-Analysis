"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import Link from "next/link";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

function formatRelativeTime(value: any) {
  if (!value) return "—";
  let date: Date | null = null;
  if (value instanceof Date) {
    date = value;
  }
  if (typeof value === "number") {
    date = new Date(value);
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    date = Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (value.seconds) {
    date = new Date(value.seconds * 1000);
  }
  if (value._seconds) {
    date = new Date(value._seconds * 1000);
  }
  if (value.toDate) {
    date = value.toDate();
  }
  if (value.toMillis) {
    date = new Date(value.toMillis());
  }
  if (!date) return "—";
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 0) return "just now";
  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}

export default function PredictionsPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [selectedModel, setSelectedModel] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [predictionType, setPredictionType] = useState<"single" | "batch">("single");
  const [pendingBatches, setPendingBatches] = useState<
    Array<{ tempId: string; modelId: string; createdAt: number; mode: "single" | "batch" }>
  >([]);
  const prevBatchCountRef = useRef(0);

  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: api.models,
    refetchInterval: 5000
  });

  const predictionsQuery = useQuery({
    queryKey: ["predictions"],
    queryFn: api.predictions,
    refetchInterval: 5000
  });

  const serverBatches = useMemo(() => {
    const items = predictionsQuery.data ?? [];
    return items.filter((item: any) => item.payload?.mode === "batch");
  }, [predictionsQuery.data]);

  const modelNameById = useMemo(() => {
    const map = new Map<string, string>();
    (modelsQuery.data ?? []).forEach((model) => {
      map.set(model.model_id, model.name);
    });
    return map;
  }, [modelsQuery.data]);

  const predictions = useMemo(() => {
    const queued = pendingBatches.map((item) => ({
      prediction_id: item.tempId,
      payload: { model_id: item.modelId, mode: item.mode },
      created_at: new Date(item.createdAt).toISOString(),
      isQueued: true
    }));
    return [...queued, ...(predictionsQuery.data ?? [])];
  }, [pendingBatches, predictionsQuery.data]);

  const queuedCount = pendingBatches.length;

  useEffect(() => {
    const serverCount = serverBatches.length;
    const delta = serverCount - prevBatchCountRef.current;
    if (delta > 0 && pendingBatches.length) {
      setPendingBatches((prev) => prev.slice(Math.min(delta, prev.length)));
    }
    prevBatchCountRef.current = serverCount;
  }, [serverBatches.length, pendingBatches.length]);

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
    setPendingBatches((prev) => [
      { tempId: `queued-${Date.now()}-single`, modelId: selectedModel, createdAt: Date.now(), mode: "single" },
      ...prev
    ]);
    setCustomerId("");
    setIsCreateOpen(false);
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
    setPendingBatches((prev) => [
      { tempId: `queued-${Date.now()}-batch`, modelId: selectedModel, createdAt: Date.now(), mode: "batch" },
      ...prev
    ]);
    push({ title: "Batch prediction started.", tone: "success" });
    setIsCreateOpen(false);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Prediction Console</CardTitle>
          <CardDescription>Run single or batch predictions and review batch history.</CardDescription>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>Create prediction</Button>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Prediction runs</p>
            <p className="text-xs text-muted">
              {queuedCount ? `${queuedCount} queued` : "Open a run to view full results."}
            </p>
          </div>
          <Button
            variant="ghost"
            className="h-9"
            onClick={() => predictionsQuery.refetch()}
            disabled={predictionsQuery.isFetching}
          >
            Refresh
          </Button>
        </div>
        <div className="mt-3 grid gap-3">
          {predictions.length === 0 && (
            <div className="rounded-xl border border-panelBorder bg-background p-4 text-sm text-muted">
              No batch runs yet.
            </div>
          )}
          {predictions.map((item: any) => (
            item.isQueued ? (
              <div
                key={item.prediction_id}
                className="rounded-xl border border-panelBorder bg-background p-4 opacity-70"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {item.payload?.mode === "single" ? "Single prediction" : "Batch prediction"}
                    </p>
                    <p className="text-xs text-muted">
                      Model: {modelNameById.get(item.payload?.model_id) || "—"} ·{" "}
                      {formatRelativeTime(item.created_at)}
                    </p>
                  </div>
                  <span className="rounded-full border border-panelBorder bg-panel px-2 py-1 text-xs text-muted">
                    Queued
                  </span>
                </div>
              </div>
            ) : (
              <Link
                key={item.prediction_id}
                href={
                  item.payload?.mode === "batch"
                    ? `/predictions/batch/${item.prediction_id}`
                    : `/predictions/${item.prediction_id}`
                }
                className="rounded-xl border border-panelBorder bg-background p-4 transition hover:border-accent/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">
                      {item.payload?.mode === "single" ? "Single prediction" : "Batch prediction"}
                    </p>
                    <p className="text-xs text-muted">
                      Model: {modelNameById.get(item.payload?.model_id) || "—"} ·{" "}
                      {formatRelativeTime(item.created_at)}
                    </p>
                  </div>
                  <p className="text-xs text-muted">
                    {item.payload?.mode === "batch"
                      ? `${item.result?.count ?? "—"} customers`
                      : `Customer ${item.result?.customer_id ?? item.payload?.customer_id ?? "—"}`}
                  </p>
                </div>
              </Link>
            )
          ))}
        </div>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-3xl rounded-2xl border border-panelBorder bg-panel">
            <div className="flex items-center justify-between border-b border-panelBorder px-6 py-4">
              <div>
                <p className="text-xs uppercase text-muted">Prediction</p>
                <h3 className="text-lg font-semibold">Create prediction</h3>
              </div>
              <Button
                variant="ghost"
                className="h-9 w-9 p-0"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </Button>
            </div>

            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="rounded-xl border border-panelBorder bg-background p-4 md:col-span-2">
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

              <div className="rounded-xl border border-panelBorder bg-background p-4 md:col-span-2">
                <p className="text-sm font-semibold">Prediction type</p>
                <p className="mt-1 text-xs text-muted">Choose a single customer or a full batch.</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setPredictionType("single")}
                    className={cn(
                      "flex-1 rounded-lg border border-panelBorder px-3 py-2 text-left text-sm transition",
                      predictionType === "single"
                        ? "bg-accentSoft text-text"
                        : "bg-panel text-muted hover:bg-panelBorder/50 hover:text-text"
                    )}
                  >
                    Single prediction
                  </button>
                  <button
                    type="button"
                    onClick={() => setPredictionType("batch")}
                    className={cn(
                      "flex-1 rounded-lg border border-panelBorder px-3 py-2 text-left text-sm transition",
                      predictionType === "batch"
                        ? "bg-accentSoft text-text"
                        : "bg-panel text-muted hover:bg-panelBorder/50 hover:text-text"
                    )}
                  >
                    Batch prediction
                  </button>
                </div>
              </div>

              {predictionType === "single" ? (
                <div className="rounded-xl border border-panelBorder bg-panel p-4 md:col-span-2">
                  <p className="text-sm font-semibold">Single prediction</p>
                  <p className="mt-1 text-xs text-muted">Enter a customer ID to run a prediction.</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                    <Input
                      placeholder="Customer ID"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                    />
                    <Button onClick={runSingle} disabled={!customerId || !selectedModel}>
                      Run single prediction
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-panelBorder bg-panel p-4 md:col-span-2">
                  <p className="text-sm font-semibold">Batch prediction</p>
                  <p className="mt-1 text-xs text-muted">
                    Run predictions for all customers in the model dataset.
                  </p>
                  <div className="mt-3">
                    <Button onClick={runBatch} disabled={!selectedModel}>
                      Run batch prediction
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

