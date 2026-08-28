"use client";
import { useState } from "react";

export default function AddToCartButton({ productId, quantity = 1 }: { productId: string; quantity?: number }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const handle = async () => {
    setLoading(true);
    try {
      const m = await import("@/lib/client-cart");
      m.addToCart({ productId, quantity });
      setMessage("Added to care bag.");
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
