"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { useMemo } from "react";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";

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
  const { user } = useAuth();
  const [queueJobs, setQueueJobs] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      setQueueJobs([]);
      return;
    }
    const jobsRef = collection(db, "tenants", user.uid, "queue_jobs");
    const q = query(jobsRef, orderBy("created_at", "asc"), limit(200));
    const unsub = onSnapshot(q, (snapshot) => {
      setQueueJobs(snapshot.docs.map((doc) => ({ ...doc.data(), queue_id: doc.id })));
    });
    return () => unsub();
  }, [user]);
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

  const trainingJobs = useMemo(
    () => queueJobs.filter((job) => job.kind === "training"),
    [queueJobs]
  );

  const defaultId = defaultQuery.data?.model_id ?? "";

  const modelRows = useMemo(() => {
    const rows = modelsQuery.data ?? [];
    return [...rows].sort(
      (a: any, b: any) => getTimestampMs(b.created_at) - getTimestampMs(a.created_at)
    );
  }, [modelsQuery.data]);
  const pendingModels = useMemo(() => {
    const visible = new Set(["queued", "processing", "failed", "canceled"]);
    return (trainingJobs ?? [])
      .filter((job: any) => visible.has(job.status))
      .map((job: any) => ({
        tempId: job.queue_id,
        name: job.payload?.model_label || "Training job",
        createdAt: job.created_at,
        status: job.status || "queued",
        started_at: job.started_at,
        duration_ms: job.duration_ms
      }));
  }, [trainingJobs]);

  const hasRows = pendingModels.length + modelRows.length > 0;

  const latestModel = modelRows[0];
  const latestAccuracy =
    latestModel?.metrics?.logreg_acc ?? metricsQuery.data?.logreg_acc;
  const latestF1 = latestModel?.metrics?.logreg_f1 ?? metricsQuery.data?.logreg_f1;

  const formatDuration = (ms: number) => {
    if (!Number.isFinite(ms) || ms <= 0) return "—";
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes <= 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const avgTrainingMs = useMemo(() => {
    const completed = trainingJobs
      .filter((job) => job.status === "completed" && typeof job.duration_ms === "number")
      .sort((a, b) => getTimestampMs(b.completed_at ?? b.updated_at) - getTimestampMs(a.completed_at ?? a.updated_at))
      .slice(0, 5);
    if (completed.length === 0) return 4 * 60 * 1000;
    const total = completed.reduce((sum, job) => sum + Number(job.duration_ms || 0), 0);
    return Math.max(30000, total / completed.length);
  }, [trainingJobs]);

  const trainingEtaById = useMemo(() => {
    const active = trainingJobs
      .filter((job) => ["queued", "processing"].includes(job.status))
      .sort((a, b) => getTimestampMs(a.created_at) - getTimestampMs(b.created_at));
    let cumulative = 0;
    const map = new Map<string, number>();
    active.forEach((job) => {
      const expected = avgTrainingMs;
      let remaining = expected;
      if (job.status === "processing" && job.started_at) {
        const elapsed = Date.now() - getTimestampMs(job.started_at);
        remaining = Math.max(expected - elapsed, 5000);
      }
      cumulative += remaining;
      map.set(job.queue_id, cumulative);
    });
    return map;
  }, [trainingJobs, avgTrainingMs]);

  return (
    <Card>
      <CardTitle>Model Management</CardTitle>
      <CardDescription>Review trained models and manage production default.</CardDescription>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-panelBorder bg-background p-3">
          <p className="text-xs text-muted">Latest model accuracy</p>
          <p className="text-2xl font-semibold">
            {typeof latestAccuracy === "number"
              ? `${(latestAccuracy * 100).toFixed(1)}%`
              : "--"}
          </p>
        </div>
        <div className="rounded-lg border border-panelBorder bg-background p-3">
          <p className="text-xs text-muted">Latest model F1 score</p>
          <p className="text-2xl font-semibold">
            {typeof latestF1 === "number" ? latestF1.toFixed(2) : "--"}
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
                    <Badge
                      className={
                        model.status === "failed"
                          ? "border-danger/50 bg-danger/15 text-danger"
                          : model.status === "canceled"
                            ? "border-panelBorder bg-panel text-muted"
                            : model.status === "processing"
                              ? "border-sky-400/50 bg-sky-400/15 text-sky-300"
                              : "border-amber-400/50 bg-amber-400/15 text-amber-300"
                      }
                    >
                      {["queued", "processing"].includes(model.status) && (
                        <span className="mr-1 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      )}
                      {model.status === "failed"
                        ? "Failed"
                        : model.status === "canceled"
                          ? "Canceled"
                          : model.status === "processing"
                            ? "Processing"
                            : "Queued"}
                    </Badge>
                    {["queued", "processing"].includes(model.status) && (
                      <p className="mt-1 text-xs text-muted">
                        ETA ~ {formatDuration(trainingEtaById.get(model.tempId) ?? 0)}
                      </p>
                    )}
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
                      <Badge className="border-emerald-400/50 bg-emerald-400/15 text-emerald-300">
                        Available
                      </Badge>
                    )}
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
