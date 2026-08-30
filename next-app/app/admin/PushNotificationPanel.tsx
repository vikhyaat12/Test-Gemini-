"use client";

import { useState, useEffect, useCallback } from "react";

type PushStats = {
  totalSubscribers: number;
  activeSubscribers: number;
  totalSent: number;
};

type HistoryItem = Record<string, unknown> & {
  id: string;
  title: string;
  message: string;
  status: string;
  sentCount: number;
  failedCount: number;
  expiredCount: number;
  createdAt: string;
  sentAt?: string;
};

export default function PushNotificationPanel() {
  const [tab, setTab] = useState<"send" | "history">("send");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState("/");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string>("");
  const [isError, setIsError] = useState(false);
  const [stats, setStats] = useState<PushStats>({ totalSubscribers: 0, activeSubscribers: 0, totalSent: 0 });
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [vapidConfigured, setVapidConfigured] = useState(true);

  const inputStyle = { width: "100%", padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14 };
  const labelStyle = { fontSize: 11, fontWeight: 600 as const, display: "block" as const, marginBottom: 4 };

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/push/history");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats || {});
        setHistory(data.history || []);
      } else if (res.status === 503) {
        setVapidConfigured(false);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const sendNotification = async (sendTest = false) => {
    if (!title.trim() || !message.trim()) {
      setResult("Title and message are required.");
      setIsError(true);
      return;
    }

    setSending(true);
    setResult("");

    try {
      const body: Record<string, unknown> = { title: title.trim(), message: message.trim(), url: url.trim() || "/" };
      if (sendTest) {
        body.sendTest = true;
      }

      const res = await fetch("/api/admin/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setIsError(false);
        setResult(
          `✅ Sent! Delivered to ${data.sentCount} subscriber(s).` +
          (data.failedCount > 0 ? ` Failed: ${data.failedCount}.` : "") +
          (data.expiredCount > 0 ? ` Expired/removed: ${data.expiredCount}.` : "") +
          (data.totalSubscribers === 0 ? " No active subscribers yet. Users need to visit the website and allow notifications." : "")
        );
        setTitle("");
        setMessage("");
        setUrl("/");
        loadHistory();
      } else if (res.status === 503) {
        setIsError(true);
        setVapidConfigured(false);
        setResult("⚠️ " + (data.error || "Push notifications not configured."));
      } else {
        setIsError(true);
        setResult("❌ " + (data.error || "Failed to send."));
      }
    } catch {
      setIsError(true);
      setResult("❌ Network error. Please try again.");
    }

    setSending(false);
  };

  return (
    <div>
      {/* Setup warning */}
      {!vapidConfigured && (
        <div style={{ padding: "16px 20px", background: "#fff8e1", border: "1px solid #f9e04b", borderRadius: 8, marginBottom: 20 }}>
          <h4 style={{ margin: "0 0 8px", fontSize: 14, color: "#8a6d00" }}>⚠️ Push Notifications Setup Required</h4>
          <p style={{ margin: "0 0 8px", fontSize: 13, color: "#666" }}>
            Web push notifications require VAPID keys in your <code>.env.local</code> file.
          </p>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#666" }}>
            <li>Open <code>.env.local</code> in the next-app folder</li>
            <li>Verify <code>NEXT_PUBLIC_VAPID_PUBLIC_KEY</code> and <code>VAPID_PRIVATE_KEY</code> are set</li>
            <li>Restart the dev server</li>
          </ol>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        <button
          onClick={() => setTab("send")}
          style={{
            padding: "6px 14px",
            fontSize: 12,
            border: tab === "send" ? "1px solid var(--purple)" : "1px solid var(--line)",
            background: tab === "send" ? "var(--purple)" : "#fff",
            color: tab === "send" ? "#fff" : "var(--ink)",
            cursor: "pointer",
          }}
        >
          📤 Send Push Notification
        </button>
        <button
          onClick={() => setTab("history")}
          style={{
            padding: "6px 14px",
            fontSize: 12,
            border: tab === "history" ? "1px solid var(--purple)" : "1px solid var(--line)",
            background: tab === "history" ? "var(--purple)" : "#fff",
            color: tab === "history" ? "#fff" : "var(--ink)",
            cursor: "pointer",
          }}
        >
          📊 History & Stats
        </button>
      </div>

      {/* SEND TAB */}
      {tab === "send" && (
        <div style={{ maxWidth: 700 }}>
          <div style={{ padding: 20, background: "#faf9f7", border: "1px solid var(--line)" }}>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={labelStyle}>Notification Title *</label>
                <input
                  style={inputStyle}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Queens Care Laboratories"
                  maxLength={100}
                />
              </div>
              <div>
                <label style={labelStyle}>Message *</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 80 }}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Your order has been shipped successfully."
                  maxLength={500}
                />
              </div>
              <div>
                <label style={labelStyle}>Click URL</label>
                <input
                  style={inputStyle}
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="/shop or /account/orders"
                />
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--muted)" }}>
                  Where the user goes when they click the notification
                </p>
              </div>
            </div>
          </div>

          {result && (
            <p
              style={{
                padding: "10px 14px",
                background: isError ? "#fde8e8" : "#e9f7e9",
                fontSize: 13,
                color: isError ? "#b34141" : "#2e7d32",
                marginTop: 16,
                borderRadius: 6,
              }}
            >
              {result}
            </p>
          )}

          <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={() => sendNotification(false)}
              disabled={sending || !title.trim() || !message.trim()}
              style={{
                padding: "12px 24px",
                background: "var(--purple)",
                color: "#fff",
                border: "none",
                cursor: sending ? "wait" : "pointer",
                fontSize: 13,
                fontWeight: 600,
                opacity: !title.trim() || !message.trim() ? 0.5 : 1,
              }}
            >
              {sending ? "Sending…" : `📤 Send to All (${stats.activeSubscribers} subscribers)`}
            </button>
            <button
              onClick={() => sendNotification(true)}
              disabled={sending || !title.trim() || !message.trim()}
              style={{
                padding: "12px 24px",
                border: "1px solid var(--gold, #C19A6B)",
                background: "#fff",
                cursor: sending ? "wait" : "pointer",
                fontSize: 13,
                opacity: !title.trim() || !message.trim() ? 0.5 : 1,
              }}
            >
              🧪 Send Test (this browser)
            </button>
          </div>

          <div style={{ marginTop: 20, padding: "14px 18px", background: "#f5f3f0", border: "1px solid var(--line)", borderRadius: 8 }}>
            <h4 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>📱 How Push Notifications Work</h4>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
              <li>When a user visits the website, they see a notification permission prompt</li>
              <li>If they click &quot;Allow Notifications&quot;, their browser creates a PushSubscription</li>
              <li>The subscription is stored on the server</li>
              <li>When you send a push from here, it arrives as a real OS/browser notification</li>
              <li>The user can click the notification to visit the configured URL</li>
              <li>Currently {stats.activeSubscribers} subscriber(s) have opted in</li>
            </ul>
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {tab === "history" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Active Subscribers", value: stats.activeSubscribers, icon: "👥" },
              { label: "Total Subscribers", value: stats.totalSubscribers, icon: "📋" },
              { label: "Notifications Sent", value: stats.totalSent, icon: "📤" },
              { label: "Delivery Rate", value: history.length > 0 ? `${Math.round((history.filter(h => h.status === "sent").length / Math.max(history.length, 1)) * 100)}%` : "—", icon: "📊" },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: "14px 18px", background: "#faf9f7", border: "1px solid var(--line)", borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {stat.icon} {stat.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {loading ? (
            <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 30 }}>Loading…</p>
          ) : history.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 30 }}>
              No push notifications sent yet. Send your first one above!
            </p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Status</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Delivered</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Failed</th>
                  <th style={{ textAlign: "left", padding: "10px 12px", borderBottom: "2px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Sent At</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "10px 12px" }}>{item.title}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          fontSize: 11,
                          borderRadius: 4,
                          background: item.status === "sent" ? "#e8f5e9" : item.status === "failed" ? "#fde8e8" : "#fff8e1",
                          color: item.status === "sent" ? "#2e7d32" : item.status === "failed" ? "#b34141" : "#8a6d00",
                        }}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#2e7d32" }}>{item.sentCount || 0}</td>
                    <td style={{ padding: "10px 12px", color: item.failedCount > 0 ? "#b34141" : "var(--muted)" }}>{item.failedCount || 0}</td>
                    <td style={{ padding: "10px 12px", fontSize: 12, color: "var(--muted)" }}>
                      {item.sentAt ? new Date(String(item.sentAt)).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
