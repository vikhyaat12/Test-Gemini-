"use client";

import { useEffect, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   SITE POPUP — Admin-controlled promotional/informational popup
   Loads from /api/popups, supports delay/exit-intent triggers,
   premium animation, and mobile-responsive layout.
   ═══════════════════════════════════════════════════════════════ */

type Popup = {
  id: string;
  title: string;
  heading: string;
  text: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
  placement: string;
  trigger: string;
  delay: number;
  enabled: boolean;
  visible: boolean;
  width: number;
  borderRadius: number;
  overlayOpacity: number;
  animation: string;
  desktopOnly: boolean;
};

export default function SitePopup() {
  const [popup, setPopup] = useState<Popup | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Check if popup was already dismissed this session
  const checkDismissed = useCallback((id: string) => {
    try {
      const sessionKey = `popup_dismissed_${id}`;
      return sessionStorage.getItem(sessionKey) === "1";
    } catch {
      return false;
    }
  }, []);

  const dismiss = useCallback(() => {
    if (!popup) return;
    setVisible(false);
    setDismissed(true);
    try {
      sessionStorage.setItem(`popup_dismissed_${popup.id}`, "1");
    } catch {}
  }, [popup]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const loadPopup = async () => {
      try {
        const res = await fetch("/api/popups");
        const data = await res.json();
        if (cancelled) return;

        const popups = data.popups || [];
        if (popups.length === 0) return;

        // Pick first active popup not yet dismissed
        const active = popups.find((p: Popup) => !checkDismissed(p.id));
        if (!active) return;

        // Check desktop-only on mobile
        if (active.desktopOnly && window.innerWidth < 768) return;

        setPopup(active);

        // Apply trigger
        if (active.trigger === "delay") {
          const delayMs = (active.delay || 3) * 1000;
          timer = setTimeout(() => {
            if (!cancelled) setVisible(true);
          }, delayMs);
        } else if (active.trigger === "exit") {
          const handler = (e: MouseEvent) => {
            if (e.clientY <= 0 && !cancelled) {
              setVisible(true);
              document.removeEventListener("mouseleave", handler);
            }
          };
          document.addEventListener("mouseleave", handler);
          return () => document.removeEventListener("mouseleave", handler);
        } else {
          // "load" trigger
          setVisible(true);
        }
      } catch {
        // Silently fail — popup is optional
      }
    };

    loadPopup();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [checkDismissed]);

  if (!popup || !visible || dismissed) return null;

  const animStyle: React.CSSProperties =
    popup.animation === "slide-up"
      ? { animation: "popupSlideUp 0.4s ease-out" }
      : popup.animation === "slide-right"
      ? { animation: "popupSlideRight 0.4s ease-out" }
      : { animation: "popupFadeIn 0.3s ease-out" };

  return (
    <>
      <style>{`
        @keyframes popupFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popupSlideUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popupSlideRight { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }
        @media (prefers-reduced-motion: reduce) {
          @keyframes popupFadeIn, @keyframes popupSlideUp, @keyframes popupSlideRight { from, to { animation: none; } }
        }
      `}</style>
      {/* Overlay */}
      <div
        onClick={dismiss}
        style={{
          position: "fixed",
          inset: 0,
          background: `rgba(0,0,0,${popup.overlayOpacity})`,
          zIndex: 9998,
          animation: "popupFadeIn 0.3s ease-out",
        }}
      />
      {/* Popup card */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: `min(${popup.width}px, 92vw)`,
          maxHeight: "85vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: popup.borderRadius,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          zIndex: 9999,
          ...animStyle,
        }}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          aria-label="Close popup"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.06)",
            cursor: "pointer",
            fontSize: 16,
            display: "grid",
            placeItems: "center",
            zIndex: 1,
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
        >
          ✕
        </button>

        {/* Image */}
        {popup.imageUrl && (
          <img
            src={popup.imageUrl}
            alt={popup.heading || popup.title}
            style={{
              width: "100%",
              maxHeight: 280,
              objectFit: "cover",
              borderRadius: `${popup.borderRadius}px ${popup.borderRadius}px 0 0`,
            }}
          />
        )}

        {/* Content */}
        <div style={{ padding: "28px 32px 32px" }}>
          {popup.heading && (
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: 22,
                fontWeight: 700,
                fontFamily: "var(--font-fraunces), Georgia, serif",
                color: "var(--ink)",
              }}
            >
              {popup.heading}
            </h3>
          )}
          {popup.text && (
            <p
              style={{
                margin: "0 0 20px",
                fontSize: 14,
                lineHeight: 1.7,
                color: "var(--muted)",
              }}
            >
              {popup.text}
            </p>
          )}
          {popup.buttonText && popup.buttonUrl && (
            <a
              href={popup.buttonUrl}
              onClick={dismiss}
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: "var(--purple, #2A0F3A)",
                color: "#fff",
                borderRadius: 100,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                textDecoration: "none",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#5d3575")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--purple, #2A0F3A)")}
            >
              {popup.buttonText}
            </a>
          )}
        </div>
      </div>
    </>
  );
}
