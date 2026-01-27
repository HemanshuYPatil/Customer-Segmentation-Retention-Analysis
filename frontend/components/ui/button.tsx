"use client";

import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent/60 disabled:opacity-50";
  const styles = {
    primary: "bg-accent text-white hover:opacity-90 shadow-glow",
    secondary: "bg-panel border border-panelBorder text-text hover:bg-accentSoft",
    ghost: "bg-transparent text-text hover:bg-panel",
    danger: "bg-danger text-white hover:opacity-90"
  } as const;
  return <button className={cn(base, styles[variant], className)} {...props} />;
}
