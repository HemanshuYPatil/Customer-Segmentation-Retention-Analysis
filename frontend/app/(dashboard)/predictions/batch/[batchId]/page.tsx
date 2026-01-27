"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

const batchRows = [
  { customerId: "C-1042", churnProbability: 0.82, ltv: 1240, segment: "High-Risk" },
  { customerId: "C-1183", churnProbability: 0.26, ltv: 780, segment: "Growth" },
  { customerId: "C-1205", churnProbability: 0.44, ltv: 560, segment: "At-Risk" },
  { customerId: "C-1321", churnProbability: 0.12, ltv: 980, segment: "Loyalist" },
  { customerId: "C-1457", churnProbability: 0.64, ltv: 430, segment: "Watchlist" }
];

const sortOptions = [
  { value: "churn_desc", label: "Churn probability (high to low)" },
  { value: "churn_asc", label: "Churn probability (low to high)" },
  { value: "ltv_desc", label: "LTV (high to low)" },
  { value: "ltv_asc", label: "LTV (low to high)" }
];

const segmentOptions = ["All", "High-Risk", "Growth", "At-Risk", "Loyalist", "Watchlist"];

export default function BatchPredictionDetailPage() {
  const params = useParams();
  const batchId = typeof params.batchId === "string" ? params.batchId : params.batchId?.[0];
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("churn_desc");
  const [segmentFilter, setSegmentFilter] = useState("All");

  const filteredRows = useMemo(() => {
    let rows = batchRows;
    if (search) {
      rows = rows.filter((row) => row.customerId.toLowerCase().includes(search.toLowerCase()));
    }
    if (segmentFilter !== "All") {
      rows = rows.filter((row) => row.segment === segmentFilter);
    }
    const sorted = [...rows];
    if (sortBy === "churn_desc") sorted.sort((a, b) => b.churnProbability - a.churnProbability);
    if (sortBy === "churn_asc") sorted.sort((a, b) => a.churnProbability - b.churnProbability);
    if (sortBy === "ltv_desc") sorted.sort((a, b) => b.ltv - a.ltv);
    if (sortBy === "ltv_asc") sorted.sort((a, b) => a.ltv - b.ltv);
    return sorted;
  }, [search, sortBy, segmentFilter]);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Batch predictions</CardTitle>
          <CardDescription>
            Results for batch <span className="text-text">{batchId}</span>
          </CardDescription>
        </div>
        <Link href="/predictions" className="text-sm text-muted hover:text-text">
          Back to batches
        </Link>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-panelBorder bg-background p-4">
          <p className="text-xs text-muted">Status</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone="success">Completed</Badge>
            <p className="text-sm font-semibold">Jan 27, 2026 15:05</p>
          </div>
        </div>
        <div className="rounded-xl border border-panelBorder bg-background p-4">
          <p className="text-xs text-muted">Model</p>
          <p className="mt-2 text-sm font-semibold">Retail v3</p>
        </div>
        <div className="rounded-xl border border-panelBorder bg-background p-4">
          <p className="text-xs text-muted">Customers</p>
          <p className="mt-2 text-sm font-semibold">12,480</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
        <Input
          placeholder="Search customer ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)}>
          {segmentOptions.map((segment) => (
            <option key={segment} value={segment}>
              {segment}
            </option>
          ))}
        </Select>
        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Button variant="secondary">Export CSV</Button>
      </div>

      <div className="mt-4 rounded-xl border border-panelBorder bg-panel">
        <Table>
          <THead>
            <TR>
              <TH>Customer ID</TH>
              <TH>Churn Probability</TH>
              <TH>Predicted LTV</TH>
              <TH>Segment</TH>
            </TR>
          </THead>
          <TBody>
            {filteredRows.map((row) => (
              <TR key={row.customerId}>
                <TD className="font-medium">{row.customerId}</TD>
                <TD>{(row.churnProbability * 100).toFixed(1)}%</TD>
                <TD>${row.ltv.toFixed(2)}</TD>
                <TD>{row.segment}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}

