"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import PredictionTable from "@/components/prediction-table";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const sampleRows = [
  { customerId: "C-1042", churnProbability: 0.82, ltv: 1240, segment: "High-Risk" },
  { customerId: "C-1183", churnProbability: 0.26, ltv: 780, segment: "Growth" },
  { customerId: "C-1205", churnProbability: 0.44, ltv: 560, segment: "At-Risk" },
  { customerId: "C-1321", churnProbability: 0.12, ltv: 980, segment: "Loyalist" },
  { customerId: "C-1457", churnProbability: 0.64, ltv: 430, segment: "Watchlist" }
];

export default function PredictionsPage() {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    if (!query) return sampleRows;
    return sampleRows.filter((row) => row.customerId.toLowerCase().includes(query.toLowerCase()));
  }, [query]);

  return (
    <Card>
      <CardTitle>Prediction Console</CardTitle>
      <CardDescription>Searchable view of latest churn and LTV predictions.</CardDescription>
      <div className="mt-3 flex items-center gap-3">
        <Input
          placeholder="Search customer ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="mt-4">
        <PredictionTable rows={rows} />
      </div>
    </Card>
  );
}
