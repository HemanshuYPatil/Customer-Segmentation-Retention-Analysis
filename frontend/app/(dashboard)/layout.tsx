"use client";

import { ReactNode } from "react";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import AuthGuard from "@/components/auth-guard";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideTopbar =
    (pathname?.startsWith("/models/") && pathname !== "/models") ||
    (pathname?.startsWith("/predictions/") && pathname !== "/predictions");

  return (
    <div className="h-screen bg-background text-text">
      <div className="bg-grid h-screen">
        <div className="flex h-full w-full gap-4 px-0 py-0">
          <Sidebar />
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              {!hideTopbar && <Topbar />}
              <AuthGuard>
                <div className="mt-4 space-y-4">{children}</div>
              </AuthGuard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
