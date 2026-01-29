"use client";

import { Bell, Compass, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { driver } from "driver.js";
import { gsap } from "gsap";

export default function Topbar() {
  const topbarRef = useRef<HTMLDivElement | null>(null);
  const tourButtonRef = useRef<HTMLButtonElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const notifications = [
    {
      title: "Churn spike detected",
      detail: "West Coast retail segment up 6.2% this week.",
      time: "2m ago",
      tone: "bg-danger/20 text-danger"
    },
    {
      title: "Model retrain complete",
      detail: "Accuracy improved to 93.4% on holdout.",
      time: "27m ago",
      tone: "bg-accent/20 text-accent"
    },
    {
      title: "New cohort unlocked",
      detail: "High-value streaming customers identified.",
      time: "1h ago",
      tone: "bg-emerald-400/20 text-emerald-300"
    },
    {
      title: "Export ready",
      detail: "Latest prediction batch is ready to download.",
      time: "3h ago",
      tone: "bg-panelBorder text-muted"
    }
  ];

  useEffect(() => {
    if (!topbarRef.current) return;
    gsap.fromTo(
      topbarRef.current,
      { y: -10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }
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
      className="flex items-center justify-between rounded-xl border border-panelBorder bg-panel/80 px-4 py-3"
    >
      <div data-tour="topbar-title">
        <p className="text-xs uppercase text-muted">Customer Segmentation Suite</p>
        <h1 className="text-lg font-semibold">Retention Intelligence Hub</h1>
      </div>
      <div className="flex items-center gap-3">
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
        <div className="relative" ref={notificationRef}>
          <Button
            variant="ghost"
            className="relative"
            onClick={() => setNotificationsOpen((prev) => !prev)}
            aria-expanded={notificationsOpen}
            aria-haspopup="dialog"
          >
            <Bell size={18} />
            <span className="absolute right-1 top-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
              3
            </span>
          </Button>
          <div
            ref={notificationPanelRef}
            className={`absolute right-0 top-full z-20 mt-3 w-80 rounded-2xl border border-panelBorder bg-background p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)] transition ${
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
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="text-xs text-accent hover:text-accent/80"
                  onClick={() => setNotificationsOpen(false)}
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
            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item.title}
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
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="text-xs text-muted">{item.detail}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${item.tone}`}>
                        {item.time}
                      </span>
                      <span className="h-2 w-2 rounded-full bg-accent" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-panelBorder pt-3">
              <button
                className="w-full rounded-lg border border-panelBorder bg-panel px-3 py-2 text-xs font-semibold text-muted transition hover:border-accent/60 hover:text-text"
                onClick={() => setNotificationsOpen(false)}
              >
                View all alerts
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
