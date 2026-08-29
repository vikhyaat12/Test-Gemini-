import { json, requireUser } from "@/lib/http";
import { store } from "@/lib/commerce/store";
import { affiliateStore } from "@/lib/commerce/store-extensions";
import type { CartLine, ShippingDetails } from "@/lib/commerce/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateShipping(raw: unknown): ShippingDetails | null {
  if (!raw || typeof raw !== "object") return null;
  const b = raw as Record<string, unknown>;
  const fullName = typeof b.fullName === "string" ? b.fullName.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const phone = typeof b.phone === "string" ? b.phone.trim() : "";
  const address = typeof b.address === "string" ? b.address.trim() : "";
  const city = typeof b.city === "string" ? b.city.trim() : "";
  const state = typeof b.state === "string" ? b.state.trim() : "";
  const pincode = typeof b.pincode === "string" ? b.pincode.trim() : "";
  if (!fullName) return null;
  if (!EMAIL_RE.test(email)) return null;
  if (!/^[0-9+\-\s]{8,15}$/.test(phone)) return null;
  if (address.length < 8) return null;
  if (!city) return null;
  if (!state) return null;
  if (!/^\d{6}$/.test(pincode)) return null;
  return { fullName, email, phone, address, city, state, pincode };
}

function lineKey(lines: CartLine[]): string {
  return lines.map((l) => `${l.productId}:${l.quantity}`).sort().join("|");
}

export async function GET() {
  const user = await requireUser();
  return user ? json({ orders: await store.orders.list(user) }) : json({ error: "Unauthorized" }, 401);
}

export async function POST(request: Request) {
  // allow guest order creation — we do not require authentication here,
  // but if a user is present, use their id
  const maybeUser = await requireUser().catch(() => null);
  const userId = maybeUser ? maybeUser.id : `guest-${Date.now().toString(36)}`;

  const body = await request.json().catch(() => null);
  const lines = Array.isArray(body?.lines) ? body.lines : [];
  if (!lines.length) return json({ error: "Your bag is empty." }, 422);

  const shipping = validateShipping(body?.shipping);
  if (!shipping) return json({ error: "Shipping details are incomplete or invalid." }, 422);

  const errors: Array<{ productId: string; reason: string }> = [];
  const resolvedLines: Array<{ productId: string; name: string; unitPrice: number; quantity: number }> = [];
  let subtotal = 0;

  const productsAll = await store.products.all();
  for (const line of lines) {
    if (!line || typeof line.productId !== "string" || !Number.isInteger(line.quantity) || line.quantity < 1) {
      errors.push({ productId: String(line?.productId ?? ""), reason: "Invalid line item." });
      continue;
    }
    const p = productsAll.find((x) => x.id === line.productId || x.slug === line.productId);
    if (!p) {
      errors.push({ productId: line.productId, reason: "Product not found." });
      continue;
    }
    if (!p.active) {
      errors.push({ productId: line.productId, reason: "Product is no longer available." });
      continue;
    }
    if (p.stock < line.quantity) {
      errors.push({ productId: line.productId, reason: `Insufficient stock. Available: ${p.stock}` });
      continue;
    }
    // use server-side price only — never trust client-sent prices
    const unitPrice = p.price;
    resolvedLines.push({ productId: p.slug, name: p.name, unitPrice, quantity: line.quantity });
    subtotal += unitPrice * line.quantity;
  }

  if (errors.length) { const msg=errors[0].reason.startsWith("Insufficient stock")?errors[0].reason:"Your bag needs attention. Please review the items."; return json({ error: msg, details: errors }, 422); }

  // server-side shipping: free above INR 1,500, otherwise a flat INR 99 fee
  const FREE_SHIPPING_THRESHOLD = 1500, SHIPPING_FEE = 99;
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const total = subtotal + shippingFee;

  // duplicate prevention: same user + same cart + same total within 10 minutes
  const cartLines: CartLine[] = resolvedLines.map((r) => ({ productId: r.productId, quantity: r.quantity }));
  const duplicate = await store.orders.findRecentDuplicate(userId, lineKey(cartLines), total);
  if (duplicate) return json({ error: "This order was already placed just now. Please check your orders.", orderId: duplicate.id }, 409);

  // atomically decrement stock for every line before persisting the order.
  // If any decrement fails, roll back the ones we already applied.
  const decremented: string[] = [];
  for (const r of resolvedLines) {
    const ok = await store.products.decrementStock(r.productId, r.quantity);
    if (!ok) {
      for (const slug of decremented) {
        await store.products.decrementStock(slug, -resolvedLines.find((x) => x.productId === slug)!.quantity).catch(() => {});
      }
      return json({ error: `Insufficient stock for ${r.name}. Please adjust your bag.` }, 422);
    }
    decremented.push(r.productId);
  }

  // create order with server-validated total, canonical product slugs, and unit prices
  const orderLines = resolvedLines.map((r) => ({ productId: r.productId, quantity: r.quantity, unitPrice: r.unitPrice }));
  const order = await store.orders.create(userId, orderLines, total, shipping);

  // Affiliate conversion attribution
  const cookieHeader = request.headers.get("cookie") || "";
  const matchRef = cookieHeader.match(/qc_affiliate_ref=([^;]+)/);
  const matchLink = cookieHeader.match(/qc_affiliate_link_id=([^;]+)/);
  const refCode = body?.affiliateRef || (matchRef ? decodeURIComponent(matchRef[1]) : null);
  const linkId = body?.affiliateLinkId || (matchLink ? decodeURIComponent(matchLink[1]) : undefined);

  if (refCode) {
    try {
      const resolved = await affiliateStore.byRef(refCode);
      if (resolved?.affiliate && resolved.affiliate.status === "active") {
        const rate = Number(resolved.affiliate.commissionRate || 10);
        const commissionAmount = Math.round((subtotal * rate) / 100);
        if (commissionAmount > 0) {
          await affiliateStore.recordCommission(
            String(resolved.affiliate.id),
            String(order.id),
            commissionAmount,
            linkId || (resolved.link ? String(resolved.link.id) : undefined)
          );
        }
      }
    } catch (e) {
      console.error("Affiliate attribution error:", e);
    }
  }

  return json({ order: { ...order, lines: resolvedLines, total, shipping } }, 201);
}