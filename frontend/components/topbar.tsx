"use client";

import { Bell, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Topbar() {
  return (
    <div className="flex items-center justify-between rounded-xl border border-panelBorder bg-panel/80 px-4 py-3">
      <div>
        <p className="text-xs uppercase text-muted">Customer Segmentation Suite</p>
        <h1 className="text-lg font-semibold">Retention Intelligence Hub</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" className="gap-2">
          <Sparkles size={16} />
          Launch Insight
        </Button>
        <Button variant="ghost">
          <Bell size={18} />
        </Button>
      </div>
    </div>
  );
}
