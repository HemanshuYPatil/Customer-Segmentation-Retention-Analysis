"use client";

import { Bell, Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { collection, doc, limit, onSnapshot, orderBy, query, serverTimestamp, writeBatch } from "firebase/firestore";
import { driver } from "driver.js";
import { gsap } from "gsap";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { usePathname } from "next/navigation";

type NotificationItem = {
  id: string;
  title?: string;
  detail?: string;
  level?: "success" | "info" | "warning" | "error";
  created_at?: { toDate?: () => Date } | null;
  read_at?: { toDate?: () => Date } | null;
  type?: string;
  prediction_id?: string;
  model_id?: string;
  queue_id?: string | null;
  count?: number;
};

export default function Topbar() {
  const topbarRef = useRef<HTMLDivElement | null>(null);
  const tourButtonRef = useRef<HTMLButtonElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const notificationListRef = useRef<HTMLDivElement | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const { user } = useAuth();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const previewCount = 4;
  const visibleNotifications = notificationsExpanded
    ? notifications
    : notifications.slice(0, previewCount);

  useEffect(() => {
    if (!topbarRef.current) return;
    gsap.fromTo(
      topbarRef.current,
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", clearProps: "transform" }
    );
    if (tourButtonRef.current) {
      gsap.fromTo(
        tourButtonRef.current,
        { scale: 0.98 },
        { scale: 1, duration: 0.6, ease: "power2.out", delay: 0.1 }
      );
    }
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;
    const handlePointerDown = (event: MouseEvent | PointerEvent) => {
      if (!notificationRef.current) return;
      if (!notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen || !notificationPanelRef.current) return;
    gsap.fromTo(
      notificationPanelRef.current,
      { y: -8, opacity: 0, scale: 0.98 },
      {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
        clearProps: "opacity"
      }
    );
  }, [notificationsOpen]);

  useEffect(() => {
    if (notificationsOpen || !notificationPanelRef.current) return;
    gsap.set(notificationPanelRef.current, { clearProps: "opacity" });
  }, [notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen) {
      setNotificationsExpanded(false);
    }
  }, [notificationsOpen]);

  useEffect(() => {
    if (!notificationsOpen || !notificationPanelRef.current || !notificationListRef.current) return;
    const panel = notificationPanelRef.current;
    const list = notificationListRef.current;
    const maxPanelWidth = Math.min(420, window.innerWidth - 24);
    const minPanelWidth = Math.min(320, window.innerWidth - 24);
    const nextWidth = notificationsExpanded ? maxPanelWidth : minPanelWidth;
    const maxListHeight = Math.min(list.scrollHeight, window.innerHeight * 0.5);
    const nextListHeight = notificationsExpanded ? maxListHeight : list.scrollHeight;

    gsap.to(panel, {
      width: nextWidth,
      duration: 0.25,
      ease: "power2.out"
    });
    gsap.to(list, {
      height: nextListHeight,
      duration: 0.28,
      ease: "power2.out"
    });

    if (notificationsExpanded) {
      gsap.fromTo(
        list.children,
        { y: 6, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.2, stagger: 0.04, ease: "power2.out" }
      );
    }
  }, [notificationsExpanded, notificationsOpen, visibleNotifications.length]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setNotificationsLoading(false);
      setNotificationsError(null);
      return;
    }
    setNotificationsLoading(true);
    setNotificationsError(null);
    const notificationsRef = collection(db, "tenants", user.uid, "notifications");
    const q = query(notificationsRef, orderBy("created_at", "desc"), limit(50));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<NotificationItem, "id">)
        }));
        setNotifications(items);
        setNotificationsLoading(false);
      },
      (error) => {
        console.error("[notifications] subscribe failed", error);
        setNotificationsError("Unable to load notifications.");
        setNotificationsLoading(false);
      }
    );
    return () => unsub();
  }, [user?.uid, user]);

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const levelToneMap: Record<string, string> = {
    success: "bg-emerald-400/20 text-emerald-300",
    info: "bg-panelBorder text-muted",
    warning: "bg-amber-400/20 text-amber-300",
    error: "bg-danger/20 text-danger"
  };
  const levelDotMap: Record<string, string> = {
    success: "bg-emerald-400",
    info: "bg-muted",
    warning: "bg-amber-400",
    error: "bg-danger"
  };

  const formatTimeAgo = (value?: { toDate?: () => Date } | null) => {
    if (!value?.toDate) return "Just now";
    const date = value.toDate();
    const diffMs = Date.now() - date.getTime();
    if (diffMs < 60000) return "Just now";
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    const unread = notifications.filter((item) => !item.read_at).slice(0, 50);
    if (unread.length === 0) {
      setNotificationsOpen(false);
      return;
    }
    const batch = writeBatch(db);
    unread.forEach((item) => {
      batch.update(doc(db, "tenants", user.uid, "notifications", item.id), {
        read_at: serverTimestamp()
      });
    });
    await batch.commit();
  };

  const startTour = () => {
    const tour = driver({
      showProgress: true,
      allowClose: true,
      steps: [
        {
          element: "[data-tour='brand']",
          popover: {
            title: "CSR Identity",
            description:
              "Your workspace brand. It keeps the context of Customer Segmentation & Retention visible across the app."
          }
        },
        {
          element: "[data-tour='nav-dashboard']",
          popover: {
            title: "Dashboard",
            description:
              "Start here for a snapshot of churn trends, segment movement, and high‑level KPIs."
          }
        },
        {
          element: "[data-tour='metric-health']",
          popover: {
            title: "System Health",
            description:
              "Shows FastAPI uptime status (for example: ok). If it’s not ok, data refreshes may be delayed."
          }
        },
        {
          element: "[data-tour='metric-accuracy']",
          popover: {
            title: "Best Accuracy",
            description:
              "Latest churn model performance. Use this to track the strongest model version."
          }
        },
        {
          element: "[data-tour='metric-cost']",
          popover: {
            title: "Business Cost",
            description:
              "Lower is better. This reflects the cost trade‑off of false churn predictions."
          }
        },
        {
          element: "[data-tour='metric-segments']",
          popover: {
            title: "Active Segments",
            description:
              "Current persona clusters discovered by the model. More clusters means finer targeting."
          }
        },
        {
          element: "[data-tour='segment-distribution']",
          popover: {
            title: "Active Segment Distribution",
            description:
              "Visual split of customers across segments so you can see which cohorts dominate."
          }
        },
        {
          element: "[data-tour='latest-predictions']",
          popover: {
            title: "Latest Predictions",
            description:
              "Track high‑risk customers and high‑value segments to trigger retention programs."
          }
        },
        {
          element: "[data-tour='nav-train']",
          popover: {
            title: "Train Model",
            description:
              "Upload fresh datasets, configure training, and generate your latest segmentation model."
          }
        },
        {
          element: "[data-tour='nav-predictions']",
          popover: {
            title: "Prediction Console",
            description:
              "Run churn predictions, filter by cohort, and inspect risk scores customer‑by‑customer."
          }
        },
        {
          element: "[data-tour='nav-models']",
          popover: {
            title: "Model Management",
            description:
              "Compare model performance, deploy the best version, and track drift over time."
          }
        },
        {
          element: "[data-tour='account-menu']",
          popover: {
            title: "Account & Settings",
            description:
              "Update profile details, switch themes, and manage access or sign out securely."
          }
        },
        {
          element: "[data-tour='tour-button']",
          popover: {
            title: "Replay Tour",
            description:
              "Need a refresher? Launch this guided tour anytime from here."
          }
        }
      ]
    });
    tour.drive();
  };

  return (
    <div
      ref={topbarRef}
      className="relative z-40 flex items-center justify-between rounded-xl border border-panelBorder bg-panel/80 px-4 py-3"
    >
      <div data-tour="topbar-title">
        <p className="text-xs uppercase text-muted">Customer Segmentation Suite</p>
        <h1 className="text-lg font-semibold">Retention Intelligence Hub</h1>
      </div>
      <div className="flex items-center gap-3">
        {pathname === "/" && (
          <Button
            ref={tourButtonRef}
            variant="secondary"
            className="gap-2"
            onClick={startTour}
            data-tour="tour-button"
          >
            <Compass size={16} />
            Guided Tour
          </Button>
        )}
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            className="relative"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
          <div
            ref={notificationPanelRef}
            className={`absolute right-0 top-full z-[999] mt-3 w-80 max-h-[80vh] rounded-2xl border border-panelBorder bg-background p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition ${
              notificationsOpen
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0"
            }`}
            style={{
              transform: notificationsOpen ? "translateY(0)" : "translateY(-10px)"
            }}
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex items-center justify-between pb-3">
              <div>
                <p className="text-xs uppercase text-muted">Notifications</p>
                <p className="text-sm font-semibold">Latest activity</p>
                <p className="text-xs text-muted">
                  {notificationsExpanded
                    ? `Showing ${notifications.length} alerts`
                    : `Showing ${previewCount} of ${notifications.length}`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="text-xs text-accent hover:text-accent/80"
                  onClick={handleMarkAllRead}
                >
                  Mark all read
                </button>
                <button
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-panelBorder text-muted transition hover:border-accent/60 hover:text-text"
                  onClick={() => setNotificationsOpen(false)}
                  aria-label="Close notifications"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
            <div
              className="space-y-3 overflow-y-auto overflow-x-hidden pr-1"
              ref={notificationListRef}
              style={{ maxHeight: "50vh" }}
            >
              {notificationsLoading && (
                <div className="rounded-xl border border-panelBorder bg-panel/70 p-3 text-xs text-muted">
                  Loading notifications...
                </div>
              )}
              {notificationsError && (
                <div className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-xs text-danger">
                  {notificationsError}
                </div>
              )}
              {!notificationsLoading && !notificationsError && visibleNotifications.length === 0 && (
                <div className="rounded-xl border border-panelBorder bg-panel/70 p-3 text-xs text-muted">
                  No notifications yet. We will update you when training or prediction jobs finish.
                </div>
              )}
              {visibleNotifications.map((item) => {
                const tone = levelToneMap[item.level ?? "info"] ?? levelToneMap.info;
                const dotTone = levelDotMap[item.level ?? "info"] ?? levelDotMap.info;
                const isUnread = !item.read_at;
                const timeLabel = formatTimeAgo(item.created_at);
                const [timeValue, ...timeRest] = timeLabel.split(" ");
                const timeSuffix = timeRest.join(" ");
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-panelBorder bg-panel/70 p-3 transition hover:border-accent/60"
                    onClick={() => setNotificationsOpen(false)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        setNotificationsOpen(false);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold">{item.title ?? "Notification"}</p>
                        <p className="text-xs text-muted">{item.detail ?? "Activity update."}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 self-start">
                        <div className="inline-flex items-center gap-2 rounded-full border border-panelBorder bg-panel/90 px-2.5 py-1 text-[11px] text-text shadow-[0_8px_20px_rgba(0,0,0,0.18)]">
                          <span className={`h-1.5 w-1.5 rounded-full ${dotTone}`} />
                          <span className="font-semibold text-text">{timeValue}</span>
                          {timeSuffix && <span className="text-[10px] uppercase tracking-wide text-muted">{timeSuffix}</span>}
                        </div>
                        {isUnread && <span className="h-2 w-2 rounded-full bg-accent" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 border-t border-panelBorder pt-3">
              <button
                className="w-full rounded-lg border border-panelBorder bg-panel px-3 py-2 text-xs font-semibold text-muted transition hover:border-accent/60 hover:text-text"
                onClick={() => setNotificationsExpanded((prev) => !prev)}
              >
                {notificationsExpanded ? "Show fewer alerts" : "View more chats"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
