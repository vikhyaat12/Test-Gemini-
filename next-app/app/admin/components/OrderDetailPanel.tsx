"use client";

import { useEffect, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   ORDER DETAIL PANEL
   Fetches full order data from /api/admin/orders/[id]
   and renders items, customer info, addresses, payment,
   shipping, status timeline, and action buttons.
   ═══════════════════════════════════════════════════════════════ */

const STATUS_COLORS: Record<string, string> = {
  pending: "#d4ad65",
  submitted: "#2196f3",
  confirmed: "#1565c0",
  processing: "#2196f3",
  packed: "#2196f3",
  shipped: "#2196f3",
  out_for_delivery: "#ff9800",
  delivered: "#4caf50",
  completed: "#2e7d32",
  cancelled: "#b34141",
  rejected: "#b34141",
  refunded: "#9c27b0",
  failed: "#b34141",
  paid: "#4caf50",
  partially_refunded: "#ff9800",
  cod_pending: "#d4ad65",
};

function Badge({ status }: { status: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 10px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 700,
        textTransform: "capitalize",
        background: STATUS_COLORS[status] || "#999",
        color: "#fff",
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "rejected",
  "refunded",
] as const;

type OrderDetail = {
  order: Record<string, unknown>;
  customer: Record<string, unknown> | null;
  shipping: Record<string, unknown> | null;
  history: Record<string, unknown>[];
  validTransitions: string[];
};

export default function OrderDetailPanel({
  orderId,
  onClose,
  onRefresh,
}: {
  orderId: string;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status change
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  // Tracking
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [trackingSaved, setTrackingSaved] = useState(false);

  // Refund
  const [showRefund, setShowRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);

  // Cancel confirm
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/admin/orders/${encodeURIComponent(orderId)}`
      );
      if (!res.ok) throw new Error("Failed to load order");
      const data = await res.json();
      setDetail(data);
      setNewStatus(String(data.order?.status || ""));
      setTrackingNumber(String(data.order?.trackingNumber || ""));
      setTrackingUrl(String(data.order?.trackingUrl || ""));
      setRefundAmount(String(data.order?.total || ""));
    } catch {
      setError("Failed to load order details.");
    }
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const updateStatus = async (status: string, note?: string) => {
    const body: Record<string, unknown> = { status };
    if (note) body.note = note;
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      fetchDetail();
      onRefresh();
    }
    setStatusNote("");
  };

  const saveTracking = async () => {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        trackingNumber,
        trackingUrl,
        note: "Tracking number updated",
      }),
    });
    if (res.ok) {
      setTrackingSaved(true);
      fetchDetail();
      onRefresh();
      setTimeout(() => setTrackingSaved(false), 2000);
    }
  };

  const processRefund = async () => {
    setRefundLoading(true);
    const res = await fetch(
      `/api/admin/orders/${encodeURIComponent(orderId)}/refund`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "refund",
          amount: refundAmount ? Number(refundAmount) : undefined,
          reason: refundReason || "Admin refund",
        }),
      }
    );
    if (res.ok) {
      setShowRefund(false);
      fetchDetail();
      onRefresh();
    }
    setRefundLoading(false);
  };

  const cancelOrder = async () => {
    await updateStatus("cancelled", "Cancelled by admin");
    setShowCancelConfirm(false);
  };

  if (loading && !detail) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
        Loading order details…
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div style={{ padding: 20, color: "#c62828", fontSize: 13 }}>
        {error || "Order not found."}
        <button
          onClick={onClose}
          style={{
            marginLeft: 12,
            padding: "4px 12px",
            fontSize: 11,
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 3,
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    );
  }

  const { order, customer, shipping, history, validTransitions } = detail;
  const lines = (Array.isArray(order.lines) ? order.lines : []) as Record<string, unknown>[];
  const orderTotal = Number(order.total || 0);
  const created = order.createdAt ? new Date(String(order.createdAt)) : null;

  return (
    <div
      style={{
        padding: "16px 18px",
        borderTop: "1px solid var(--line)",
        background: "#f9f8f6",
        fontSize: 13,
      }}
    >
      {/* ── Close button ─────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button
          onClick={onClose}
          style={{
            padding: "5px 14px",
            fontSize: 11,
            background: "#fff",
            border: "1px solid var(--line)",
            borderRadius: 3,
            cursor: "pointer",
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* ── 1. Order Header ──────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 16,
          paddingBottom: 14,
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div>
          <strong style={{ fontFamily: "monospace", fontSize: 14 }}>
            {String(order.id)}
          </strong>
          {created && (
            <span style={{ marginLeft: 10, fontSize: 11, color: "var(--muted)" }}>
              {created.toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Badge status={String(order.status || "pending")} />
          <Badge status={String(order.paymentStatus || "pending")} />
        </div>
      </div>

      {/* ── 2. Items Table ───────────────────────────────────── */}
      <div style={{ marginBottom: 18 }}>
        <h4 style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", margin: "0 0 8px", letterSpacing: ".08em" }}>
          Items ({lines.length})
        </h4>
        {lines.length === 0 ? (
          <p style={{ color: "var(--muted)", fontSize: 12 }}>No item data.</p>
        ) : (
          <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "44px 1.4fr 0.7fr 0.5fr 0.5fr 0.7fr 0.7fr", gap: 4, padding: "8px 12px", background: "#f5f3f0", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--muted)" }}>
              <span></span>
              <span>Product</span>
              <span>SKU</span>
              <span>Qty</span>
              <span>Price</span>
              <span>Discount</span>
              <span style={{ textAlign: "right" }}>Total</span>
            </div>
            {lines.map((line, i) => {
              const qty = Number(line.quantity || 1);
              const price = Number(line.price || line.unitPrice || 0);
              const discount = Number(line.discount || 0);
              const lineTotal = qty * price - discount;
              return (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "44px 1.4fr 0.7fr 0.5fr 0.5fr 0.7fr 0.7fr",
                    gap: 4,
                    padding: "8px 12px",
                    borderTop: "1px solid var(--line)",
                    fontSize: 12,
                    alignItems: "center",
                  }}
                >
                  {line.image ? (
                    <img
                      src={String(line.image)}
                      alt=""
                      style={{
                        width: 36,
                        height: 36,
                        objectFit: "cover",
                        borderRadius: 3,
                        background: "var(--line)",
                      }}
                    />
                  ) : (
                    <div style={{ width: 36, height: 36, background: "var(--line)", borderRadius: 3 }} />
                  )}
                  <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {String(line.name || line.productName || "—")}
                  </span>
                  <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>
                    {String(line.sku || "—")}
                  </span>
                  <span>{qty}</span>
                  <span>₹{price.toLocaleString("en-IN")}</span>
                  <span style={{ color: discount > 0 ? "#c62828" : "var(--muted)" }}>
                    {discount > 0 ? `-₹${discount.toLocaleString("en-IN")}` : "—"}
                  </span>
                  <span style={{ textAlign: "right", fontWeight: 600 }}>
                    ₹{lineTotal.toLocaleString("en-IN")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3 & 4. Customer + Addresses (2-col) ──────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
        {/* Customer Info */}
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: 14 }}>
          <h4 style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", margin: "0 0 10px", letterSpacing: ".08em" }}>
            Customer
          </h4>
          <p style={{ margin: "0 0 4px", fontWeight: 600 }}>
            {String(customer?.name || order.customerName || "—")}
          </p>
          <p style={{ margin: "0 0 3px", color: "var(--muted)", fontSize: 12 }}>
            {String(customer?.email || order.email || "—")}
          </p>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 12 }}>
            {String(customer?.phone || order.phone || "—")}
          </p>
          {customer?.id ? (
            <a
              href={`/admin?tab=customers`}
              style={{ display: "inline-block", marginTop: 8, fontSize: 11, color: "var(--purple)", textDecoration: "underline" }}
            >
              View customer →
            </a>
          ) : null}
        </div>

        {/* Addresses */}
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <h4 style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px", letterSpacing: ".08em" }}>
                Shipping Address
              </h4>
              {shipping ? (
                <>
                  <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 12 }}>{String(shipping.fullName || "—")}</p>
                  <p style={{ margin: "0 0 2px", color: "var(--muted)", fontSize: 11 }}>{String(shipping.address || "—")}</p>
                  <p style={{ margin: "0 0 2px", color: "var(--muted)", fontSize: 11 }}>
                    {[String(shipping.city || ""), String(shipping.state || ""), String(shipping.pincode || "")].filter(Boolean).join(", ") || "—"}
                  </p>
                </>
              ) : (
                <p style={{ color: "var(--muted)", fontSize: 12 }}>
                  {String(order.shippingAddress || order.address || "—")}
                </p>
              )}
            </div>
            <div>
              <h4 style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px", letterSpacing: ".08em" }}>
                Billing Address
              </h4>
              <p style={{ color: "var(--muted)", fontSize: 12 }}>
                {String(order.billingAddress || order.shippingAddress || order.address || "Same as shipping")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5 & 6. Payment + Shipping (2-col) ────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
        {/* Payment */}
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: 14 }}>
          <h4 style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", margin: "0 0 10px", letterSpacing: ".08em" }}>
            Payment
          </h4>
          <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Method</span>
              <span style={{ fontWeight: 600 }}>{String(order.paymentMethod || "—")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Gateway</span>
              <span>{String(order.paymentGateway || order.gateway || "—")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Transaction ID</span>
              <span style={{ fontFamily: "monospace", fontSize: 11 }}>{String(order.transactionId || order.paymentId || "—")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Subtotal</span>
              <span>₹{Number(order.subtotal || orderTotal).toLocaleString("en-IN")}</span>
            </div>
            {Number(order.discount || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Discount</span>
                <span style={{ color: "#c62828" }}>-₹{Number(order.discount || 0).toLocaleString("en-IN")}</span>
              </div>
            )}
            {order.couponCode ? (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Coupon</span>
                <span style={{ fontFamily: "monospace", fontSize: 11 }}>{String(order.couponCode)}</span>
              </div>
            ) : null}
            {Number(order.tax || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Tax/GST</span>
                <span>₹{Number(order.tax).toLocaleString("en-IN")}</span>
              </div>
            )}
            {Number(order.shippingCost || 0) > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Shipping</span>
                <span>₹{Number(order.shippingCost).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--line)", paddingTop: 8, marginTop: 4 }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 700, fontSize: 15 }}>₹{orderTotal.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Shipping */}
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: 14 }}>
          <h4 style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", margin: "0 0 10px", letterSpacing: ".08em" }}>
            Shipping
          </h4>
          <div style={{ display: "grid", gap: 6, fontSize: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Provider</span>
              <span>{String(order.shippingProvider || "—")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Method</span>
              <span>{String(order.shippingMethod || shipping?.method || "—")}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--muted)" }}>Tracking #</span>
              <span style={{ fontFamily: "monospace", fontSize: 11 }}>
                {String(order.trackingNumber || "—")}
              </span>
            </div>
            {order.trackingUrl ? (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--muted)" }}>Tracking URL</span>
                <a
                  href={String(order.trackingUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--purple)", textDecoration: "underline", fontSize: 11 }}
                >
                  Open tracker ↗
                </a>
              </div>
            ) : null}
          </div>

          {/* Tracking input */}
          <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--line)" }}>
            <p style={{ fontSize: 10, textTransform: "uppercase", color: "var(--muted)", margin: "0 0 6px", letterSpacing: ".08em" }}>
              Add / Update Tracking
            </p>
            <div style={{ display: "flex", gap: 6, flexDirection: "column" }}>
              <input
                placeholder="Tracking number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                style={{ padding: "6px 10px", fontSize: 12, border: "1px solid var(--line)", borderRadius: 4 }}
              />
              <input
                placeholder="Tracking URL (optional)"
                value={trackingUrl}
                onChange={(e) => setTrackingUrl(e.target.value)}
                style={{ padding: "6px 10px", fontSize: 12, border: "1px solid var(--line)", borderRadius: 4 }}
              />
              <button
                onClick={saveTracking}
                disabled={!trackingNumber}
                style={{
                  padding: "6px 14px",
                  fontSize: 11,
                  fontWeight: 700,
                  background: trackingNumber ? "var(--purple)" : "#ccc",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  cursor: trackingNumber ? "pointer" : "not-allowed",
                }}
              >
                {trackingSaved ? "✓ Saved" : "Save Tracking"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 7. Status Timeline ───────────────────────────────── */}
      {history.length > 0 && (
        <div style={{ marginBottom: 18, background: "#fff", border: "1px solid var(--line)", borderRadius: 6, padding: 14 }}>
          <h4 style={{ fontSize: 11, textTransform: "uppercase", color: "var(--muted)", margin: "0 0 10px", letterSpacing: ".08em" }}>
            Status Timeline ({history.length} events)
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[...history].reverse().map((entry, i) => {
              const ts = entry.createdAt || entry.timestamp;
              const date = ts ? new Date(String(ts)) : null;
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "8px 0",
                    borderTop: i > 0 ? "1px solid var(--line)" : "none",
                  }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[String(entry.status)] || "#999", marginTop: 4, flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: 12 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <Badge status={String(entry.status)} />
                      {entry.note ? (
                        <span style={{ color: "var(--muted)", fontSize: 11 }}>— {String(entry.note)}</span>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 10, color: "var(--muted)" }}>
                      {date
                        ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                      {entry.adminName || entry.adminId ? (
                        <span style={{ marginLeft: 8 }}>by {String(entry.adminName || entry.adminId)}</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 8. Action Buttons ────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "center",
          padding: "14px 0 0",
          borderTop: "1px solid var(--line)",
        }}
      >
        {/* Change Status */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 11, borderRadius: 4, border: "1px solid var(--line)" }}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <input
            placeholder="Note (optional)"
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
            style={{ padding: "6px 10px", fontSize: 11, border: "1px solid var(--line)", borderRadius: 4, width: 160 }}
          />
          <button
            onClick={() => updateStatus(newStatus, statusNote || undefined)}
            disabled={newStatus === String(order.status)}
            style={{
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 700,
              background: newStatus !== String(order.status) ? "var(--purple)" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: newStatus !== String(order.status) ? "pointer" : "not-allowed",
            }}
          >
            Update Status
          </button>
        </div>

        {/* Issue Refund */}
        {!showRefund ? (
          <button
            onClick={() => setShowRefund(true)}
            style={{
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 700,
              background: "#fff",
              color: "#9c27b0",
              border: "1px solid #ce93d8",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            💰 Issue Refund
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              padding: "8px 12px",
              background: "#f3e5f5",
              border: "1px solid #ce93d8",
              borderRadius: 4,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600 }}>₹</span>
            <input
              type="number"
              placeholder="Amount"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              style={{ width: 100, padding: "5px 8px", fontSize: 11, border: "1px solid var(--line)", borderRadius: 3 }}
            />
            <input
              placeholder="Reason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              style={{ width: 140, padding: "5px 8px", fontSize: 11, border: "1px solid var(--line)", borderRadius: 3 }}
            />
            <button
              onClick={processRefund}
              disabled={refundLoading}
              style={{
                padding: "5px 12px",
                fontSize: 11,
                fontWeight: 700,
                background: "#9c27b0",
                color: "#fff",
                border: "none",
                borderRadius: 3,
                cursor: refundLoading ? "not-allowed" : "pointer",
              }}
            >
              {refundLoading ? "…" : "Confirm"}
            </button>
            <button
              onClick={() => setShowRefund(false)}
              style={{ padding: "5px 10px", fontSize: 11, background: "#fff", border: "1px solid #ccc", borderRadius: 3, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Cancel Order */}
        {!showCancelConfirm ? (
          <button
            onClick={() => setShowCancelConfirm(true)}
            style={{
              padding: "6px 14px",
              fontSize: 11,
              fontWeight: 700,
              background: "#fff",
              color: "#c62828",
              border: "1px solid #ffcdd2",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            ✕ Cancel Order
          </button>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 6,
              alignItems: "center",
              padding: "8px 12px",
              background: "#ffebee",
              border: "1px solid #ffcdd2",
              borderRadius: 4,
            }}
          >
            <span style={{ fontSize: 11 }}>Are you sure?</span>
            <button
              onClick={cancelOrder}
              style={{
                padding: "5px 12px",
                fontSize: 11,
                fontWeight: 700,
                background: "#c62828",
                color: "#fff",
                border: "none",
                borderRadius: 3,
                cursor: "pointer",
              }}
            >
              Yes, Cancel
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              style={{ padding: "5px 10px", fontSize: 11, background: "#fff", border: "1px solid #ccc", borderRadius: 3, cursor: "pointer" }}
            >
              No
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
