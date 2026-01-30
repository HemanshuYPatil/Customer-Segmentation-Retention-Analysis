"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { ChevronLeft, X } from "lucide-react";
import { useMemo, useState } from "react";

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

export default function ModelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const modelIdParam = (params as { id?: string | string[] })?.id;
  const modelId = Array.isArray(modelIdParam) ? modelIdParam[0] : modelIdParam;
  const [datasetOpen, setDatasetOpen] = useState(false);

  const modelQuery = useQuery({
    queryKey: ["model-detail", modelId],
    queryFn: () => api.modelDetail(modelId ?? ""),
    enabled: !!modelId
  });

  const jsonQuery = useQuery({
    queryKey: ["model-json", modelId],
    queryFn: () => api.modelJson(modelId ?? ""),
    enabled: !!modelId,
    retry: false
  });
  const datasetQuery = useQuery({
    queryKey: ["model-dataset", modelId],
    queryFn: () => api.modelDataset(modelId ?? ""),
    enabled: !!modelId && datasetOpen,
    retry: false
  });

  const metricsEntries = useMemo(() => {
    const metrics = modelQuery.data?.metrics ?? {};
    return Object.entries(metrics).sort((a, b) => a[0].localeCompare(b[0]));
  }, [modelQuery.data]);

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
          <ChevronLeft size={16} />
          Back to models
        </Button>
      </div>

        <Card>
          <CardTitle>Model Details</CardTitle>
          <CardDescription>Full record pulled from Firestore and stored artifacts.</CardDescription>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-panelBorder bg-background p-3">
            <p className="text-xs text-muted">Model name</p>
            <p className="text-sm font-semibold">{modelQuery.data?.name ?? "--"}</p>
          </div>
          <div className="rounded-xl border border-panelBorder bg-background p-3">
            <p className="text-xs text-muted">Model ID</p>
            <p className="text-sm font-semibold">{modelId ?? "--"}</p>
          </div>
          <div className="rounded-xl border border-panelBorder bg-background p-3">
            <p className="text-xs text-muted">Created</p>
            <p className="text-sm font-semibold">
              {modelQuery.data?.created_at
                ? formatRelativeTime(modelQuery.data.created_at)
                : "--"}
            </p>
          </div>
          <div className="rounded-xl border border-panelBorder bg-background p-3">
            <p className="text-xs text-muted">Artifact prefix</p>
            <p className="truncate text-sm font-semibold">
              {modelQuery.data?.artifact_prefix ?? "--"}
            </p>
          </div>
          <div className="flex items-end justify-between rounded-xl border border-panelBorder bg-background p-3 md:col-span-2">
            <div>
              <p className="text-xs text-muted">Training dataset</p>
              <p className="truncate text-sm font-semibold">
                {datasetQuery.data?.path || "Dataset path available from training run"}
              </p>
            </div>
            <Button variant="secondary" onClick={() => setDatasetOpen(true)}>
              View
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 auto-rows-fr">
        <Card>
          <CardTitle>Metrics</CardTitle>
          <CardDescription>All metrics saved with this model.</CardDescription>
          <div className="mt-4 space-y-2">
            {metricsEntries.length === 0 ? (
              <p className="text-sm text-muted">No metrics available.</p>
            ) : (
              metricsEntries.map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-panelBorder bg-background p-2"
                >
                  <span className="text-xs text-muted">{key}</span>
                  <span className="text-sm font-semibold">
                    {typeof value === "number" ? value.toFixed(4) : String(value)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardTitle>Raw Firestore Record</CardTitle>
          <CardDescription>Full document payload from Firestore.</CardDescription>
          <div className="mt-4 flex-1 rounded-xl border border-panelBorder bg-background p-3">
            <pre className="no-scrollbar h-full min-h-[18rem] overflow-auto rounded-lg bg-panel/60 p-3 text-xs text-muted">
              {JSON.stringify(modelQuery.data ?? {}, null, 2)}
            </pre>
          </div>
        </Card>
      </div>

      {jsonQuery.data && (
        <Card>
          <CardTitle>JSON Artifacts</CardTitle>
          <CardDescription>Displays stored JSON files if available.</CardDescription>
          <div className="mt-4">
            <div className="rounded-xl border border-panelBorder bg-background p-3">
              <p className="text-xs text-muted">{jsonQuery.data.filename}</p>
              <pre className="mt-2 max-h-72 overflow-auto rounded-lg bg-panel/60 p-3 text-xs text-muted">
                {JSON.stringify(jsonQuery.data.data, null, 2)}
              </pre>
            </div>
          </div>
        </Card>
      )}

      {datasetOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          onClick={() => setDatasetOpen(false)}
        >
          <div
            className="w-full max-w-6xl rounded-3xl border border-panelBorder bg-panel/95 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-panelBorder px-7 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Dataset</p>
                <h3 className="text-xl font-semibold">Training data</h3>
                <p className="mt-1 text-xs text-muted">
                  {datasetQuery.data?.path ?? "Loading dataset path..."}
                </p>
              </div>
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-full border border-panelBorder/60 p-0 hover:border-accent/60"
                onClick={() => setDatasetOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="max-h-[70vh] overflow-auto p-6">
              {datasetQuery.isLoading ? (
                <p className="text-sm text-muted">Loading dataset...</p>
              ) : datasetQuery.data ? (
                <div className="overflow-auto rounded-2xl border border-panelBorder bg-background">
                  <table className="min-w-full text-left text-xs">
                    <thead className="sticky top-0 bg-panel/90 text-muted">
                      <tr>
                        {datasetQuery.data.columns.map((col) => (
                          <th key={col} className="border-b border-panelBorder px-3 py-2">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {datasetQuery.data.rows.map((row, idx) => (
                        <tr key={idx} className="odd:bg-panel/40">
                          {datasetQuery.data.columns.map((col) => (
                            <td key={`${idx}-${col}`} className="border-b border-panelBorder px-3 py-2 text-muted">
                              {String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted">Dataset not available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
