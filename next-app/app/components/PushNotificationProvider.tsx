"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";

type PushContextType = {
  permission: NotificationPermission;
  isSubscribed: boolean;
  isSupported: boolean;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
};

const PushContext = createContext<PushContextType>({
  permission: "default",
  isSubscribed: false,
  isSupported: false,
  subscribe: async () => false,
  unsubscribe: async () => false,
});

export function usePushNotifications() {
  return useContext(PushContext);
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Check existing subscription
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      });
    }
  }, []);

  const registerServiceWorker = useCallback(async () => {
    if (!("serviceWorker" in navigator)) return null;
    
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    
    await navigator.serviceWorker.ready;
    return registration;
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);

      if (newPermission !== "granted") return false;

      const registration = await registerServiceWorker();
      if (!registration) return false;

      // Get VAPID key
      const res = await fetch("/api/push/vapid-key");
      if (!res.ok) return false;
      const { publicKey } = await res.json();
      if (!publicKey) return false;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // Save subscription to server
      const saveRes = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });

      if (saveRes.ok) {
        setIsSubscribed(true);
        return true;
      }

      return false;
    } catch (err) {
      console.error("Push subscription failed:", err);
      return false;
    }
  }, [isSupported, registerServiceWorker]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        
        // Notify server
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(endpoint)}`, {
          method: "DELETE",
        });
      }

      setIsSubscribed(false);
      return true;
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
      return false;
    }
  }, [isSupported]);

  return (
    <PushContext.Provider value={{ permission, isSubscribed, isSupported, subscribe, unsubscribe }}>
      {children}
    </PushContext.Provider>
  );
}

/**
 * Notification Permission Banner — shown on the public website
 * Allows users to opt in to browser push notifications
 */
export function NotificationPermissionBanner() {
  const { permission, isSupported, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Don't show if not supported, already granted, or dismissed
  if (!isSupported || permission === "granted" || permission === "denied" || dismissed) {
    return null;
  }

  const handleAllow = async () => {
    setSubscribing(true);
    await subscribe();
    setDismissed(true);
    setSubscribing(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Store in session so it doesn't reappear in same session
    try { sessionStorage.setItem("qc-push-dismissed", "1"); } catch {}
  };

  // Check if already dismissed this session
  if (typeof window !== "undefined") {
    try {
      if (sessionStorage.getItem("qc-push-dismissed") === "1") return null;
    } catch {}
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        maxWidth: 480,
        width: "calc(100% - 48px)",
        background: "linear-gradient(135deg, #2A0F3A 0%, #1a0a24 100%)",
        color: "#fff",
        borderRadius: 16,
        padding: "20px 24px",
        boxShadow: "0 8px 32px rgba(42, 15, 58, 0.3), 0 2px 8px rgba(0,0,0,0.1)",
        zIndex: 9999,
        fontFamily: "var(--font-body, system-ui, sans-serif)",
        border: "1px solid rgba(193, 154, 107, 0.3)",
      }}
    >
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notification prompt"
        style={{
          position: "absolute",
          top: 8,
          right: 12,
          background: "none",
          border: "none",
          color: "rgba(255,255,255,0.5)",
          fontSize: 18,
          cursor: "pointer",
          padding: "4px 8px",
        }}
      >
        ×
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "rgba(193, 154, 107, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          🔔
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            style={{
              margin: "0 0 4px",
              fontSize: 15,
              fontWeight: 600,
              fontFamily: "var(--font-display, serif)",
              letterSpacing: "0.02em",
            }}
          >
            Stay Updated
          </h4>
          <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.5, opacity: 0.85 }}>
            Allow Queens Care Laboratories to send important updates such as order status, offers and account notifications.
          </p>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleAllow}
              disabled={subscribing}
              style={{
                padding: "8px 18px",
                background: "linear-gradient(135deg, #C19A6B, #d4ad65)",
                color: "#2A0F3A",
                border: "none",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: subscribing ? "wait" : "pointer",
                letterSpacing: "0.02em",
              }}
            >
              {subscribing ? "Enabling…" : "Allow Notifications"}
            </button>
            <button
              onClick={handleDismiss}
              style={{
                padding: "8px 18px",
                background: "transparent",
                color: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
