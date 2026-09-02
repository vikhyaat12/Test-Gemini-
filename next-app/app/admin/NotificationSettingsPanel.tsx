"use client";

import React, { useState, useEffect } from "react";
import type { OrderNotificationRule, OrderNotificationEvent } from "@/lib/commerce/store-extensions";

const defaultNotificationRules: Record<OrderNotificationEvent, OrderNotificationRule> = {
  order_placed: {
    event: "order_placed",
    title: "Order Placed",
    email: true,
    sms: false,
    whatsapp: false,
    template: "Hello {{customer_name}}, your Queens Care order #{{order_id}} for ₹{{order_total}} has been received and is being prepared.",
  },
  order_confirmed: {
    event: "order_confirmed",
    title: "Order Confirmed",
    email: true,
    sms: false,
    whatsapp: false,
    template: "Hello {{customer_name}}, order #{{order_id}} has been verified and confirmed by our clinical fulfilment centre.",
  },
  order_dispatched: {
    event: "order_dispatched",
    title: "Order Dispatched",
    email: true,
    sms: true,
    whatsapp: false,
    template: "Hello {{customer_name}}, your order #{{order_id}} has been dispatched via courier. Tracking Number: {{tracking_number}}.",
  },
  order_delivered: {
    event: "order_delivered",
    title: "Order Delivered",
    email: true,
    sms: true,
    whatsapp: false,
    template: "Hello {{customer_name}}, your order #{{order_id}} has been delivered. Thank you for choosing Queens Care Laboratories.",
  },
  order_cancelled: {
    event: "order_cancelled",
    title: "Order Cancelled",
    email: true,
    sms: false,
    whatsapp: false,
    template: "Hello {{customer_name}}, order #{{order_id}} has been cancelled. If this was a mistake, please contact support.",
  },
  order_refunded: {
    event: "order_refunded",
    title: "Refund Processed",
    email: true,
    sms: false,
    whatsapp: false,
    template: "Hello {{customer_name}}, your refund of ₹{{order_total}} for order #{{order_id}} has been processed to your original payment method.",
  },
};

export default function NotificationSettingsPanel() {
  const [rules, setRules] = useState<Record<OrderNotificationEvent, OrderNotificationRule>>(defaultNotificationRules);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [activeTab, setActiveTab] = useState<OrderNotificationEvent>("order_placed");

  useEffect(() => {
    fetch("/api/admin/notifications/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.rules) setRules(d.rules);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/notifications/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rules),
      });
      if (res.ok) {
        setFeedback({ type: "success", msg: "Order notification channels & message templates saved successfully." });
      } else {
        setFeedback({ type: "error", msg: "Failed to save notification rules." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const currentRule = rules[activeTab] || defaultNotificationRules[activeTab];

  const updateCurrentRule = (patch: Partial<OrderNotificationRule>) => {
    setRules({
      ...rules,
      [activeTab]: {
        ...currentRule,
        ...patch,
      },
    });
  };

  const insertVariable = (token: string) => {
    const newTemplate = (currentRule.template || "") + " " + token;
    updateCurrentRule({ template: newTemplate });
  };

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24, borderRadius: 6, maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Customer Communication
          </span>
          <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>
            🔔 Order Notification Matrix & Templates
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Control which channels (Email, SMS, WhatsApp) fire for each order lifecycle event and customize the message templates.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "9px 24px",
            background: "var(--purple)",
            color: "#D4AF37",
            border: "none",
            borderRadius: 4,
            fontWeight: 700,
            fontSize: 13,
            cursor: saving ? "wait" : "pointer",
            boxShadow: "0 2px 8px rgba(42,15,58,0.2)",
          }}
        >
          {saving ? "Saving…" : "💾 Save Notification Matrix"}
        </button>
      </div>

      {feedback && (
        <div
          style={{
            padding: "12px 16px",
            marginBottom: 20,
            borderRadius: 4,
            background: feedback.type === "success" ? "#e9f7e9" : "#fde8e8",
            border: `1px solid ${feedback.type === "success" ? "#c3e6cb" : "#f8b4b4"}`,
            color: feedback.type === "success" ? "#2e7d32" : "#b34141",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {feedback.type === "success" ? "✓ " : "✕ "}
          {feedback.msg}
        </div>
      )}

      {/* Event Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, borderBottom: "1px solid var(--line)", paddingBottom: 10, flexWrap: "wrap" }}>
        {(Object.keys(rules) as OrderNotificationEvent[]).map((evtKey) => {
          const rule = rules[evtKey];
          const activeCount = (rule.email ? 1 : 0) + (rule.sms ? 1 : 0) + (rule.whatsapp ? 1 : 0);
          return (
            <button
              key={evtKey}
              type="button"
              onClick={() => setActiveTab(evtKey)}
              style={{
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 700,
                borderRadius: 4,
                border: "none",
                background: activeTab === evtKey ? "var(--purple)" : "#f5f3ef",
                color: activeTab === evtKey ? "#D4AF37" : "var(--ink)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span>{rule.title}</span>
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 10,
                  background: activeTab === evtKey ? "#ffffff25" : "rgba(0,0,0,0.08)",
                  color: activeTab === evtKey ? "#fff" : "var(--muted)",
                }}
              >
                {activeCount} on
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Event Editor */}
      <div style={{ background: "#faf8f5", padding: 20, borderRadius: 6, border: "1px solid var(--line)", marginBottom: 20 }}>
        <h4 style={{ font: "18px var(--font-display)", color: "var(--purple)", margin: "0 0 16px" }}>
          Trigger: {currentRule.title}
        </h4>

        {/* Channel Toggles */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
          {/* Email */}
          <div style={{ background: "#fff", padding: 14, borderRadius: 4, border: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <b style={{ fontSize: 13, display: "block" }}>📧 Email</b>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Direct SMTP Delivery</span>
            </div>
            <input
              type="checkbox"
              checked={currentRule.email}
              onChange={(e) => updateCurrentRule({ email: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: "var(--purple)" }}
            />
          </div>

          {/* SMS */}
          <div style={{ background: "#fff", padding: 14, borderRadius: 4, border: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <b style={{ fontSize: 13, display: "block" }}>📱 SMS</b>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Mobile Carrier Gateway</span>
            </div>
            <input
              type="checkbox"
              checked={currentRule.sms}
              onChange={(e) => updateCurrentRule({ sms: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: "var(--purple)" }}
            />
          </div>

          {/* WhatsApp */}
          <div style={{ background: "#fff", padding: 14, borderRadius: 4, border: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <b style={{ fontSize: 13, display: "block" }}>💬 WhatsApp</b>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>Meta Cloud Business</span>
            </div>
            <input
              type="checkbox"
              checked={currentRule.whatsapp}
              onChange={(e) => updateCurrentRule({ whatsapp: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: "var(--purple)" }}
            />
          </div>
        </div>

        {/* Dynamic Variable Chips */}
        <div style={{ marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)", display: "block", marginBottom: 6 }}>
            Click to insert dynamic variable tags:
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              ["{{customer_name}}", "Customer Name"],
              ["{{order_id}}", "Order ID"],
              ["{{order_total}}", "Order Total (₹)"],
              ["{{tracking_number}}", "Tracking Code"],
              ["{{delivery_date}}", "Est. Delivery Date"],
              ["{{order_status}}", "Order Status"],
            ].map(([token, label]) => (
              <button
                key={token}
                type="button"
                onClick={() => insertVariable(token)}
                style={{
                  padding: "4px 8px",
                  fontSize: 11,
                  background: "#fff",
                  border: "1px solid var(--line)",
                  borderRadius: 3,
                  cursor: "pointer",
                  color: "var(--purple)",
                  fontWeight: 600,
                }}
                title={label}
              >
                + {token}
              </button>
            ))}
          </div>
        </div>

        {/* Template Textarea */}
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
            Message Template
          </label>
          <textarea
            rows={4}
            value={currentRule.template}
            onChange={(e) => updateCurrentRule({ template: e.target.value })}
            style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13, fontFamily: "inherit" }}
          />
        </div>
      </div>

      {/* Live Sample Preview */}
      <div style={{ padding: 16, background: "#f0ebfa", borderRadius: 6, border: "1px solid rgba(42,15,58,0.15)" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--purple)", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
          Sample Customer Message Render:
        </span>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: "var(--purple)" }}>
          {currentRule.template
            .replace("{{customer_name}}", "Dr. Rajesh Sharma")
            .replace("{{order_id}}", "QC882242")
            .replace("{{order_total}}", "1,550")
            .replace("{{tracking_number}}", "BLUEDART-99210")
            .replace("{{delivery_date}}", "2-3 business days")
            .replace("{{order_status}}", currentRule.title)}
        </p>
      </div>
    </div>
  );
}
