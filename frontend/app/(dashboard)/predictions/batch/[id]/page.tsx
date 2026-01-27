"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<"customer" | "churn" | "ltv">("churn");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [rows, setRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loadingRows, setLoadingRows] = useState(false);

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
      <CardTitle>Batch Results</CardTitle>
      <CardDescription>
        Showing {total} customers. Use filters or download the full CSV.
      </CardDescription>

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
    </Card>
  );
}
