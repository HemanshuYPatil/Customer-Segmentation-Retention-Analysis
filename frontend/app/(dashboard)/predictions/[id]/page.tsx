"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { api } from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { X } from "lucide-react";

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString();
}

function getRiskBadge(churn: number, ltv: number) {
  if (churn >= 0.7) return { label: "High Risk", tone: "danger" as const };
  if (churn >= 0.4) return { label: "At Risk", tone: "warning" as const };
  if (ltv >= 1000 && churn < 0.3) return { label: "Loyal", tone: "success" as const };
  return { label: "Stable", tone: "neutral" as const };
}

export default function SinglePredictionPage() {
  const params = useParams<{ id: string }>();
  const predictionId = params?.id as string;
  const router = useRouter();
  const { push } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [deleteText, setDeleteText] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const predictionQuery = useQuery({
    queryKey: ["prediction", predictionId],
    queryFn: () => api.predictionDetail(predictionId),
    enabled: Boolean(predictionId),
    refetchInterval: 5000
  });

  const result = predictionQuery.data?.result as
    | {
        customer_id?: number;
        segment?: number;
        churn_probability?: number;
        ltv_estimate?: number;
        recommended_action?: string;
      }
    | undefined;

  const churn = Number(result?.churn_probability ?? 0);
  const ltv = Number(result?.ltv_estimate ?? 0);
  const risk = getRiskBadge(churn, ltv);
  const currentLabel = (predictionQuery.data as any)?.label ?? "";

  const handleUpdate = async () => {
    if (!predictionId) return;
    setUpdating(true);
    try {
      await api.updatePrediction(predictionId, { label: editLabel.trim() || null });
      push({ title: "Prediction updated.", tone: "success" });
      predictionQuery.refetch();
    } catch {
      push({ title: "Update failed.", description: "Try again.", tone: "error" });
    } finally {
      setUpdating(false);
      setEditOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!predictionId) return;
    setDeleting(true);
    try {
      await api.deletePrediction(predictionId);
      push({ title: "Prediction deleted.", tone: "success" });
      router.push("/predictions");
    } catch {
      push({ title: "Delete failed.", description: "Try again.", tone: "error" });
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
      setDeleteText("");
    }
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Single Prediction</CardTitle>
          <CardDescription>Review the latest prediction output.</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setEditLabel(currentLabel);
              setEditOpen(true);
            }}
          >
            Edit
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-panelBorder bg-background p-4">
        {predictionQuery.isLoading ? (
          <p className="text-sm text-muted">Loading prediction...</p>
        ) : predictionQuery.isError ? (
          <p className="text-sm text-danger">Unable to load prediction.</p>
        ) : !result ? (
          <p className="text-sm text-muted">Prediction not ready yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-panelBorder bg-panel p-3">
              <p className="text-xs text-muted">Customer</p>
              <p className="text-sm font-semibold">{result.customer_id ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-panelBorder bg-panel p-3">
              <p className="text-xs text-muted">Segment</p>
              <p className="text-sm font-semibold">{formatNumber(result.segment)}</p>
            </div>
            <div className="rounded-lg border border-panelBorder bg-panel p-3">
              <p className="text-xs text-muted">Churn probability</p>
              <p className="text-sm font-semibold">{formatPercent(result.churn_probability)}</p>
            </div>
            <div className="rounded-lg border border-panelBorder bg-panel p-3">
              <p className="text-xs text-muted">LTV estimate</p>
              <p className="text-sm font-semibold">{formatNumber(result.ltv_estimate)}</p>
            </div>
            <div className="rounded-lg border border-panelBorder bg-panel p-3 md:col-span-2">
              <p className="text-xs text-muted">Recommended action</p>
              <p className="text-sm font-semibold">{result.recommended_action ?? "—"}</p>
            </div>
            <div className="rounded-lg border border-panelBorder bg-panel p-3 md:col-span-2">
              <p className="text-xs text-muted">Risk</p>
              <div className="mt-2 flex items-center">
                <Badge tone={risk.tone}>{risk.label}</Badge>
              </div>
            </div>
          </div>
        )}
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-panelBorder bg-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-panelBorder px-6 py-4">
              <div>
                <p className="text-xs uppercase text-muted">Prediction</p>
                <h3 className="text-lg font-semibold">Update label</h3>
              </div>
              <Button
                variant="ghost"
                className="h-9 w-9 p-0"
                onClick={() => setEditOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-xl border border-panelBorder bg-background p-3">
                <p className="text-xs text-muted">Prediction ID</p>
                <p className="text-sm font-semibold">{predictionId}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Label</p>
                <Input
                  value={editLabel}
                  onChange={(event) => setEditLabel(event.target.value)}
                  placeholder="Add a label"
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={() => setEditOpen(false)} disabled={updating}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleUpdate} loading={updating}>
                  Save changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setDeleteOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-panelBorder bg-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-panelBorder px-6 py-4">
              <div>
                <p className="text-xs uppercase text-muted">Delete prediction</p>
                <h3 className="text-lg font-semibold">Confirm deletion</h3>
              </div>
              <Button
                variant="ghost"
                className="h-9 w-9 p-0"
                onClick={() => setDeleteOpen(false)}
                aria-label="Close"
              >
                <X size={16} />
              </Button>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-xl border border-panelBorder bg-background p-3">
                <p className="text-xs text-muted">Prediction ID</p>
                <p className="text-sm font-semibold">{predictionId}</p>
              </div>
              <div>
                <p className="text-xs text-muted">Type the prediction ID to confirm</p>
                <Input
                  value={deleteText}
                  onChange={(event) => setDeleteText(event.target.value)}
                  placeholder={predictionId}
                />
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button variant="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  disabled={deleteText.trim() !== predictionId}
                  loading={deleting}
                >
                  Delete prediction
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
