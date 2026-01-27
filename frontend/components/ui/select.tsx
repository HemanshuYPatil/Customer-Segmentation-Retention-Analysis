"use client";

import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-panelBorder bg-background px-3 text-sm text-text focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40",
        className
      )}
      {...props}
    />
  );
}
