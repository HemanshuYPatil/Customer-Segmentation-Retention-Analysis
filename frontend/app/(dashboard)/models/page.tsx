"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { useToast } from "@/components/ui/toast";
import { useMemo, useState } from "react";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

function formatRelativeTime(value: any) {
  if (!value) return "--";
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
  if (!date) return "--";
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

function getTimestampMs(value: any) {
  if (!value) return 0;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
  }
  if (value.seconds) return value.seconds * 1000;
  if (value._seconds) return value._seconds * 1000;
  if (value.toMillis) return value.toMillis();
  if (value.toDate) return value.toDate().getTime();
  return 0;
}

export default function ModelsPage() {
  const { push } = useToast();

  const metricsQuery = useQuery({
    queryKey: ["metrics"],
    queryFn: api.metrics,
    retry: false,
    refetchInterval: 5000
  });

  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: api.models,
    retry: false,
    refetchInterval: 5000
  });

  const defaultQuery = useQuery({
    queryKey: ["default-model"],
    queryFn: api.defaultModel,
    retry: false,
    refetchInterval: 5000
  });

  const queueQuery = useQuery({
    queryKey: ["queue", "training"],
    queryFn: () => api.queueJobs("training"),
    retry: false,
    refetchInterval: 5000
  });

  const defaultId = defaultQuery.data?.model_id ?? "";

  const modelRows = useMemo(() => {
    const rows = modelsQuery.data ?? [];
    return [...rows].sort(
      (a: any, b: any) => getTimestampMs(b.created_at) - getTimestampMs(a.created_at)
    );
  }, [modelsQuery.data]);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const pendingModels = useMemo(() => {
    const visible = new Set(["queued", "processing", "failed", "canceled"]);
    return (queueQuery.data ?? [])
      .filter((job: any) => visible.has(job.status))
      .map((job: any) => ({
        tempId: job.queue_id,
        name: job.payload?.model_label || "Training job",
        createdAt: job.created_at,
        status: job.status || "queued"
      }));
  }, [queueQuery.data]);

  const hasRows = pendingModels.length + modelRows.length > 0;

  const setDefault = async (modelId: string) => {
    await api.setDefaultModel(modelId);
    push({ title: "Default model updated.", tone: "success" });
  };

  const cancelJob = async (queueId: string) => {
    setCancelingId(queueId);
    try {
      await api.updateQueueJob(queueId, { status: "canceled" });
      push({ title: "Queue canceled.", tone: "success" });
      queueQuery.refetch();
    } catch {
      push({ title: "Cancel failed.", description: "Try again.", tone: "error" });
    } finally {
      setCancelingId(null);
    }
  };
  const defaultModel = useMemo(
    () => modelRows.find((model) => model.model_id === defaultId),
    [modelRows, defaultId]
  );
  const defaultAccuracy =
    defaultModel?.metrics?.logreg_acc ?? metricsQuery.data?.logreg_acc;
  const defaultF1 = defaultModel?.metrics?.logreg_f1 ?? metricsQuery.data?.logreg_f1;

  return (
    <Card>
      <CardTitle>Model Management</CardTitle>
      <CardDescription>Review trained models and manage production default.</CardDescription>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-panelBorder bg-background p-3">
          <p className="text-xs text-muted">Accuracy</p>
          <p className="text-2xl font-semibold">
            {typeof defaultAccuracy === "number"
              ? `${(defaultAccuracy * 100).toFixed(1)}%`
              : "--"}
          </p>
        </div>
        <div className="rounded-lg border border-panelBorder bg-background p-3">
          <p className="text-xs text-muted">F1 Score</p>
          <p className="text-2xl font-semibold">
            {typeof defaultF1 === "number" ? defaultF1.toFixed(2) : "--"}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-panelBorder bg-background">
        {!hasRows ? (
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
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {pendingModels.map((model) => (
                <TR key={model.tempId} className="opacity-70">
                  <TD className="font-medium">{model.name}</TD>
                  <TD>{formatRelativeTime(model.createdAt)}</TD>
                  <TD>—</TD>
                  <TD>—</TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">
                        {model.status === "failed"
                          ? "Failed"
                          : model.status === "canceled"
                            ? "Canceled"
                            : model.status === "processing"
                              ? "Processing"
                              : "Queued"}
                      </Badge>
                      {["queued", "processing"].includes(model.status) && (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-muted border-t-transparent" />
                      )}
                    </div>
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-2">
                      {model.status === "queued" && (
                        <Button
                          variant="secondary"
                          onClick={() => cancelJob(model.tempId)}
                          disabled={cancelingId === model.tempId}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button variant="secondary" disabled>
                        Set Default
                      </Button>
                    </div>
                  </TD>
                  <TD>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-panelBorder text-muted">
                      <ChevronRight size={14} />
                    </span>
                  </TD>
                </TR>
              ))}
              {modelRows.map((model) => (
                <TR key={model.model_id}>
                  <TD className="font-medium">{model.name}</TD>
                  <TD>{formatRelativeTime((model as any).created_at)}</TD>
                  <TD>{model.metrics?.logreg_acc ? `${(model.metrics.logreg_acc * 100).toFixed(1)}%` : "--"}</TD>
                  <TD>{model.metrics?.logreg_f1 ? model.metrics.logreg_f1.toFixed(2) : "--"}</TD>
                  <TD>
                    {model.model_id === defaultId ? (
                      <Badge tone="success">Default</Badge>
                    ) : (
                      <Badge tone="neutral">Available</Badge>
                    )}
                  </TD>
                  <TD>
                    <div className="flex flex-wrap gap-2">
                      {model.model_id !== defaultId && (
                        <Button
                          variant="secondary"
                          onClick={() => setDefault(model.model_id)}
                        >
                          Set Default
                        </Button>
                      )}
                    </div>
                  </TD>
                  <TD>
                    <Link
                      href={`/models/${model.model_id}`}
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-panelBorder text-muted transition hover:border-accent/60 hover:text-text"
                      aria-label={`View ${model.name}`}
                    >
                      <ChevronRight size={14} />
                    </Link>
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
