import { json } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { paymentGatewayStore, isGatewayConfigured } from "@/lib/commerce/store-extensions";
import { createRazorpayOrder } from "@/lib/razorpay";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const orderId = String(body.orderId || "");
  const provider = String(body.provider || "cod").toLowerCase();

  const order = await store.orders.byId(orderId);
  if (!order) return json({ error: "Order not found" }, 404);

  const gw = await paymentGatewayStore.byProvider(provider);
  if (!gw) {
    return json({ error: `Payment provider '${provider}' is not available.` }, 400);
  }

  if (!gw.enabled) {
    return json({ error: `${gw.displayName || provider} is currently disabled.` }, 400);
  }

  const creds = (gw.credentials || {}) as Record<string, unknown>;
  const configured = isGatewayConfigured(provider, creds);

  // 1. CASH ON DELIVERY (COD)
  if (provider === "cod") {
    const maxVal = Number(gw.maxOrderValue || 15000);
    if (order.total > maxVal) {
      return json({ error: `Cash on Delivery is only available for orders up to ₹${maxVal.toLocaleString("en-IN")}.` }, 422);
    }
    return json({
      mode: "cod",
      status: "ready",
      orderId: order.id,
      amount: order.total,
      instructions: String(gw.instructions || "Please keep cash ready at delivery."),
    });
  }

  // 2. RAZORPAY
  if (provider === "razorpay") {
    const keyId = (creds.keyId as string) || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
    const keySecret = (creds.keySecret as string) || process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
      return json({
        error: "Razorpay credentials are not configured yet. Please configure API keys in Admin → Payments.",
        status: "not_configured",
      }, 422);
    }

    try {
      const authorization = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: `Basic ${authorization}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(order.total * 100),
          currency: "INR",
          receipt: order.id,
          payment_capture: 1,
          notes: { orderId: order.id },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return json({
          error: errData?.error?.description || "Razorpay could not initialize payment order.",
          status: "gateway_error",
        }, 502);
      }

      const rzpOrder = await res.json();
      return json({
        mode: "razorpay",
        status: "ready",
        orderId: order.id,
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency || "INR",
        key: keyId,
      });
    } catch {
      return json({ error: "Failed to connect to Razorpay. Please try again." }, 502);
    }
  }

  // 3. STRIPE
  if (provider === "stripe") {
    const pubKey = (creds.publishableKey as string) || "";
    const secKey = (creds.secretKey as string) || "";

    if (!pubKey || !secKey) {
      return json({
        error: "Stripe credentials are not configured yet. Please configure API keys in Admin → Payments.",
        status: "not_configured",
      }, 422);
    }

    return json({
      mode: "stripe",
      status: "ready",
      orderId: order.id,
      amount: order.total,
      publishableKey: pubKey,
      message: "Stripe payment session initialized.",
    });
  }

  // 4. CASHFREE
  if (provider === "cashfree") {
    const appId = (creds.appId as string) || "";
    const secKey = (creds.secretKey as string) || "";

    if (!appId || !secKey) {
      return json({
        error: "Cashfree credentials are not configured yet. Please configure API keys in Admin → Payments.",
        status: "not_configured",
      }, 422);
    }

    return json({
      mode: "cashfree",
      status: "ready",
      orderId: order.id,
      amount: order.total,
      appId,
      message: "Cashfree payment gateway ready.",
    });
  }

  // 5. PAYU
  if (provider === "payu") {
    const mKey = (creds.merchantKey as string) || "";
    const mSalt = (creds.merchantSalt as string) || "";

    if (!mKey || !mSalt) {
      return json({
        error: "PayU credentials are not configured yet. Please configure API keys in Admin → Payments.",
        status: "not_configured",
      }, 422);
    }

    return json({
      mode: "payu",
      status: "ready",
      orderId: order.id,
      amount: order.total,
      merchantKey: mKey,
      message: "PayU gateway ready.",
    });
  }

  // 6. PHONEPE
  if (provider === "phonepe") {
    const mid = (creds.merchantId as string) || "";
    const salt = (creds.saltKey as string) || "";

    if (!mid || !salt) {
      return json({
        error: "PhonePe credentials are not configured yet. Please configure API keys in Admin → Payments.",
        status: "not_configured",
      }, 422);
    }

    return json({
      mode: "phonepe",
      status: "ready",
      orderId: order.id,
      amount: order.total,
      merchantId: mid,
      message: "PhonePe PG ready.",
    });
  }

  return json({
    mode: provider,
    status: configured ? "ready" : "not_configured",
    orderId: order.id,
    amount: order.total,
  });
}
