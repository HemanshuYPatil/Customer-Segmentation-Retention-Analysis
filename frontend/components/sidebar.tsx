"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  UploadCloud,
  Users,
  Settings,
  ChevronRight,
  X,
  Palette,
  Shield,
  Bell,
  Database,
  Plug,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload-dataset", label: "Upload Dataset", icon: UploadCloud },
  { href: "/predictions", label: "Prediction Console", icon: Users },
  { href: "/models", label: "Model Management", icon: Settings }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"account" | "settings" | null>(null);
  const [settingsTab, setSettingsTab] = useState<
    "appearance" | "notifications" | "security" | "data" | "integrations"
  >("appearance");
  const [theme, setTheme] = useState("ocean");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const themeOptions = [
    { value: "ocean", label: "Ocean Blue" },
    { value: "slate", label: "Slate Violet" },
    { value: "ember", label: "Ember Orange" },
    { value: "emerald", label: "Emerald Teal" }
  ];

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const stored = window.localStorage.getItem("cs-theme");
    const initial = stored ?? "ocean";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("cs-theme", theme);
  }, [theme]);

  const closeModal = () => setActiveModal(null);

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
      <div className="mt-auto relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center gap-3 rounded-xl border border-panelBorder bg-background px-3 py-3 text-left"
        >
          <div className="h-10 w-10 overflow-hidden rounded-full border border-panelBorder">
            <div className="flex h-full w-full items-center justify-center bg-accentSoft text-sm font-semibold text-text">
              AJ
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Aisha Johnson</p>
            <p className="text-xs text-muted">@aisha.j</p>
          </div>
          <ChevronRight size={16} className={cn("text-muted transition", open && "translate-x-0.5")} />
        </button>
        <div
          className={cn(
            "pointer-events-none absolute bottom-2 left-full ml-3 w-44 rounded-xl border border-panelBorder bg-background p-2 text-sm opacity-0 shadow-lg transition-all duration-200",
            open && "pointer-events-auto opacity-100"
          )}
          style={{
            transform: open ? "translateX(0)" : "translateX(-10px)"
          }}
        >
          <button
            className="w-full rounded-md px-3 py-2 text-left text-muted hover:bg-panelBorder/50 hover:text-text"
            onClick={() => {
              setOpen(false);
              setActiveModal("account");
            }}
          >
            Account
          </button>
          <button
            className="w-full rounded-md px-3 py-2 text-left text-muted hover:bg-panelBorder/50 hover:text-text"
            onClick={() => {
              setOpen(false);
              setActiveModal("settings");
            }}
          >
            Settings
          </button>
          <button className="w-full rounded-md px-3 py-2 text-left text-danger hover:bg-panelBorder/50">
            Log out
          </button>
        </div>
      </div>
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="w-full max-w-4xl rounded-2xl border border-panelBorder bg-panel">
            <div className="flex items-center justify-between border-b border-panelBorder px-6 py-4">
              <div>
                <p className="text-xs uppercase text-muted">Workspace</p>
                <h3 className="text-lg font-semibold">
                  {activeModal === "settings" ? "Settings" : "Account"}
                </h3>
              </div>
              <Button variant="ghost" className="h-9 w-9 p-0" onClick={closeModal} aria-label="Close">
                <X size={16} />
              </Button>
            </div>

            {activeModal === "settings" ? (
              <div className="grid gap-4 p-6 md:grid-cols-[220px_1fr]">
                <div className="space-y-2 rounded-xl border border-panelBorder bg-background p-3">
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                      settingsTab === "appearance"
                        ? "bg-accentSoft text-text"
                        : "text-muted hover:bg-panelBorder/50 hover:text-text"
                    )}
                    onClick={() => setSettingsTab("appearance")}
                  >
                    <Palette size={16} />
                    Appearance
                  </button>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                      settingsTab === "notifications"
                        ? "bg-accentSoft text-text"
                        : "text-muted hover:bg-panelBorder/50 hover:text-text"
                    )}
                    onClick={() => setSettingsTab("notifications")}
                  >
                    <Bell size={16} />
                    Notifications
                  </button>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                      settingsTab === "security"
                        ? "bg-accentSoft text-text"
                        : "text-muted hover:bg-panelBorder/50 hover:text-text"
                    )}
                    onClick={() => setSettingsTab("security")}
                  >
                    <Shield size={16} />
                    Security
                  </button>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                      settingsTab === "data"
                        ? "bg-accentSoft text-text"
                        : "text-muted hover:bg-panelBorder/50 hover:text-text"
                    )}
                    onClick={() => setSettingsTab("data")}
                  >
                    <Database size={16} />
                    Data & Storage
                  </button>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                      settingsTab === "integrations"
                        ? "bg-accentSoft text-text"
                        : "text-muted hover:bg-panelBorder/50 hover:text-text"
                    )}
                    onClick={() => setSettingsTab("integrations")}
                  >
                    <Plug size={16} />
                    Integrations
                  </button>
                </div>
                <div className="rounded-xl border border-panelBorder bg-background p-4">
                  {settingsTab === "appearance" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold">Theme</p>
                        <p className="text-xs text-muted">
                          Enterprise dark mode with accent highlights.
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Color theme</p>
                        <div className="mt-2">
                          <Select value={theme} onChange={(e) => setTheme(e.target.value)}>
                            {themeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-panelBorder bg-panel p-3">
                          <p className="text-xs text-muted">Primary accent</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="h-4 w-4 rounded-full bg-accent" />
                            <p className="text-sm font-semibold">Sky Blue</p>
                          </div>
                        </div>
                        <div className="rounded-lg border border-panelBorder bg-panel p-3">
                          <p className="text-xs text-muted">Typography</p>
                          <p className="mt-2 text-sm font-semibold">Bitcount Single</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === "notifications" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold">Alerts</p>
                        <p className="text-xs text-muted">
                          Control when you receive model and churn alerts.
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-panelBorder bg-panel p-3">
                          <p className="text-xs text-muted">Churn spikes</p>
                          <p className="mt-2 text-sm font-semibold">Enabled</p>
                        </div>
                        <div className="rounded-lg border border-panelBorder bg-panel p-3">
                          <p className="text-xs text-muted">Training completion</p>
                          <p className="mt-2 text-sm font-semibold">Enabled</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === "security" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold">Security</p>
                        <p className="text-xs text-muted">
                          Manage access, sessions, and audit controls.
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-panelBorder bg-panel p-3">
                          <p className="text-xs text-muted">MFA</p>
                          <p className="mt-2 text-sm font-semibold">Required</p>
                        </div>
                        <div className="rounded-lg border border-panelBorder bg-panel p-3">
                          <p className="text-xs text-muted">Session timeout</p>
                          <p className="mt-2 text-sm font-semibold">8 hours</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === "data" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold">Data & Storage</p>
                        <p className="text-xs text-muted">
                          Control retention windows and storage regions.
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-panelBorder bg-panel p-3">
                          <p className="text-xs text-muted">Retention</p>
                          <p className="mt-2 text-sm font-semibold">18 months</p>
                        </div>
                        <div className="rounded-lg border border-panelBorder bg-panel p-3">
                          <p className="text-xs text-muted">Storage region</p>
                          <p className="mt-2 text-sm font-semibold">US East</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === "integrations" && (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold">Integrations</p>
                        <p className="text-xs text-muted">
                          Manage active connections for data ingestion.
                        </p>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg border border-panelBorder bg-panel p-3">
                          <p className="text-xs text-muted">CRM</p>
                          <p className="mt-2 text-sm font-semibold">Salesforce</p>
                        </div>
                        <div className="rounded-lg border border-panelBorder bg-panel p-3">
                          <p className="text-xs text-muted">Data warehouse</p>
                          <p className="mt-2 text-sm font-semibold">Snowflake</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 p-6 md:grid-cols-[220px_1fr]">
                <div className="rounded-xl border border-panelBorder bg-background p-4 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-accentSoft text-lg font-semibold">
                    AJ
                  </div>
                  <p className="text-sm font-semibold">Aisha Johnson</p>
                  <p className="text-xs text-muted">@aisha.j</p>
                  <div className="mt-3 rounded-lg border border-panelBorder bg-panel p-3 text-left">
                    <p className="text-xs text-muted">Plan</p>
                    <p className="text-sm font-semibold">Enterprise Growth</p>
                  </div>
                </div>
                <div className="rounded-xl border border-panelBorder bg-background p-4">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-accent" />
                    <p className="text-sm font-semibold">Account details</p>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg border border-panelBorder bg-panel p-3">
                      <p className="text-xs text-muted">Email</p>
                      <p className="text-sm font-semibold">aisha.j@enterprise.com</p>
                    </div>
                    <div className="rounded-lg border border-panelBorder bg-panel p-3">
                      <p className="text-xs text-muted">Role</p>
                      <p className="text-sm font-semibold">Admin</p>
                    </div>
                    <div className="rounded-lg border border-panelBorder bg-panel p-3">
                      <p className="text-xs text-muted">Team</p>
                      <p className="text-sm font-semibold">Retention Ops</p>
                    </div>
                    <div className="rounded-lg border border-panelBorder bg-panel p-3">
                      <p className="text-xs text-muted">Last login</p>
                      <p className="text-sm font-semibold">Today, 09:22 AM</p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-panelBorder bg-panel p-3">
                    <p className="text-xs text-muted">API access</p>
                    <p className="text-sm font-semibold">Enabled</p>
                    <p className="mt-1 text-xs text-muted">Key: sk-live-****-9f2a</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
