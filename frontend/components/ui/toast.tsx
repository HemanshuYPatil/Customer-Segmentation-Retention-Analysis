"use client";

import { createContext, ReactNode, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Toast = { id: string; title: string; tone?: "success" | "error" | "info" };

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
    <div className="fixed right-5 top-5 z-50 flex flex-col gap-3">
      {ctx.toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "rounded-lg border px-4 py-3 text-sm shadow-lg",
            toast.tone === "success" && "border-success/50 bg-success/10 text-success",
            toast.tone === "error" && "border-danger/50 bg-danger/10 text-danger",
            toast.tone === "info" && "border-accent/50 bg-accentSoft text-text"
          )}
        >
          {toast.title}
        </div>
      ))}
    </div>
  );
}
