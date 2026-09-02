"use client";

import { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("qc_visitor_id");
  if (!id) {
    id = generateId();
    localStorage.setItem("qc_visitor_id", id);
  }
  return id;
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem("qc_session_id");
  if (!id) {
    id = generateId();
    sessionStorage.setItem("qc_session_id", id);
  }
  return id;
}

function getDevice(): string {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function getUTMParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const sp = new URLSearchParams(window.location.search);
  return {
    utmSource: sp.get("utm_source") || "",
    utmMedium: sp.get("utm_medium") || "",
    utmCampaign: sp.get("utm_campaign") || "",
  };
}

function sendEvents(events: Record<string, unknown>[]) {
  if (events.length === 0) return;
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify({ events })], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
    } else {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {}
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastPageRef = useRef("");
  const sentEventIds = useRef<Set<string>>(new Set());
  const pageViewTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trackEvent = useCallback((event: string, extra: Record<string, unknown> = {}) => {
    const id = generateId();
    if (sentEventIds.current.has(id)) return;
    sentEventIds.current.add(id);

    const utm = getUTMParams();
    const evt = {
      eventId: id,
      event,
      page: typeof window !== "undefined" ? window.location.pathname + window.location.search : "",
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      device: getDevice(),
      browser: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 100) : "",
      source: typeof document !== "undefined" ? document.referrer : "",
      ...utm,
      ...extra,
    };

    sendEvents([evt]);
  }, []);

  // Track page views on navigation
  useEffect(() => {
    if (!pathname) return;
    const page = pathname;
    if (page === lastPageRef.current) return;
    lastPageRef.current = page;

    if (pageViewTimer.current) clearTimeout(pageViewTimer.current);
    pageViewTimer.current = setTimeout(() => {
      trackEvent("page_view", { page });
    }, 300);

    return () => {
      if (pageViewTimer.current) clearTimeout(pageViewTimer.current);
    };
  }, [pathname, trackEvent]);

  // Track session start
  useEffect(() => {
    const sid = getSessionId();
    const firstVisit = !localStorage.getItem("qc_returning");
    trackEvent(firstVisit ? "new_visitor" : "returning_visitor", {});
    if (!firstVisit) localStorage.setItem("qc_returning", "1");
    trackEvent("session_start", {});

    const handleBeforeUnload = () => {
      trackEvent("session_end", {});
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose global tracking functions
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__qc_track = trackEvent;
    w.__qc_track_product_view = (slug: string, name: string) => trackEvent("product_view", { productSlug: slug, product: name });
    w.__qc_track_add_to_cart = (slug: string, name: string, value?: number) => trackEvent("add_to_cart", { productSlug: slug, product: name, value });
    w.__qc_track_remove_from_cart = (slug: string, name: string) => trackEvent("remove_from_cart", { productSlug: slug, product: name });
    w.__qc_track_cart_view = () => trackEvent("cart_view", {});
    w.__qc_track_checkout_start = () => trackEvent("checkout_start", {});
    w.__qc_track_order_placed = (orderId: string, value: number) => trackEvent("order_placed", { orderId, value });
    w.__qc_track_pdf_download = (slug: string, name: string) => trackEvent("pdf_download", { productSlug: slug, product: name });
    w.__qc_track_search = (query: string) => trackEvent("search", { searchQuery: query });
    w.__qc_track_cta_click = (label: string, page: string) => trackEvent("cta_click", { ctaLabel: label, page });

    return () => {
      delete (w as Record<string, unknown>).__qc_track;
      delete (w as Record<string, unknown>).__qc_track_product_view;
      delete (w as Record<string, unknown>).__qc_track_add_to_cart;
      delete (w as Record<string, unknown>).__qc_track_remove_from_cart;
      delete (w as Record<string, unknown>).__qc_track_cart_view;
      delete (w as Record<string, unknown>).__qc_track_checkout_start;
      delete (w as Record<string, unknown>).__qc_track_order_placed;
      delete (w as Record<string, unknown>).__qc_track_pdf_download;
      delete (w as Record<string, unknown>).__qc_track_search;
      delete (w as Record<string, unknown>).__qc_track_cta_click;
    };
  }, [trackEvent]);

  return null;
}
