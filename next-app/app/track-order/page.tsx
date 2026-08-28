"use client";

import Link from "next/link";
import { useState } from "react";
import type { Order } from "@/lib/commerce/types";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    order: Order | null;
    error?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/orders/${orderNumber}?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (!res.ok) {
        setResult({ order: null, error: data.error || "Order not found. Please check your order number and email." });
      } else {
        setResult({ order: data.order, error: undefined });
      }
    } catch {
      setResult({ order: null, error: "A network error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const statusSteps = [
    { key: "pending", label: "Order placed", description: "We've received your order" },
    { key: "paid", label: "Payment confirmed", description: "Payment successfully processed" },
    { key: "packed", label: "Packed with care", description: "Your items are being prepared" },
    { key: "shipped", label: "Shipped", description: "On the way to you" },
    { key: "delivered", label: "Delivered", description: "Arrived at your doorstep" },
  ];

  return (
    <main className="subpage">
      <Link href="/" className="back">← Queens Care</Link>
      <p className="eyebrow">Queens Care Laboratories</p>
      <h1>Track your order</h1>
      <p>Enter your order number and email to see the latest status and tracking details.</p>

      {!result ? (
        <form onSubmit={handleSubmit} style={{ maxWidth: 480, marginTop: 30 }}>
          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>
                Order number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="QC-ABC123"
                required
                style={{ width: "100%", padding: "13px 14px", border: "1px solid var(--line)", background: "#fff", fontSize: 14, outlineColor: "var(--gold)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ width: "100%", padding: "13px 14px", border: "1px solid var(--line)", background: "#fff", fontSize: 14, outlineColor: "var(--gold)" }}
              />
            </div>
            <button className="button" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
              {loading ? "Tracking…" : <>Track order <span>→</span></>}
            </button>
          </div>
        </form>
      ) : result.error ? (
        <div style={{ marginTop: 30, padding: 20, background: "#f3e3e3", border: "1px solid #e2c3c3", borderRadius: 8, color: "#8c3a3a" }}>
          <p>{result.error}</p>
          <button onClick={() => setResult(null)} style={{ marginTop: 12, border: "1px solid var(--ink)", background: "transparent", padding: "9px 13px", fontSize: 10, textTransform: "uppercase", letterSpacing: ".08em", cursor: "pointer" }}>
            Try another order
          </button>
        </div>
      ) : result.order ? (
        <div style={{ marginTop: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid var(--line)" }}>
            <div>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Order number</p>
              <p style={{ font: "22px var(--font-display)", margin: 4 }}>{result.order.id}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>Status</p>
              <p style={{ font: "22px var(--font-display)", margin: 4, textTransform: "capitalize" }}>{result.order.status}</p>
            </div>
          </div>

          {/* Status Timeline */}
          <div style={{ marginBottom: 40 }}>
            {statusSteps.map((step, index) => {
              const isActive = statusSteps.findIndex((s) => s.key === result.order?.status) >= index;
              const isCurrent = step.key === result.order?.status;
              return (
                <div key={step.key} style={{ display: "flex", gap: 16, position: "relative", paddingBottom: index === statusSteps.length - 1 ? 0 : 24 }}>
                  <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", border: `2px solid ${isActive ? "var(--gold)" : "var(--line)"}`, background: isActive ? "var(--gold)" : "var(--paper)", display: "grid", placeItems: "center", color: isActive ? "var(--purple)" : "transparent", fontSize: 12, fontWeight: 600, zIndex: 1 }}>
                    {isActive && "✓"}
                  </div>
                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <p style={{ fontWeight: 600, color: isActive ? "var(--ink)" : "var(--muted)", margin: 0 }}>{step.label}</p>
                    <p style={{ fontSize: 13, color: "var(--muted)", margin: 4 }}>{step.description}</p>
                    {isCurrent && <span style={{ fontSize: 11, color: "var(--gold)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".08em" }}>Current</span>}
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div style={{ position: "absolute", left: 11, top: 28, bottom: 0, width: 2, background: "var(--line)" }} />
                  )}
                </div>
              );
            })}
          </div>

          {result.order.trackingCode && (
            <div style={{ padding: 20, background: "#faf8f5", border: "1px solid var(--line)", borderRadius: 8, marginBottom: 24 }}>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", margin: "0 0 8" }}>Tracking number</p>
              <p style={{ font: "18px var(--font-display)", margin: 0, letterSpacing: ".05em" }}>{result.order.trackingCode}</p>
              <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>Use this code with the carrier to get real-time delivery updates.</p>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 40 }}>
            <div style={{ padding: 20, background: "#fff", border: "1px solid var(--line)", borderRadius: 8 }}>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", margin: "0 0 8" }}>Shipping to</p>
              <p style={{ margin: 0, lineHeight: 1.7 }}>{(result.order.shipping as Record<string, unknown>)?.fullName as string}</p>
              <p style={{ margin: "4 0 0", color: "var(--muted)", fontSize: 14, lineHeight: 1.7 }}>
                {(result.order.shipping as Record<string, unknown>)?.address as string}<br />
                {(result.order.shipping as Record<string, unknown>)?.city as string}, {(result.order.shipping as Record<string, unknown>)?.state as string} {(result.order.shipping as Record<string, unknown>)?.pincode as string}
              </p>
            </div>
            <div style={{ padding: 20, background: "#fff", border: "1px solid var(--line)", borderRadius: 8 }}>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)", margin: "0 0 8" }}>Order total</p>
              <p style={{ font: "24px var(--font-display)", margin: 0 }}>₹{result.order.total.toLocaleString("en-IN")}</p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <Link href="/account" className="button">
              View all orders <span>→</span>
            </Link>
            <Link href="/contact" className="text-link">
              Need help? Contact us <span>→</span>
            </Link>
          </div>
        </div>
      ) : null}

      <Link href="/account" className="button" style={{ marginTop: 40, display: "inline-flex" }}>
        Sign in to view all orders
      </Link>
    </main>
  );
}