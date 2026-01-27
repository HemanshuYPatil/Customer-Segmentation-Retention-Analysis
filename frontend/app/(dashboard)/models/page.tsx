"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { useToast } from "@/components/ui/toast";
import { useMemo } from "react";
import { useAuth } from "@/components/auth-provider";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function formatTimestamp(value: any) {
  if (!value) return "?";
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
    return "?";
  }
}

export default function ModelsPage() {
  const { push } = useToast();
  const { user } = useAuth();

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

  const defaultQuery = useQuery({
    queryKey: ["default-model"],
    queryFn: api.defaultModel,
    retry: false
  });

  const defaultId = defaultQuery.data?.model_id ?? "";

  const modelRows = useMemo(() => modelsQuery.data ?? [], [modelsQuery.data]);

  const setDefault = async (modelId: string) => {
    await api.setDefaultModel(modelId);
    push({ title: "Default model updated.", tone: "success" });
  };

  const runBatch = async (modelId: string) => {
    if (!user) {
      push({ title: "Login required.", tone: "error" });
      return;
    }
    await api.queueBatchPrediction({ tenant_id: user.uid, model_id: modelId });
    push({ title: "Batch prediction started.", tone: "success" });
  };

  return (
    <Card>
      <CardTitle>Model Management</CardTitle>
      <CardDescription>Review trained models and manage production default.</CardDescription>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-panelBorder bg-background p-3">
          <p className="text-xs text-muted">Accuracy</p>
          <p className="text-2xl font-semibold">
            {metricsQuery.data?.logreg_acc
              ? `${(metricsQuery.data.logreg_acc * 100).toFixed(1)}%`
              : "?"}
          </p>
        </div>
        <div className="rounded-lg border border-panelBorder bg-background p-3">
          <p className="text-xs text-muted">F1 Score</p>
          <p className="text-2xl font-semibold">
            {metricsQuery.data?.logreg_f1 ? metricsQuery.data.logreg_f1.toFixed(2) : "?"}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-panelBorder bg-background">
        {modelRows.length === 0 ? (
          <div className="p-4 text-sm text-muted">No trained models yet. Go to Train Model.</div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Model</TH>
                <TH>Created</TH>
                <TH>Accuracy</TH>
                <TH>F1</TH>
                <TH>Status</TH>
                <TH>Actions</TH>
              </TR>
            </THead>
            <TBody>
              {modelRows.map((model) => (
                <TR key={model.model_id}>
                  <TD className="font-medium">{model.name}</TD>
                  <TD>{formatTimestamp((model as any).created_at)}</TD>
                  <TD>{model.metrics?.logreg_acc ? (model.metrics.logreg_acc * 100).toFixed(1) + "%" : "?"}</TD>
                  <TD>{model.metrics?.logreg_f1 ? model.metrics.logreg_f1.toFixed(2) : "?"}</TD>
                  <TD>
                    {model.model_id === defaultId ? (
                      <Badge tone="success">Default</Badge>
                    ) : (
                      <Badge tone="neutral">Available</Badge>
                    )}
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setDefault(model.model_id)}
                      >
                        Set Default
                      </Button>
                      <Button onClick={() => runBatch(model.model_id)}>Run Batch</Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </Card>
  );
}
