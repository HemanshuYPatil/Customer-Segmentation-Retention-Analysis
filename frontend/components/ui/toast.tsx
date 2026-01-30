"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone?: "success" | "error" | "info";
};

type ToastContextValue = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const value = useMemo(
    () => ({
      toasts,
      push: (toast: Omit<Toast, "id">) => {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { ...toast, id }]);
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3200);
      },
      remove: (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id))
    }),
    [toasts]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function ToastViewport() {
  const ctx = useToast();
  return (
    <div
      className="fixed bottom-5 right-5 z-[200] flex max-w-[360px] flex-col gap-3"
      role="status"
      aria-live="polite"
    >
      {ctx.toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-xl border bg-panel px-4 py-3 text-sm text-text shadow-lg",
            toast.tone === "success" && "border-success/50",
            toast.tone === "error" && "border-danger/50",
            toast.tone === "info" && "border-accent/50"
          )}
        >
          <div className="flex items-start gap-2">
            <span
              className={cn(
                "mt-1 inline-flex h-2.5 w-2.5 shrink-0 rounded-full",
                toast.tone === "success" && "bg-success",
                toast.tone === "error" && "bg-danger",
                toast.tone === "info" && "bg-accent"
              )}
            />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && (
                <p className="text-xs text-muted">{toast.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
