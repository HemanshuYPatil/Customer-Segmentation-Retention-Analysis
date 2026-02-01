"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { X } from "lucide-react";

function parseCsv(text: string) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] as any[] };
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.replace(/^"|"$/g, ""));
    const row: any = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx];
    });
    return row;
  });
  return { headers, rows };
}

function getRiskBadge(churn: number, ltv: number) {
  if (churn >= 0.7) return { label: "High Risk", tone: "danger" as const };
  if (churn >= 0.4) return { label: "At Risk", tone: "warning" as const };
  if (ltv >= 1000 && churn < 0.3) return { label: "Loyal", tone: "success" as const };
  return { label: "Stable", tone: "neutral" as const };
}

export default function BatchDetailPage() {
  const params = useParams<{ id: string }>();
  const predictionId = params?.id as string;
  const router = useRouter();
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"customer" | "churn" | "ltv">("churn");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [rows, setRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [deleteText, setDeleteText] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentLabel, setCurrentLabel] = useState("");

  useEffect(() => {
    const loadMeta = async () => {
      if (!predictionId) return;
      try {
        const data = await api.predictionDetail(predictionId);
        setCurrentLabel((data as any)?.label ?? "");
      } catch {
        setCurrentLabel("");
      }
    };
    loadMeta();
  }, [predictionId]);

  useEffect(() => {
    const load = async () => {
      if (!predictionId) return;
      setLoadingRows(true);
      const res = await api.predictionCsv(predictionId);
      const text = await res.text();
      const parsed = parseCsv(text);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setLoadingRows(false);
    };
    load();
  }, [predictionId]);

  const filtered = useMemo(() => {
    const data = query
      ? rows.filter((row) =>
          String(row.CustomerID ?? row.customer_id)
            .toLowerCase()
            .includes(query.toLowerCase())
        )
      : rows;
    const sorted = [...data].sort((a, b) => {
      const valA =
        sortKey === "customer"
          ? String(a.CustomerID ?? a.customer_id)
          : sortKey === "ltv"
          ? Number(a.ltv_estimate ?? 0)
          : Number(a.churn_probability ?? 0);
      const valB =
        sortKey === "customer"
          ? String(b.CustomerID ?? b.customer_id)
          : sortKey === "ltv"
          ? Number(b.ltv_estimate ?? 0)
          : Number(b.churn_probability ?? 0);
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [rows, query, sortKey, sortDir]);

  const total = rows.length;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Batch Results</CardTitle>
          <CardDescription>
            Showing {total} customers. Use filters or download the full CSV.
          </CardDescription>
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Input
          placeholder="Filter by customer ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-xs"
        />
        <Button
          variant="secondary"
          onClick={async () => {
            const data = await api.predictionDownload(predictionId);
            window.open(data.url, "_blank");
          }}
        >
          Download full CSV
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select value={sortKey} onChange={(e) => setSortKey(e.target.value as any)}>
            <option value="churn">Sort by churn</option>
            <option value="ltv">Sort by LTV</option>
            <option value="customer">Sort by customer</option>
          </Select>
          <Select value={sortDir} onChange={(e) => setSortDir(e.target.value as any)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </Select>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-panelBorder bg-background">
        {loadingRows ? (
          <div className="p-4 text-sm text-muted">Loading full results...</div>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Risk</TH>
                {headers.map((header) => (
                  <TH key={header}>{header}</TH>
                ))}
              </TR>
            </THead>
            <TBody>
              {filtered.map((row: any, idx: number) => {
                const churn = Number(row.churn_probability ?? 0);
                const ltv = Number(row.ltv_estimate ?? 0);
                const risk = getRiskBadge(churn, ltv);
                return (
                  <TR key={`${row.CustomerID ?? row.customer_id}-${idx}`}>
                    <TD>
                      <Badge tone={risk.tone}>{risk.label}</Badge>
                    </TD>
                    {headers.map((header) => (
                      <TD key={`${header}-${idx}`}>{row[header]}</TD>
                    ))}
                  </TR>
                );
              })}
            </TBody>
          </Table>
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
                <Button
                  variant="primary"
                  onClick={async () => {
                    if (!predictionId) return;
                    setUpdating(true);
                    try {
                      await api.updatePrediction(predictionId, { label: editLabel.trim() || null });
                      push({ title: "Prediction updated.", tone: "success" });
                      setCurrentLabel(editLabel.trim());
                    } catch {
                      push({ title: "Update failed.", description: "Try again.", tone: "error" });
                    } finally {
                      setUpdating(false);
                      setEditOpen(false);
                    }
                  }}
                  loading={updating}
                >
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
                  onClick={async () => {
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
                  }}
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
