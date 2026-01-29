"use client";

export default function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-10 w-10">
        <span className="absolute inset-0 rounded-full border-2 border-panelBorder" />
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-accent" />
      </div>
      <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
    </div>
  );
}
