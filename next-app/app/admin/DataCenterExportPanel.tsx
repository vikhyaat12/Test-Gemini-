"use client";

import React, { useState, useEffect } from "react";
import type { GoogleSheetsConfig } from "@/lib/commerce/store-extensions";

const defaultGoogleSheetsConfig: GoogleSheetsConfig = {
  enabled: false,
  spreadsheetId: "",
  sheetName: "Submissions",
  webhookUrl: "",
  autoSync: false,
  lastSyncAt: null,
  syncStatus: "not_configured",
};

export default function DataCenterExportPanel() {
  const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig>(defaultGoogleSheetsConfig);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/googlesheets")
      .then((r) => r.json())
      .then((d) => {
        if (d.config) setSheetsConfig(d.config);
      })
      .catch(() => {});
  }, []);

  const handleSaveSheets = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/googlesheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sheetsConfig),
      });
      if (res.ok) {
        setFeedback({ type: "success", msg: "Google Sheets integration configuration saved." });
      } else {
        setFeedback({ type: "error", msg: "Failed to save Google Sheets settings." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Network error occurred." });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSync = async () => {
    setSyncing(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/googlesheets", { method: "PUT" });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", msg: data.message });
      } else {
        setFeedback({ type: data.status === "not_configured" ? "info" : "error", msg: data.message });
      }
    } catch {
      setFeedback({ type: "error", msg: "Sync test failed." });
    } finally {
      setSyncing(false);
    }
  };

  const EXPORT_DATASETS = [
    {
      id: "b2b",
      title: "B2B & Distribution Leads",
      description: "Wholesale enquiries, company names, territories, GST, phone, city, and status.",
      icon: "🏢",
      countLabel: "Enquiries & Leads",
    },
    {
      id: "careers",
      title: "Career Applications & Resumes",
      description: "Candidate profiles, contact details, positions applied, experience, and direct resume download URLs.",
      icon: "💼",
      countLabel: "Job Applicants",
    },
    {
      id: "customers",
      title: "Registered Customers",
      description: "User profiles, emails, phone numbers, registered roles, and creation dates.",
      icon: "👥",
      countLabel: "Active Accounts",
    },
    {
      id: "subscribers",
      title: "Newsletter Subscribers",
      description: "Verified customer email list with subscription source and opt-in status.",
      icon: "📬",
      countLabel: "Subscribers",
    },
    {
      id: "orders",
      title: "Orders & Commercial Transactions",
      description: "Complete order registry with tracking codes, customer totals, payment methods, and statuses.",
      icon: "📦",
      countLabel: "Order Records",
    },
    {
      id: "contacts",
      title: "Contact Form Enquiries",
      description: "Messages received from the public contact page with sender details and timestamps.",
      icon: "✉️",
      countLabel: "Customer Messages",
    },
    {
      id: "reviews",
      title: "Product Reviews & Ratings",
      description: "Customer feedback, star ratings, verified purchase badges, and review commentary.",
      icon: "⭐",
      countLabel: "Verified Reviews",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 900 }}>
      {/* 1-Click Excel / CSV Export Hub */}
      <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24, borderRadius: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Data Center & Archives
            </span>
            <h3 style={{ font: "22px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>
              📊 1-Click Excel & CSV Data Export
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
              Download complete, formatted UTF-8 CSV datasets directly compatible with Microsoft Excel, Google Sheets, and Apple Numbers.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {EXPORT_DATASETS.map((ds) => (
            <div
              key={ds.id}
              style={{
                background: "#faf8f5",
                border: "1px solid var(--line)",
                padding: 16,
                borderRadius: 4,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 18 }}>{ds.icon}</span>
                  <b style={{ fontSize: 14, color: "var(--purple)" }}>{ds.title}</b>
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--muted)", margin: "0 0 12px" }}>
                  {ds.description}
                </p>
              </div>

              <a
                href={`/api/admin/export?dataset=${ds.id}`}
                download
                style={{
                  padding: "8px 14px",
                  background: "#fff",
                  color: "var(--purple)",
                  border: "1px solid var(--purple)",
                  borderRadius: 3,
                  fontSize: 12,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "background 0.2s",
                }}
              >
                <span>📥 Export {ds.title.split(" ")[0]} (.CSV / Excel)</span>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Google Sheets Integration Card */}
      <div style={{ background: "#fff", border: "1px solid var(--line)", padding: 24, borderRadius: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#D4AF37", textTransform: "uppercase", letterSpacing: ".08em" }}>
              Cloud Spreadsheet Sync
            </span>
            <h3 style={{ font: "20px var(--font-display)", color: "var(--purple)", margin: "2px 0 0" }}>
              📑 Google Sheets Sync & Webhooks
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
              Automatically mirror website submissions (B2B Leads, Careers, Contact Enquiries) directly to your corporate Google Sheet.
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={handleTestSync}
              disabled={syncing}
              style={{ padding: "8px 16px", background: "#fff", border: "1px solid var(--line)", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: syncing ? "wait" : "pointer" }}
            >
              {syncing ? "Testing…" : "⚡ Test Sync Connection"}
            </button>
            <button
              type="button"
              onClick={handleSaveSheets}
              disabled={saving}
              style={{ padding: "8px 20px", background: "var(--purple)", color: "#D4AF37", border: "none", borderRadius: 4, fontWeight: 700, fontSize: 12, cursor: saving ? "wait" : "pointer" }}
            >
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </div>

        {feedback && (
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 4,
              marginBottom: 16,
              background: feedback.type === "success" ? "#e9f7e9" : feedback.type === "info" ? "#fff3cd" : "#fde8e8",
              border: `1px solid ${feedback.type === "success" ? "#c3e6cb" : feedback.type === "info" ? "#ffeeba" : "#f8b4b4"}`,
              color: feedback.type === "success" ? "#2e7d32" : feedback.type === "info" ? "#856404" : "#b34141",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {feedback.msg}
          </div>
        )}

        {/* Configuration Inputs */}
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              Google Spreadsheet ID / URL
            </label>
            <input
              type="text"
              value={sheetsConfig.spreadsheetId}
              onChange={(e) => setSheetsConfig({ ...sheetsConfig, spreadsheetId: e.target.value })}
              placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                Target Sheet / Tab Name
              </label>
              <input
                type="text"
                value={sheetsConfig.sheetName}
                onChange={(e) => setSheetsConfig({ ...sheetsConfig, sheetName: e.target.value })}
                placeholder="Submissions"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                Integration Status
              </label>
              <div
                style={{
                  padding: "8px 12px",
                  background: sheetsConfig.spreadsheetId || sheetsConfig.webhookUrl ? "#e9f7e9" : "#faf8f5",
                  border: "1px solid var(--line)",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: sheetsConfig.spreadsheetId || sheetsConfig.webhookUrl ? "#2e7d32" : "var(--muted)",
                }}
              >
                {sheetsConfig.spreadsheetId || sheetsConfig.webhookUrl
                  ? "● Credentials Provided (Ready)"
                  : "○ Not Configured (API credentials required)"}
              </div>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: 4 }}>
              Google Apps Script Webhook URL (Live Push Sync)
            </label>
            <input
              type="text"
              value={sheetsConfig.webhookUrl || ""}
              onChange={(e) => setSheetsConfig({ ...sheetsConfig, webhookUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
              style={{ width: "100%", padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 4, fontSize: 13 }}
            />
            <span style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, display: "block" }}>
              When configured, newly submitted B2B and Career leads will automatically push a row to your Google Sheet in real time.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
