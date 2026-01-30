"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", loading = false, disabled, children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-accent/60 disabled:opacity-50";
    const styles = {
      primary: "bg-accent text-white hover:opacity-90 shadow-glow",
      secondary: "bg-panel border border-panelBorder text-text hover:bg-accentSoft",
      ghost: "bg-transparent text-text hover:bg-panel",
      danger: "bg-danger text-white hover:opacity-90",
    } as const;
    return (
      <button
        ref={ref}
        className={cn(base, styles[variant], className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span className="mr-2 inline-flex h-4 w-4 animate-spin items-center justify-center rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";