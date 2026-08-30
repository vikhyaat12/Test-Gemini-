"use client";

import { useState } from "react";

type DeliveryResult = {
  serviceable: boolean;
  pincode: string;
  zone?: string;
  deliveryAvailable: boolean;
  estimatedDays?: number;
  estimatedDate?: string;
  deliveryLabel?: string;
  shippingCharge?: number;
  freeShippingEnabled?: boolean;
  freeShippingThreshold?: number;
  freeShippingMessage?: string;
  codAvailable?: boolean;
  sameDayAvailable?: boolean;
  handlingCharge?: number;
  message?: string;
};

export default function DeliveryCalculator({ productPrice = 0 }: { productPrice?: number }) {
  const [pincode, setPincode] = useState("");
  const [result, setResult] = useState<DeliveryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkDelivery = async () => {
    if (!pincode || pincode.length < 6) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch(`/api/delivery?pincode=${pincode}`);
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || "Unable to check delivery");
      }
    } catch {
      setError("Network error — please try again");
    }
    setLoading(false);
  };

  const freeShipping = result?.freeShippingEnabled && productPrice >= (result.freeShippingThreshold || 1500);

  return (
    <div style={{ border: "1px solid var(--line)", padding: 16, background: "#faf9f7" }}>
      <h4 style={{ font: "13px var(--font-display)", margin: "0 0 10px", color: "var(--purple)" }}>
        🚚 Check Delivery
      </h4>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          value={pincode}
          onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="Enter pincode (e.g. 110001)"
          onKeyDown={e => e.key === "Enter" && checkDelivery()}
          style={{
            flex: 1, padding: "10px 14px", border: "1px solid var(--line)", fontSize: 14,
            fontFamily: "var(--font-body, inherit)",
          }}
        />
        <button
          onClick={checkDelivery}
          disabled={loading || pincode.length < 6}
          style={{
            padding: "10px 20px", background: "var(--purple)", color: "#fff", border: "none",
            cursor: loading ? "wait" : "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
          }}
        >
          {loading ? "Checking…" : "Check"}
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 12, color: "#b34141", margin: "4px 0 0" }}>{error}</p>
      )}

      {result && (
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          {!result.serviceable ? (
            <p style={{ color: "#b34141", margin: 0 }}>❌ Delivery is not available to pincode {result.pincode} yet.</p>
          ) : (
            <>
              <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#2e7d32" }}>
                ✓ Delivery available to {result.pincode}
              </p>
              <p style={{ margin: "0 0 4px" }}>
                📅 <strong>{result.deliveryLabel}</strong>
                {result.estimatedDate && <span style={{ color: "var(--muted)" }}> — by {result.estimatedDate}</span>}
              </p>
              {freeShipping ? (
                <p style={{ margin: "0 0 4px", color: "#2e7d32" }}>🚚 FREE shipping on this order!</p>
              ) : result.freeShippingEnabled && result.freeShippingThreshold ? (
                <p style={{ margin: "0 0 4px", color: "var(--muted)" }}>
                  Add ₹{((result.freeShippingThreshold - productPrice) || 0).toLocaleString("en-IN")} more for free shipping
                </p>
              ) : null}
              {!freeShipping && result.shippingCharge !== undefined && result.shippingCharge > 0 && (
                <p style={{ margin: "0 0 4px" }}>💰 Shipping: ₹{result.shippingCharge}</p>
              )}
              {result.sameDayAvailable && (
                <p style={{ margin: "0 0 4px", color: "#2e7d32", fontWeight: 600 }}>⚡ Same-day delivery available!</p>
              )}
              {result.codAvailable !== undefined && (
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  {result.codAvailable ? "💵 Cash on delivery available" : "🔒 Cash on delivery not available"}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {!result && !error && (
        <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
          Enter your pincode to check delivery availability, estimated date, and shipping charges.
        </p>
      )}
    </div>
  );
}
