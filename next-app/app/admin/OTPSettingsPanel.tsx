"use client";

import React, { useState, useEffect } from "react";
import type { OTPSettings } from "@/lib/commerce/store-extensions";

const defaultOTPSettings: OTPSettings = {
  emailOtpEnabled: true,
  smsOtpEnabled: false,
  whatsappOtpEnabled: false,
  expiryMinutes: 5,
  maxAttempts: 5,
  resendCooldownSeconds: 60,
  emailProvider: "smtp",
  smsProvider: "unconfigured",
  whatsappProvider: "unconfigured",
};

export default function OTPSettingsPanel() {
  const [settings, setSettings] = useState<OTPSettings>(defaultOTPSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/otp/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/otp/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setFeedback({ type: "success", msg: "OTP authentication channels & security rules saved successfully." });
      } else {
        setFeedback({ type: "error", msg: "Failed to save OTP settings." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const allDisabled = !settings.emailOtpEnabled && !settings.smsOtpEnabled && !settings.whatsappOtpEnabled;

  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24, borderRadius: 6, maxWidth: 840 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
            Security & Authentication
          </span>
          <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>
            🔐 Multi-Channel OTP & Login Verification
          </h3>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
            Configure verification channels (Email, SMS, WhatsApp) for customer signups, logins, and order verifications.
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
          {saving ? "Saving…" : "💾 Save Security Settings"}
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

      {allDisabled && (
        <div style={{ padding: "12px 16px", background: "#fff3cd", border: "1px solid #ffeeba", color: "#856404", borderRadius: 4, marginBottom: 20, fontSize: 13 }}>
          ⚠️ <b>Security Notice:</b> All OTP verification channels are currently disabled. Customers will use password-only authentication.
        </div>
      )}

      {/* Verification Channels */}
      <div style={{ display: "grid", gap: 16, marginBottom: 28 }}>
        <h4 style={{ font: "16px var(--font-display)", color: "var(--purple)", margin: 0 }}>
          1. Verification Channels
        </h4>

        {/* Email OTP Card */}
        <div style={{ padding: 18, border: "1px solid var(--line)", borderRadius: 6, background: settings.emailOtpEnabled ? "#faf8f5" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>📧</span>
              <b style={{ fontSize: 14 }}>Email OTP Verification</b>
              <span style={{ fontSize: 10, padding: "2px 6px", background: "#e8f0fe", color: "#1a73e8", fontWeight: 700, borderRadius: 3 }}>
                SMTP / Nodemailer
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Sends 6-digit cryptographic verification codes to user’s registered email address.
            </p>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: settings.emailOtpEnabled ? "#2e7d32" : "var(--muted)" }}>
              {settings.emailOtpEnabled ? "ENABLED" : "DISABLED"}
            </span>
            <input
              type="checkbox"
              checked={settings.emailOtpEnabled}
              onChange={(e) => setSettings({ ...settings, emailOtpEnabled: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: "var(--purple)" }}
            />
          </label>
        </div>

        {/* SMS OTP Card */}
        <div style={{ padding: 18, border: "1px solid var(--line)", borderRadius: 6, background: settings.smsOtpEnabled ? "#faf8f5" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>📱</span>
              <b style={{ fontSize: 14 }}>SMS OTP Verification</b>
              <span style={{ fontSize: 10, padding: "2px 6px", background: settings.smsApiKey ? "#e9f7e9" : "#fff3cd", color: settings.smsApiKey ? "#2e7d32" : "#856404", fontWeight: 700, borderRadius: 3 }}>
                {settings.smsApiKey ? "PROVIDER CONFIGURED" : "API KEY REQUIRED"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Sends 6-digit SMS code via carrier gateway (Twilio / Fast2SMS / Msg91).
            </p>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: settings.smsOtpEnabled ? "#2e7d32" : "var(--muted)" }}>
              {settings.smsOtpEnabled ? "ENABLED" : "DISABLED"}
            </span>
            <input
              type="checkbox"
              checked={settings.smsOtpEnabled}
              onChange={(e) => setSettings({ ...settings, smsOtpEnabled: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: "var(--purple)" }}
            />
          </label>
        </div>

        {/* WhatsApp OTP Card */}
        <div style={{ padding: 18, border: "1px solid var(--line)", borderRadius: 6, background: settings.whatsappOtpEnabled ? "#faf8f5" : "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>💬</span>
              <b style={{ fontSize: 14 }}>WhatsApp OTP Verification</b>
              <span style={{ fontSize: 10, padding: "2px 6px", background: settings.whatsappApiKey ? "#e9f7e9" : "#fff3cd", color: settings.whatsappApiKey ? "#2e7d32" : "#856404", fontWeight: 700, borderRadius: 3 }}>
                {settings.whatsappApiKey ? "PROVIDER CONFIGURED" : "API KEY REQUIRED"}
              </span>
            </div>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--muted)" }}>
              Sends verified template message via Meta Cloud API / WhatsApp Business.
            </p>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: settings.whatsappOtpEnabled ? "#2e7d32" : "var(--muted)" }}>
              {settings.whatsappOtpEnabled ? "ENABLED" : "DISABLED"}
            </span>
            <input
              type="checkbox"
              checked={settings.whatsappOtpEnabled}
              onChange={(e) => setSettings({ ...settings, whatsappOtpEnabled: e.target.checked })}
              style={{ width: 18, height: 18, accentColor: "var(--purple)" }}
            />
          </label>
        </div>
      </div>

      {/* Security & Cooldown Settings */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20 }}>
        <h4 style={{ font: "16px var(--font-display)", color: "var(--purple)", margin: "0 0 16px" }}>
          2. Rate Limiting & Expiry Controls
        </h4>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              OTP Expiry (Minutes)
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={settings.expiryMinutes}
              onChange={(e) => setSettings({ ...settings, expiryMinutes: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "block" }}>Standard: 5 minutes</span>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              Max Attempt Limit
            </label>
            <input
              type="number"
              min={2}
              max={10}
              value={settings.maxAttempts}
              onChange={(e) => setSettings({ ...settings, maxAttempts: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "block" }}>Locks after 5 failed tries</span>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              Resend Cooldown (Seconds)
            </label>
            <input
              type="number"
              min={15}
              max={300}
              value={settings.resendCooldownSeconds}
              onChange={(e) => setSettings({ ...settings, resendCooldownSeconds: Number(e.target.value) })}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "block" }}>Anti-spam delay: 60s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
