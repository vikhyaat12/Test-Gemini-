"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const req = async (path: string, init?: RequestInit) => {
  const r = await fetch(path, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers || {}) } });
  return r.json();
};

export default function AffiliateDashboard() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [affiliate, setAffiliate] = useState<Record<string, unknown> | null>(null);
  const [links, setLinks] = useState<Record<string, unknown>[]>([]);
  const [commissions, setCommissions] = useState<Record<string, unknown>[]>([]);
  const [withdrawals, setWithdrawals] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"overview" | "links" | "commissions" | "withdrawals">("overview");

  useEffect(() => {
    (async () => {
      const me = await req("/api/auth/me");
      if (me.user) {
        setUser(me.user);
        const a = await req("/api/affiliate/me");
        if (a.affiliate) {
          setAffiliate(a.affiliate);
          const [l, c, w] = await Promise.all([req("/api/affiliate/links"), req("/api/affiliate/commissions"), req("/api/affiliate/withdrawals")]);
          if (l.links) setLinks(l.links);
          if (c.commissions) setCommissions(c.commissions);
          if (w.withdrawals) setWithdrawals(w.withdrawals);
        }
      }
      setLoading(false);
    })();
  }, []);

  const join = async () => {
    const r = await req("/api/affiliate/join", { method: "POST" });
    if (r.error) { setMessage(r.error); return; }
    setMessage("Welcome to the affiliate programme! Your application is pending review.");
    setAffiliate(r.affiliate);
  };

  const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  if (loading) return <main className="portal"><p style={{ padding: 40, color: "var(--muted)" }}>Loading…</p></main>;

  if (!user) {
    return (
      <main className="portal">
        <Link href="/" className="back">← Queens Care</Link>
        <p className="eyebrow">Affiliate Programme</p>
        <h1>Earn with Queens Care</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, maxWidth: 600, lineHeight: 1.8 }}>
          Join our affiliate programme to earn commission on every sale you refer.
          Get your unique tracking link, monitor performance in real-time, and withdraw earnings directly.
        </p>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 16 }}>Please sign in to join the affiliate programme.</p>
        <Link href="/" className="button" style={{ marginTop: 24, width: "fit-content" }}>Continue shopping →</Link>
      </main>
    );
  }

  if (!affiliate) {
    return (
      <main className="portal">
        <Link href="/" className="back">← Queens Care</Link>
        <p className="eyebrow">Affiliate Programme</p>
        <h1>Join Our Affiliate Programme</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, margin: "30px 0", maxWidth: 800 }}>
          {[["10% Commission", "Earn on every referred sale"], ["Real-time Tracking", "Monitor clicks, conversions, and earnings"], ["Instant Withdrawals", "Withdraw to your bank account anytime"]].map(([title, desc]) => (
            <div key={title} style={{ padding: 24, background: "#fff", border: "1px solid var(--line)" }}>
              <b style={{ fontSize: 16, display: "block", marginBottom: 8 }}>{title}</b>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>{desc}</span>
            </div>
          ))}
        </div>
        {message && <p className="portal-message">{message}</p>}
        <button onClick={join} className="button" style={{ border: 0, width: "fit-content" }}>Join Affiliate Programme →</button>
      </main>
    );
  }

  return (
    <main className="portal" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 0, minHeight: "100vh" }}>
      <nav style={{ background: "var(--paper)", borderRight: "1px solid var(--line)", padding: "24px 0" }}>
        <div style={{ padding: "0 16px 20px", borderBottom: "1px solid var(--line)" }}>
          <p style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", margin: 0 }}>Affiliate</p>
          <p style={{ font: "14px var(--font-display)", margin: "4px 0 0" }}>{String(affiliate.affiliateCode)}</p>
        </div>
        <div style={{ padding: "12px 0" }}>
          {([["overview", "Overview"], ["links", "Tracking Links"], ["commissions", "Commissions"], ["withdrawals", "Withdrawals"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ display: "block", width: "100%", padding: "10px 16px", border: "none", background: tab === id ? "var(--purple)" : "transparent", color: tab === id ? "#fff" : "var(--ink)", cursor: "pointer", fontSize: 12, textAlign: "left" }}>{label}</button>
          ))}
        </div>
      </nav>

      <div style={{ padding: "30px 36px", overflowY: "auto" }}>
        {message && <p className="portal-message">{message}</p>}

        {tab === "overview" && (
          <div>
            <h2 style={{ font: "24px var(--font-display)", margin: "0 0 24px" }}>Affiliate Overview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 30 }}>
              {[
                ["Total Sales", inr(Number(affiliate.totalSales))],
                ["Total Commission", inr(Number(affiliate.totalCommission))],
                ["Pending", inr(Number(affiliate.pendingCommission))],
                ["Wallet", inr(Number(affiliate.wallet))],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
                  <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted)" }}>{label}</span>
                  <b style={{ display: "block", marginTop: 8, font: "22px var(--font-display)" }}>{value}</b>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
                <b style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Your Affiliate Code</b>
                <code style={{ fontSize: 18, fontFamily: "monospace", letterSpacing: ".1em" }}>{String(affiliate.affiliateCode)}</code>
              </div>
              <div style={{ padding: 20, background: "#fff", border: "1px solid var(--line)" }}>
                <b style={{ fontSize: 13, display: "block", marginBottom: 8 }}>Commission Rate</b>
                <span style={{ fontSize: 18, font: "18px var(--font-display)" }}>{Number(affiliate.commissionRate)}%</span>
                <p style={{ fontSize: 11, color: "var(--muted)", margin: "4px 0 0" }}>Level {String(affiliate.level)} affiliate</p>
              </div>
            </div>
          </div>
        )}

        {tab === "links" && (
          <div>
            <h2 style={{ font: "24px var(--font-display)", margin: "0 0 24px" }}>Tracking Links</h2>
            {links.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No tracking links yet. Create one to start earning.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {links.map(l => (
                  <div key={String(l.id)} style={{ padding: 16, background: "#fff", border: "1px solid var(--line)", display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 20, alignItems: "center" }}>
                    <code style={{ fontSize: 11 }}>{String(l.shortCode)}</code>
                    <span style={{ fontSize: 12 }}>{String(l.clicks)} clicks</span>
                    <span style={{ fontSize: 12 }}>{String(l.conversions)} sales</span>
                    <span style={{ fontSize: 10, textTransform: "uppercase", color: l.isActive ? "#4caf50" : "#b34141" }}>{l.isActive ? "Active" : "Paused"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "commissions" && (
          <div>
            <h2 style={{ font: "24px var(--font-display)", margin: "0 0 24px" }}>Commission History</h2>
            {commissions.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No commissions yet. Start sharing your links to earn.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {commissions.map(c => (
                  <div key={String(c.id)} style={{ padding: 16, background: "#fff", border: "1px solid var(--line)", display: "grid", gridTemplateColumns: "1fr auto auto", gap: 20, alignItems: "center" }}>
                    <span style={{ fontSize: 12 }}>{new Date(String(c.createdAt)).toLocaleDateString("en-IN")}</span>
                    <span style={{ padding: "3px 10px", fontSize: 10, textTransform: "uppercase", background: c.status === "approved" ? "#4caf50" : c.status === "rejected" ? "#b34141" : "#d4ad65", color: c.status === "pending" ? "#333" : "#fff" }}>{String(c.status)}</span>
                    <span style={{ font: "14px var(--font-display)" }}>{inr(Number(c.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "withdrawals" && (
          <div>
            <h2 style={{ font: "24px var(--font-display)", margin: "0 0 24px" }}>Withdrawal History</h2>
            {withdrawals.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>No withdrawals yet. Your wallet balance: <b>{inr(Number(affiliate.wallet))}</b></p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {withdrawals.map(w => (
                  <div key={String(w.id)} style={{ padding: 16, background: "#fff", border: "1px solid var(--line)", display: "grid", gridTemplateColumns: "1fr auto auto", gap: 20, alignItems: "center" }}>
                    <span style={{ fontSize: 12 }}>{new Date(String(w.createdAt)).toLocaleDateString("en-IN")}</span>
                    <span style={{ padding: "3px 10px", fontSize: 10, textTransform: "uppercase", background: w.status === "paid" ? "#4caf50" : w.status === "rejected" ? "#b34141" : "#d4ad65", color: w.status === "pending" ? "#333" : "#fff" }}>{String(w.status)}</span>
                    <span style={{ font: "14px var(--font-display)" }}>{inr(Number(w.amount))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
