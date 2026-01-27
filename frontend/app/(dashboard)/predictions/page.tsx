"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import PredictionTable from "@/components/prediction-table";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";

export default function PredictionsPage() {
  const [query, setQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [customerId, setCustomerId] = useState("");
  const { user } = useAuth();
  const { push } = useToast();

  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: api.models
  });

  const predictionsQuery = useQuery({
    queryKey: ["predictions"],
    queryFn: api.predictions
  });

  const rows = useMemo(() => {
    const items = predictionsQuery.data ?? [];
    const formatted = items.flatMap((item: any) => {
      const result = item.result as {
        rows?: any[];
        customer_id?: number;
        churn_probability?: number;
        ltv_estimate?: number;
        segment?: number;
      };
      if (result?.rows) {
        return result.rows.map((row) => ({
          customerId: String(row.CustomerID ?? row.customer_id),
          churnProbability: Number(row.churn_probability ?? 0),
          ltv: Number(row.ltv_estimate ?? 0),
          segment: String(row.segment ?? "")
        }));
      }
      if (result?.customer_id) {
        return [
          {
            customerId: String(result.customer_id),
            churnProbability: Number(result.churn_probability ?? 0),
            ltv: Number(result.ltv_estimate ?? 0),
            segment: String(result.segment ?? "")
          }
        ];
      }
      return [];
    });
    if (!query) return formatted;
    return formatted.filter((row) => row.customerId.toLowerCase().includes(query.toLowerCase()));
  }, [predictionsQuery.data, query]);

  const triggerSingle = async () => {
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
    await api.queueSinglePrediction({
      tenant_id: user.uid,
      model_id: selectedModel,
      customer_id: id
    });
    push({ title: "Single prediction queued.", tone: "success" });
  };

  const triggerBatch = async () => {
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
      <CardTitle>Prediction Console</CardTitle>
      <CardDescription>Queue single or batch predictions using a trained model.</CardDescription>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-panelBorder bg-background p-4">
          <p className="text-sm font-semibold">Select model</p>
          <p className="mt-1 text-xs text-muted">Choose a trained model to run predictions.</p>
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
          <p className="mt-1 text-xs text-muted">Enter a customer ID to queue a prediction.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Input
              placeholder="Customer ID"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
            <Button onClick={triggerSingle} disabled={!customerId}>
              Queue single
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-panelBorder bg-panel p-4 lg:col-span-2">
          <p className="text-sm font-semibold">Batch prediction</p>
          <p className="mt-1 text-xs text-muted">
            Queue predictions for all customers in the model dataset.
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Button onClick={triggerBatch}>Queue batch prediction</Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Prediction results</p>
            <p className="text-xs text-muted">Latest predictions stored for this tenant.</p>
          </div>
          <Input
            placeholder="Search customer ID"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <div className="mt-3">
          <PredictionTable rows={rows} />
        </div>
      </div>
    </Card>
  );
}
