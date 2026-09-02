"use client";
import { useState } from "react";

export default function AddToCartButton({ productId, quantity = 1, productName }: { productId: string; quantity?: number; productName?: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const handle = async () => {
    setLoading(true);
    try {
      const m = await import("@/lib/client-cart");
      m.addToCart({ productId, quantity });
      setMessage("Added to care bag.");
      // Analytics: add to cart
      try { ((window as unknown) as Record<string, (...args: unknown[]) => void>).__qc_track_add_to_cart?.(productId, productName || productId); } catch {}
    } catch {
      setMessage("Unable to add to bag.");
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(""), 2500);
    }
  };
  return (
    <div style={{ display: "inline-block" }}>
      <button className="button" onClick={handle} disabled={loading}>
        {loading ? "Adding…" : "Add to bag"}
      </button>
      {message && <div style={{ marginTop: 8 }}>{message}</div>}
    </div>
  );
}
