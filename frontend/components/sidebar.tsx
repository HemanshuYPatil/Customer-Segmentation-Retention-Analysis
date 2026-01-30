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
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { gsap } from "gsap";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/onboarding", label: "Train Model", icon: UploadCloud },
  { href: "/predictions", label: "Prediction Console", icon: Users },
  { href: "/models", label: "Model Management", icon: Settings }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<"account" | "settings" | null>(null);
  const [settingsTab, setSettingsTab] = useState<
    "appearance" | "notifications" | "security" | "data"
  >("appearance");
  const [theme, setTheme] = useState("ocean");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const { user } = useAuth();
  const initials =
    (user?.displayName || user?.email || "")
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "??";
  const displayName =
    user?.displayName || user?.email?.split("@")[0] || "Signed in";
  const displayEmail = user?.email || "No email";
  const greetingName =
    user?.displayName?.split(" ").filter(Boolean)[0] ||
    user?.email?.split("@")[0] ||
    "there";
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
    if (!activeModal) return;
    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      if (!modalRef.current) return;
      if (!modalRef.current.contains(event.target as Node)) {
        setActiveModal(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveModal(null);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeModal]);

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

  useEffect(() => {
    if (!logoRef.current) return;
    gsap.fromTo(
      logoRef.current,
      { y: 6, opacity: 0, letterSpacing: "0.1em" },
      { y: 0, opacity: 1, letterSpacing: "0.35em", duration: 0.8, ease: "power2.out" }
    );
  }, []);

  const closeModal = () => setActiveModal(null);

  return (
    <aside className="hidden h-full w-60 flex-col gap-4 border border-panelBorder bg-panel/80 p-4 lg:flex">
      <div className="flex items-center justify-center py-2" data-tour="brand">
        <div
          ref={logoRef}
          className="text-4xl font-semibold tracking-[0.35em] text-text"
        >
          CSR
        </div>
      </div>
      <nav className="space-y-1.5" data-tour="nav">
        {nav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          const tourId =
            item.href === "/"
              ? "nav-dashboard"
              : item.href === "/onboarding"
                ? "nav-train"
                : item.href === "/predictions"
                  ? "nav-predictions"
                  : item.href === "/models"
                    ? "nav-models"
                    : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              data-tour={tourId}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                active
                  ? "bg-accentSoft text-text shadow-[0_10px_18px_rgba(0,0,0,0.2)]"
                  : "text-muted hover:bg-panelBorder/60 hover:text-text"
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
          className="group flex w-full items-center gap-3 rounded-2xl border border-panelBorder bg-background px-3 py-3 text-left shadow-[0_8px_18px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-accent/60 hover:bg-panel/70"
          data-tour="account-menu"
        >
          <div className="h-11 w-11 overflow-hidden rounded-full border border-panelBorder bg-panel">
            <div className="flex h-full w-full items-center justify-center bg-accent/15 text-sm font-semibold text-text">
              {initials}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold" title={displayName}>
              {displayName}
            </p>
            <p className="truncate text-xs text-muted" title={displayEmail}>
              {displayEmail}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-panelBorder bg-panel transition group-hover:border-accent/60">
            <ChevronRight
              size={14}
              className={cn("text-muted transition", open && "translate-x-0.5")}
            />
          </div>
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
          <button
            onClick={() => signOut(auth)}
            className="w-full rounded-md px-3 py-2 text-left text-danger hover:bg-panelBorder/50"
          >
            Log out
          </button>
        </div>
      </div>
      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={() => setActiveModal(null)}
          aria-hidden="true"
        >
          <div
            ref={modalRef}
            className="w-full max-w-5xl rounded-3xl border border-panelBorder bg-panel/95 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-panelBorder px-7 py-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Workspace</p>
                <h3 className="text-xl font-semibold">
                  {activeModal === "settings" ? "Settings" : "Account"}
                </h3>
                <p className="mt-1 text-xs text-muted">
                  {activeModal === "settings"
                    ? "Personalize your workspace preferences."
                    : "Review your profile and access details."}
                </p>
              </div>
              <Button
                variant="ghost"
                className="h-9 w-9 rounded-full border border-panelBorder/60 p-0 hover:border-accent/60"
                onClick={closeModal}
                aria-label="Close"
              >
                <X size={16} />
              </Button>
            </div>

            {activeModal === "settings" ? (
              <div className="grid max-h-[78vh] gap-5 overflow-y-auto p-7 md:grid-cols-[240px_1fr]">
                <div className="space-y-2 rounded-2xl border border-panelBorder bg-background/80 p-3">
                  <p className="px-2 text-[11px] uppercase tracking-[0.18em] text-muted">
                    Preferences
                  </p>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                      settingsTab === "appearance"
                        ? "bg-accentSoft text-text shadow-[0_10px_18px_rgba(0,0,0,0.18)]"
                        : "text-muted hover:bg-panelBorder/60 hover:text-text"
                    )}
                    onClick={() => setSettingsTab("appearance")}
                  >
                    <Palette size={16} />
                    Appearance
                  </button>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                      settingsTab === "notifications"
                        ? "bg-accentSoft text-text shadow-[0_10px_18px_rgba(0,0,0,0.18)]"
                        : "text-muted hover:bg-panelBorder/60 hover:text-text"
                    )}
                    onClick={() => setSettingsTab("notifications")}
                  >
                    <Bell size={16} />
                    Notifications
                  </button>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                      settingsTab === "security"
                        ? "bg-accentSoft text-text shadow-[0_10px_18px_rgba(0,0,0,0.18)]"
                        : "text-muted hover:bg-panelBorder/60 hover:text-text"
                    )}
                    onClick={() => setSettingsTab("security")}
                  >
                    <Shield size={16} />
                    Security
                  </button>
                  <button
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition",
                      settingsTab === "data"
                        ? "bg-accentSoft text-text shadow-[0_10px_18px_rgba(0,0,0,0.18)]"
                        : "text-muted hover:bg-panelBorder/60 hover:text-text"
                    )}
                    onClick={() => setSettingsTab("data")}
                  >
                    <Database size={16} />
                    Data & Storage
                  </button>
                </div>
                <div className="rounded-2xl border border-panelBorder bg-background p-5">
                  {settingsTab === "appearance" && (
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm font-semibold">Theme</p>
                        <p className="text-xs text-muted">
                          Enterprise dark mode with accent highlights.
                        </p>
                      </div>
                      <div className="rounded-xl border border-panelBorder bg-panel/60 p-3">
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
                        <div className="rounded-xl border border-panelBorder bg-panel/60 p-3">
                          <p className="text-xs text-muted">Primary accent</p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="h-4 w-4 rounded-full bg-accent" />
                            <p className="text-sm font-semibold">Sky Blue</p>
                          </div>
                        </div>
                        <div className="rounded-xl border border-panelBorder bg-panel/60 p-3">
                          <p className="text-xs text-muted">Typography</p>
                          <p className="mt-2 text-sm font-semibold">Bitcount Single</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === "notifications" && (
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm font-semibold">Alerts</p>
                        <p className="text-xs text-muted">
                          Control when you receive model and churn alerts.
                        </p>
                      </div>
                      <div className="rounded-xl border border-panelBorder bg-panel/60 p-3">
                        <p className="text-xs text-muted">
                          Configure notification rules in your admin console.
                        </p>
                      </div>
                    </div>
                  )}

                  {settingsTab === "security" && (
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm font-semibold">Security</p>
                        <p className="text-xs text-muted">
                          Manage access, sessions, and audit controls.
                        </p>
                      </div>
                      <div className="rounded-xl border border-panelBorder bg-panel/60 p-3">
                        <p className="text-xs text-muted">
                          Security policies are managed by your identity provider.
                        </p>
                      </div>
                    </div>
                  )}

                  {settingsTab === "data" && (
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm font-semibold">Data & Storage</p>
                        <p className="text-xs text-muted">
                          Control retention windows and storage regions.
                        </p>
                      </div>
                      <div className="rounded-xl border border-panelBorder bg-panel/60 p-3">
                        <p className="text-xs text-muted">
                          Storage settings are configured per tenant in the admin console.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            ) : (
              <div className="grid max-h-[78vh] gap-5 overflow-y-auto p-7 md:grid-cols-[240px_1fr]">
                <div className="rounded-2xl border border-panelBorder bg-background p-5">
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-panelBorder bg-accentSoft text-lg font-semibold">
                      {initials}
                    </div>
                    <p className="truncate text-sm font-semibold">{displayName}</p>
                    <p className="truncate text-xs text-muted">{displayEmail}</p>
                    <span className="mt-3 rounded-full border border-panelBorder bg-panel px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted">
                      Active
                    </span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-panelBorder bg-background p-5">
                    <div className="flex items-center gap-2">
                      <User size={16} className="text-accent" />
                      <p className="text-sm font-semibold">Account details</p>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-panelBorder bg-panel/60 p-3">
                        <p className="text-xs text-muted">Full name</p>
                        <p className="truncate text-sm font-semibold">{displayName}</p>
                      </div>
                      <div className="rounded-xl border border-panelBorder bg-panel/60 p-3">
                        <p className="text-xs text-muted">Email</p>
                        <p className="truncate text-sm font-semibold">{displayEmail}</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-panelBorder bg-background p-5">
                    <p className="text-sm font-semibold">Security</p>
                    <p className="mt-1 text-xs text-muted">
                      Authentication and access are managed through your identity provider.
                    </p>
                    <div className="mt-4 rounded-xl border border-panelBorder bg-panel/60 p-3">
                      <p className="text-xs text-muted">Session</p>
                      <p className="text-sm font-semibold">Standard access</p>
                    </div>
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
