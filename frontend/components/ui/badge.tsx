"use client";

import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "success" | "warning" | "danger" | "neutral";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  const styles = {
    success: "bg-success/20 text-success border-success/40",
    warning: "bg-warn/20 text-warn border-warn/40",
    danger: "bg-danger/20 text-danger border-danger/40",
    neutral: "bg-accentSoft text-accent border-accent/40"
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        styles[tone],
        className
      )}
      {...props}
    />
  );
}
