"use client";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type MetricCardProps = {
  title: string;
  value: string;
  subtitle: string;
};

export default function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <Card className="flex flex-col gap-1">
      <CardDescription>{title}</CardDescription>
      <CardTitle className="text-xl">{value}</CardTitle>
      <p className="text-xs text-muted">{subtitle}</p>
    </Card>
  );
}
