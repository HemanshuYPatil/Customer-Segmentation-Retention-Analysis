import { ReactNode } from "react";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen bg-background text-text">
      <div className="bg-grid h-screen">
        <div className="flex h-full w-full gap-4 px-0 py-0">
          <Sidebar />
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <Topbar />
              <div className="mt-4 space-y-4">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
