"use client";

import { useEffect, useState, useCallback, FormEvent } from "react";
import Link from "next/link";

const req = async (path: string, init?: RequestInit) => {
  const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  return r.json();
};

export default function AffiliateDashboard() {
  const [affiliate, setAffiliate] = useState<Record<string, unknown> | null>(null);
  const [links, setLinks] = useState<Record<string, unknown>[]>([]);
  const [commissions, setCommissions] = useState<Record<string, unknown>[]>([]);
  const [withdrawals, setWithdrawals] = useState<Record<string, unknown>[]>([]);
  const [products, setProducts] = useState<Array<{ slug: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "links" | "commissions" | "withdrawals">("overview");

  // Link generator state
  const [selectedProduct, setSelectedProduct] = useState("");
  const [customShortCode, setCustomShortCode] = useState("");
  const [generatingLink, setGeneratingLink] = useState(false);

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState<number | "">("");
  const [withdrawMethod, setWithdrawMethod] = useState("UPI");
  const [withdrawDetails, setWithdrawDetails] = useState("");
  const [requestingWithdraw, setRequestingWithdraw] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const a = await req("/api/affiliate/me");
      if (a.affiliate) {
        setAffiliate(a.affiliate);
        const [l, c, w, p] = await Promise.all([
          req("/api/affiliate/links"),
          req("/api/affiliate/commissions"),
          req("/api/affiliate/withdrawals"),
          fetch("/api/products").then(r => r.json()).catch(() => ({ products: [] })),
        ]);
        if (l.links) setLinks(l.links);
        if (c.commissions) setCommissions(c.commissions);
        if (w.withdrawals) setWithdrawals(w.withdrawals);
        if (p.products) setProducts(p.products);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleGenerateLink = async (e: FormEvent) => {
    e.preventDefault();
    setGeneratingLink(true);
    setMessage("");
    try {
      const res = await req("/api/affiliate/links", {
        method: "POST",
        body: JSON.stringify({
          productId: selectedProduct || undefined,
          customCode: customShortCode.trim() || undefined,
        }),
      });
      if (res.link) {
        setMessage("Custom tracking link created successfully!");
        setCustomShortCode("");
        loadData();
      } else {
        setMessage(res.error || "Failed to generate link.");
      }
    } catch {
      setMessage("Error generating link.");
    }
    setGeneratingLink(false);
  };

  const handleWithdrawalRequest = async (e: FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) <= 0) return;
    setRequestingWithdraw(true);
    setMessage("");
    try {
      const res = await req("/api/affiliate/withdraw", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(withdrawAmount),
          method: `${withdrawMethod}: ${withdrawDetails}`,
        }),
      });
      if (res.withdrawal) {
        setMessage(`Withdrawal request for ₹${Number(withdrawAmount).toLocaleString("en-IN")} submitted!`);
        setWithdrawAmount("");
        setWithdrawDetails("");
        loadData();
      } else {
        setMessage(res.error || "Failed to request withdrawal.");
      }
    } catch {
      setMessage("Error requesting withdrawal.");
    }
    setRequestingWithdraw(false);
  };

  const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

  if (loading) {
    return (
      <main className="portal" style={{ padding: 60, textAlign: "center" }}>
        <p style={{ color: "var(--muted)" }}>Loading affiliate dashboard…</p>
      </main>
    );
  }

  if (!affiliate) {
    return (
      <main className="portal" style={{ maxWidth: 600, margin: "60px auto", padding: "0 24px" }}>
        <Link href="/" className="back">← Queens Care</Link>
        <p className="eyebrow">Affiliate Programme</p>
        <h1>Affiliate Account</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.8 }}>
          No affiliate profile found. Please visit the public partner page to register or activate your affiliate account.
        </p>
        <Link href="/affiliate" className="button" style={{ marginTop: 24, display: "inline-block" }}>
          Visit Affiliate Registration →
        </Link>
      </main>
    );
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "https://queenscare.co.in";
  const mainRefLink = `${origin}/?ref=${String(affiliate.affiliateCode)}`;
  const totalClicks = links.reduce((s, l) => s + Number(l.clicks || 0), 0);
  const totalConversions = links.reduce((s, l) => s + Number(l.conversions || 0), 0);

  return (
    <main className="portal" style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 0, minHeight: "100vh" }}>
      {/* Sidebar */}
      <nav style={{ background: "var(--paper)", borderRight: "1px solid var(--line)", padding: "28px 0", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid var(--line)" }}>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", margin: 0 }}>Affiliate Partner</p>
          <p style={{ font: "18px var(--font-display)", margin: "4px 0 6px", color: "var(--purple)" }}>{String(affiliate.affiliateCode)}</p>
          <span style={{ fontSize: 10, textTransform: "uppercase", padding: "2px 8px", background: affiliate.status === "active" ? "#e8f5e9" : "#fff3e0", color: affiliate.status === "active" ? "#2e7d32" : "#e65100", border: "1px solid currentColor" }}>
            {String(affiliate.status)}
          </span>
        </div>

        <div style={{ padding: "16px 0", flex: 1 }}>
          {([
            ["overview", "📊 Overview"],
            ["links", "🔗 Tracking Links"],
            ["commissions", "💰 Commissions"],
            ["withdrawals", "💳 Withdrawals"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => { setTab(id); setMessage(""); }}
              style={{
                display: "block",
                width: "100%",
                padding: "12px 20px",
                border: "none",
                background: tab === id ? "var(--purple)" : "transparent",
                color: tab === id ? "#fff" : "var(--ink)",
                cursor: "pointer",
                fontSize: 13,
                textAlign: "left",
                fontWeight: tab === id ? 600 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--line)", fontSize: 12 }}>
          <Link href="/" style={{ color: "var(--muted)", textDecoration: "none" }}>← Store Home</Link>
        </div>
      </nav>

      {/* Content Area */}
      <div style={{ padding: "36px 44px", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ font: "28px var(--font-display)", margin: 0, letterSpacing: "-.02em" }}>
              {tab === "overview" && "Affiliate Overview"}
              {tab === "links" && "Tracking Links & Referral Generator"}
              {tab === "commissions" && "Commission History"}
              {tab === "withdrawals" && "Wallet & Payouts"}
            </h1>
            <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>
              Welcome back. Monitor your performance, manage links, and track payouts.
            </p>
          </div>
          <button onClick={loadData} style={{ padding: "8px 16px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 12 }}>
            ↻ Refresh
          </button>
        </div>

        {message && (
          <p style={{ padding: "10px 14px", background: "#e8f5e9", color: "#2e7d32", fontSize: 13, marginBottom: 24, border: "1px solid #c8e6c9" }}>
            {message}
          </p>
        )}

        {/* ─── TAB: OVERVIEW ─── */}
        {tab === "overview" && (
          <div>
            {/* Quick Share Link Box */}
            <div style={{ padding: "20px 24px", background: "#fff", border: "1px solid var(--line)", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
              <div>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)", display: "block", marginBottom: 4 }}>Primary Referral Link</span>
                <code style={{ fontSize: 14, fontFamily: "monospace", color: "var(--purple)", fontWeight: 600 }}>{mainRefLink}</code>
              </div>
              <button
                onClick={() => copyToClipboard(mainRefLink, "primary")}
                className="button"
                style={{ border: 0, fontSize: 12, padding: "8px 18px" }}
              >
                {copiedKey === "primary" ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              {[
                ["Total Sales", inr(Number(affiliate.totalSales)), "var(--purple)"],
                ["Total Commission", inr(Number(affiliate.totalCommission)), "var(--gold)"],
                ["Pending Commission", inr(Number(affiliate.pendingCommission)), "#f57c00"],
                ["Wallet Balance", inr(Number(affiliate.wallet)), "#2e7d32"],
              ].map(([label, val, col]) => (
                <div key={label} style={{ padding: 22, background: "#fff", border: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>{label}</span>
                  <b style={{ display: "block", marginTop: 10, font: "24px var(--font-display)", color: col }}>{val}</b>
                </div>
              ))}
            </div>

            {/* Sub Metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
              <div style={{ padding: 20, background: "var(--paper)", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Total Link Clicks</span>
                <b style={{ display: "block", font: "20px var(--font-display)", marginTop: 6 }}>{totalClicks}</b>
              </div>
              <div style={{ padding: 20, background: "var(--paper)", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Total Conversions</span>
                <b style={{ display: "block", font: "20px var(--font-display)", marginTop: 6 }}>{totalConversions}</b>
              </div>
              <div style={{ padding: 20, background: "var(--paper)", border: "1px solid var(--line)" }}>
                <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase" }}>Commission Rate</span>
                <b style={{ display: "block", font: "20px var(--font-display)", marginTop: 6 }}>{Number(affiliate.commissionRate || 10)}%</b>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ padding: 24, background: "#fff", border: "1px solid var(--line)" }}>
                <h3 style={{ font: "18px var(--font-display)", margin: "0 0 12px" }}>Generate Tracking Link</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                  Create customized tracking links for specific formulations to share in your content or articles.
                </p>
                <button onClick={() => setTab("links")} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>
                  Open Link Generator →
                </button>
              </div>
              <div style={{ padding: 24, background: "#fff", border: "1px solid var(--line)" }}>
                <h3 style={{ font: "18px var(--font-display)", margin: "0 0 12px" }}>Withdraw Earnings</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 16 }}>
                  Your available wallet balance is <b>{inr(Number(affiliate.wallet))}</b>. Request a direct transfer anytime.
                </p>
                <button onClick={() => setTab("withdrawals")} style={{ padding: "8px 16px", background: "var(--purple)", color: "#fff", border: "none", cursor: "pointer", fontSize: 12 }}>
                  Request Payout →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: TRACKING LINKS ─── */}
        {tab === "links" && (
          <div>
            {/* Link Generator Form */}
            <div style={{ padding: 24, background: "#fff", border: "1px solid var(--line)", marginBottom: 32 }}>
              <h3 style={{ font: "20px var(--font-display)", margin: "0 0 16px" }}>Create New Tracking Link</h3>
              <form onSubmit={handleGenerateLink} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr auto", gap: 14, alignItems: "end" }}>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Target Formulation / Page</label>
                  <select
                    value={selectedProduct}
                    onChange={e => setSelectedProduct(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", fontSize: 13 }}
                  >
                    <option value="">Store Homepage (/)</option>
                    {products.map(p => (
                      <option key={p.slug} value={p.slug}>{p.name} (/products/{p.slug})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Custom Short Code (Optional)</label>
                  <input
                    placeholder="e.g. serum-promo"
                    value={customShortCode}
                    onChange={e => setCustomShortCode(e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, ""))}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", fontSize: 13 }}
                  />
                </div>
                <button type="submit" disabled={generatingLink} className="button" style={{ border: 0, padding: "10px 20px" }}>
                  {generatingLink ? "Generating…" : "Generate Link →"}
                </button>
              </form>
            </div>

            {/* Links Table */}
            <h3 style={{ font: "20px var(--font-display)", margin: "0 0 16px" }}>Your Generated Tracking Links</h3>
            {links.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13, padding: "20px 0" }}>No custom links generated yet. Use the generator above to create your first link.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#fff", border: "1px solid var(--line)" }}>
                  <thead>
                    <tr style={{ background: "var(--paper)" }}>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Code</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Destination</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Full Tracking URL</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Clicks</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Conversions</th>
                      <th style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((l) => {
                      const fullUrl = `${origin}/r/${String(l.shortCode)}`;
                      return (
                        <tr key={String(l.id)} style={{ borderBottom: "1px solid var(--line)" }}>
                          <td style={{ padding: "12px 14px" }}><code>{String(l.shortCode)}</code></td>
                          <td style={{ padding: "12px 14px" }}>{String(l.productId || "Homepage")}</td>
                          <td style={{ padding: "12px 14px" }}><code style={{ fontSize: 11, color: "var(--muted)" }}>{fullUrl}</code></td>
                          <td style={{ padding: "12px 14px" }}><b>{String(l.clicks || 0)}</b></td>
                          <td style={{ padding: "12px 14px" }}><b>{String(l.conversions || 0)}</b></td>
                          <td style={{ padding: "12px 14px" }}>
                            <button
                              onClick={() => copyToClipboard(fullUrl, String(l.id))}
                              style={{ padding: "4px 10px", fontSize: 11, border: "1px solid var(--line)", background: "#fff", cursor: "pointer" }}
                            >
                              {copiedKey === String(l.id) ? "✓ Copied!" : "Copy"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: COMMISSIONS ─── */}
        {tab === "commissions" && (
          <div>
            <h3 style={{ font: "20px var(--font-display)", margin: "0 0 16px" }}>Attributed Commissions</h3>
            {commissions.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13, padding: "20px 0" }}>No commissions recorded yet. Share your tracking links to start earning.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#fff", border: "1px solid var(--line)" }}>
                  <thead>
                    <tr style={{ background: "var(--paper)" }}>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Date</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Order Reference</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Commission Amount</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map((c) => (
                      <tr key={String(c.id)} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "12px 14px" }}>{new Date(String(c.createdAt)).toLocaleDateString("en-IN")}</td>
                        <td style={{ padding: "12px 14px" }}><code>{String(c.orderId || "—").slice(0, 12)}…</code></td>
                        <td style={{ padding: "12px 14px", font: "15px var(--font-display)", color: "var(--purple)" }}>{inr(Number(c.amount))}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            padding: "3px 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em",
                            background: c.status === "approved" ? "#e8f5e9" : c.status === "rejected" ? "#ffebee" : "#fff3e0",
                            color: c.status === "approved" ? "#2e7d32" : c.status === "rejected" ? "#c62828" : "#e65100",
                          }}>
                            {String(c.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB: WITHDRAWALS ─── */}
        {tab === "withdrawals" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 32, alignItems: "start", marginBottom: 40 }}>
              {/* Request Withdrawal Box */}
              <div style={{ padding: 24, background: "#fff", border: "1px solid var(--line)" }}>
                <h3 style={{ font: "20px var(--font-display)", margin: "0 0 12px" }}>Request Payout</h3>
                <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 16px" }}>
                  Available Wallet Balance: <b style={{ color: "#2e7d32", fontSize: 16 }}>{inr(Number(affiliate.wallet))}</b>
                </p>
                <form onSubmit={handleWithdrawalRequest} style={{ display: "grid", gap: 14 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Amount (₹) *</label>
                    <input
                      required
                      type="number"
                      min={100}
                      max={Number(affiliate.wallet)}
                      placeholder="e.g. 1500"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(Number(e.target.value) || "")}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", fontSize: 14 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Payout Method</label>
                    <select
                      value={withdrawMethod}
                      onChange={e => setWithdrawMethod(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", fontSize: 13 }}
                    >
                      <option value="UPI">UPI ID</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>
                      {withdrawMethod === "UPI" ? "UPI ID (e.g. name@okhdfcbank)" : "Account Number & IFSC Code"} *
                    </label>
                    <input
                      required
                      placeholder={withdrawMethod === "UPI" ? "yourname@upi" : "A/C: 123456789, IFSC: HDFC0001234"}
                      value={withdrawDetails}
                      onChange={e => setWithdrawDetails(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--line)", fontSize: 14 }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={requestingWithdraw || Number(affiliate.wallet) <= 0}
                    className="button"
                    style={{ border: 0, marginTop: 6 }}
                  >
                    {requestingWithdraw ? "Submitting…" : "Submit Withdrawal Request →"}
                  </button>
                </form>
              </div>

              {/* Payout Info Box */}
              <div style={{ padding: 24, background: "var(--paper)", border: "1px solid var(--line)" }}>
                <p className="eyebrow" style={{ color: "var(--gold)" }}>PAYOUT POLICY</p>
                <h4 style={{ font: "18px var(--font-display)", margin: "8px 0 12px" }}>Payout Schedules & Verification</h4>
                <ul style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.8, paddingLeft: 18, margin: 0 }}>
                  <li>Minimum withdrawal threshold is <b>₹100</b>.</li>
                  <li>Commissions mature from pending to approved following our standard 14-day return window.</li>
                  <li>Withdrawal requests are processed within <b>2-3 business days</b> directly to your verified bank account or UPI ID.</li>
                  <li>No payment processing or convenience fees are charged.</li>
                </ul>
              </div>
            </div>

            {/* Withdrawals History Table */}
            <h3 style={{ font: "20px var(--font-display)", margin: "0 0 16px" }}>Withdrawal History</h3>
            {withdrawals.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13, padding: "20px 0" }}>No past withdrawal requests.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, background: "#fff", border: "1px solid var(--line)" }}>
                  <thead>
                    <tr style={{ background: "var(--paper)" }}>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Date</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Amount</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Method / Account</th>
                      <th style={{ textAlign: "left", padding: "12px 14px", borderBottom: "1px solid var(--line)", fontSize: 11, textTransform: "uppercase", color: "var(--muted)" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={String(w.id)} style={{ borderBottom: "1px solid var(--line)" }}>
                        <td style={{ padding: "12px 14px" }}>{new Date(String(w.createdAt)).toLocaleDateString("en-IN")}</td>
                        <td style={{ padding: "12px 14px", fontWeight: 600 }}>{inr(Number(w.amount))}</td>
                        <td style={{ padding: "12px 14px" }}>{String(w.method || "Bank Transfer")}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{
                            padding: "3px 8px", fontSize: 10, textTransform: "uppercase", letterSpacing: ".06em",
                            background: w.status === "paid" ? "#e8f5e9" : w.status === "approved" ? "#e3f2fd" : w.status === "rejected" ? "#ffebee" : "#fff3e0",
                            color: w.status === "paid" ? "#2e7d32" : w.status === "approved" ? "#1976d2" : w.status === "rejected" ? "#c62828" : "#e65100",
                          }}>
                            {String(w.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
