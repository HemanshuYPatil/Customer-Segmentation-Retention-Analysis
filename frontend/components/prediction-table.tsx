"use client";

import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";

type Prediction = {
  customerId: string;
  churnProbability: number;
  ltv: number;
  segment: string;
};

export default function PredictionTable({ rows }: { rows: Prediction[] }) {
  return (
    <div className="rounded-xl border border-panelBorder bg-panel">
      <Table>
        <THead>
          <TR>
            <TH>Customer</TH>
            <TH>Churn Probability</TH>
            <TH>Predicted LTV</TH>
            <TH>Segment</TH>
          </TR>
        </THead>
        <TBody>
          {rows.map((row) => {
            const tone =
              row.churnProbability > 0.7
                ? "danger"
                : row.churnProbability > 0.4
                ? "warning"
                : "success";
            return (
              <TR key={row.customerId}>
                <TD className="font-medium">{row.customerId}</TD>
                <TD>
                  <Badge tone={tone}>{(row.churnProbability * 100).toFixed(1)}%</Badge>
                </TD>
                <TD>${row.ltv.toFixed(2)}</TD>
                <TD>{row.segment}</TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
