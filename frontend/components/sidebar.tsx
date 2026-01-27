"use client";

import Link from "next/link";
import { LayoutDashboard, UploadCloud, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Onboarding", icon: UploadCloud },
  { href: "/predictions", label: "Prediction Console", icon: Users },
  { href: "/models", label: "Model Management", icon: Settings }
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden h-full w-60 flex-col gap-4 border border-panelBorder bg-panel/80 p-4 lg:flex">
      <div className="rounded-lg border border-panelBorder bg-background px-3 py-2">
        <p className="text-xs uppercase text-muted">Tenant</p>
        <p className="text-sm font-semibold">Enterprise Workspace</p>
      </div>
      <nav className="space-y-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                active ? "bg-accentSoft text-text" : "text-muted hover:bg-panelBorder/50 hover:text-text"
              )}
            >
              <Icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-xl border border-panelBorder bg-background p-3 text-xs text-muted">
        Auth placeholder ready for Clerk/NextAuth.
      </div>
    </aside>
  );
}
