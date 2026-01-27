"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const modelOptions = [
  { id: "mdl-2026-01-27-01", label: "Jan 27, 2026 - Retail v3 (Latest)" },
  { id: "mdl-2026-01-12-02", label: "Jan 12, 2026 - Ecom pilot" },
  { id: "mdl-2025-12-20-01", label: "Dec 20, 2025 - Wholesale" }
];

const batchRuns = [
  {
    id: "batch-2026-01-27-01",
    name: "Retail v3 - Full dataset",
    model: "Retail v3",
    queuedAt: "Jan 27, 2026 15:05",
    status: "completed",
    customers: 12480,
    highRisk: 368,
    avgChurn: 0.31
  },
  {
    id: "batch-2026-01-20-02",
    name: "Ecom pilot - January refresh",
    model: "Ecom pilot",
    queuedAt: "Jan 20, 2026 10:12",
    status: "completed",
    customers: 8620,
    highRisk: 290,
    avgChurn: 0.28
  },
  {
    id: "batch-2026-01-14-01",
    name: "Wholesale - Q1 backlog",
    model: "Wholesale",
    queuedAt: "Jan 14, 2026 08:44",
    status: "queued",
    customers: 6430,
    highRisk: 210,
    avgChurn: 0.34
  }
];

export default function PredictionsPage() {
  const [query, setQuery] = useState("");
  const [method, setMethod] = useState<"single" | "batch">("single");
  const [selectedModel, setSelectedModel] = useState<string>(modelOptions[0].id);
  const [customerId, setCustomerId] = useState("");

  const filteredBatches = useMemo(() => {
    if (!query) return batchRuns;
    return batchRuns.filter((batch) =>
      batch.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  return (
    <Card>
      <CardTitle>Prediction Console</CardTitle>
      <CardDescription>
        Choose a prediction method, select a trained model, and run predictions.
      </CardDescription>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-panelBorder bg-background p-4">
          <p className="text-sm font-semibold">Prediction method</p>
          <p className="mt-1 text-xs text-muted">
            Single for one customer ID, batch for all customers in your dataset.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant={method === "single" ? "primary" : "secondary"}
              onClick={() => setMethod("single")}
            >
              Single prediction
            </Button>
            <Button
              variant={method === "batch" ? "primary" : "secondary"}
              onClick={() => setMethod("batch")}
            >
              Batch processing
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-panelBorder bg-background p-4">
          <p className="text-sm font-semibold">Select model</p>
          <p className="mt-1 text-xs text-muted">
            Choose a previous training run to use for predictions.
          </p>
          <div className="mt-3">
            <Select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
              {modelOptions.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {method === "single" ? (
          <div className="rounded-xl border border-panelBorder bg-panel p-4 lg:col-span-2">
            <p className="text-sm font-semibold">Single prediction</p>
            <p className="mt-1 text-xs text-muted">
              Enter a customer ID to run a one-off prediction with the selected model.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Input
                placeholder="Customer ID"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              />
              <Button disabled={!customerId}>Run prediction</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-panelBorder bg-panel p-4 lg:col-span-2">
            <p className="text-sm font-semibold">Batch processing</p>
            <p className="mt-1 text-xs text-muted">
              Queue predictions for all customers using the selected model.
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted">Dataset size</p>
                <p className="text-sm font-semibold">12,480 customers</p>
              </div>
              <Button>Queue batch prediction</Button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Latest batches</p>
            <p className="text-xs text-muted">Select a batch to view full prediction details.</p>
          </div>
          <Input
            placeholder="Search batch name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="mt-3 grid gap-3">
          {filteredBatches.map((batch) => (
            <Link
              key={batch.id}
              href={`/predictions/batch/${batch.id}`}
              className="rounded-xl border border-panelBorder bg-background p-4 transition hover:border-accent/60"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{batch.name}</p>
                  <p className="text-xs text-muted">
                    Model: {batch.model} · Queued {batch.queuedAt}
                  </p>
                </div>
                <Badge tone={batch.status === "completed" ? "success" : "warning"}>
                  {batch.status === "completed" ? "Completed" : "Queued"}
                </Badge>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-panelBorder bg-panel p-3">
                  <p className="text-xs text-muted">Customers</p>
                  <p className="text-sm font-semibold">{batch.customers.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-panelBorder bg-panel p-3">
                  <p className="text-xs text-muted">High risk</p>
                  <p className="text-sm font-semibold">{batch.highRisk.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-panelBorder bg-panel p-3">
                  <p className="text-xs text-muted">Avg churn score</p>
                  <p className="text-sm font-semibold">{batch.avgChurn.toFixed(2)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}

