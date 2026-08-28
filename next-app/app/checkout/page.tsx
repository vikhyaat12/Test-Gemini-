"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CartLine } from "@/lib/commerce/types";
import { getCartLines, subscribeCart, clearCart } from "@/lib/client-cart";

type Product = { id: string; slug: string; name: string; price: number; image: string; stock: number };
type Shipping = { fullName: string; email: string; phone: string; address: string; city: string; state: string; pincode: string };
type Status = "idle" | "loading" | "error" | "success";

const empty: Shipping = { fullName: "", email: "", phone: "", address: "", city: "", state: "", pincode: "" };
const FREE = 1500, FEE = 99;
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[0-9+\-\s]{8,15}$/;

export default function Page() {
  // Lazy initializer reads localStorage on client hydration (returns [] during SSR).
  const [lines, setLines] = useState<CartLine[]>(() => getCartLines());
  const [products, setProducts] = useState<Product[]>([]);
  const [productError, setProductError] = useState(false);
  const [shipping, setShipping] = useState<Shipping>(empty);
  const [errors, setErrors] = useState<Partial<Shipping>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [notice, setNotice] = useState("");
  const [orderId, setOrderId] = useState("");
  const [paidTotal, setPaidTotal] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const fetchProducts = () =>
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => Array.isArray(d?.products) && setProducts(d.products))
      .catch(() => setProductError(true));

  const loadProducts = () => {
    setProductError(false);
    fetchProducts();
  };

  useEffect(() => {
    fetchProducts();
    return subscribeCart((nextLines) => setLines(nextLines));
  }, []);

  const items = useMemo(() => lines.map((l) => {
    const p = products.find((x) => x.id === l.productId || x.slug === l.productId);
    return p ? { ...p, quantity: l.quantity } : null;
  }).filter(Boolean) as (Product & { quantity: number })[], [lines, products]);

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const shippingFee = subtotal === 0 ? 0 : subtotal >= FREE ? 0 : FEE;
  const total = subtotal + shippingFee - couponDiscount;
  const bagEmpty = lines.length === 0 || items.length === 0;

  const validate = () => {
    const e: Partial<Shipping> = {};
    if (!shipping.fullName.trim()) e.fullName = "Full name is required.";
    if (!EMAIL.test(shipping.email)) e.email = "Enter a valid email.";
    if (!PHONE.test(shipping.phone)) e.phone = "Enter a valid phone number.";
    if (shipping.address.trim().length < 8) e.address = "Enter your complete address.";
    if (!shipping.city.trim()) e.city = "City is required.";
    if (!shipping.state.trim()) e.state = "State is required.";
    if (!/^\d{6}$/.test(shipping.pincode)) e.pincode = "Enter a valid 6-digit PIN code.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const setField = (k: keyof Shipping, v: string) => {
    setShipping((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const field = (k: keyof Shipping, label: string, placeholder: string, type = "text", cls = "") => (
    <div className={`checkout-field ${cls}`}>
      <label>{label} *</label>
      <input type={type} value={shipping[k]} onChange={(e) => setField(k, e.target.value)} placeholder={placeholder} />
      {errors[k] && <em>{errors[k]}</em>}
    </div>
  );

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponMessage("");
    try {
      const r = await fetch("/api/coupons/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: couponCode, subtotal }) });
      const d = await r.json();
      if (r.ok) { setCouponDiscount(d.discount); setCouponMessage(`Coupon applied! You save ${inr(d.discount)}.`); }
      else { setCouponDiscount(0); setCouponMessage(d.error || "Invalid coupon."); }
    } catch { setCouponMessage("Could not validate coupon."); }
    setCouponLoading(false);
  };

  const removeCoupon = () => { setCouponCode(""); setCouponDiscount(0); setCouponMessage(""); };

  const placeOrder = async () => {
    setNotice("");
    if (bagEmpty) return setNotice("Your care bag is empty. Add a product before checking out.");
    if (!validate()) return setNotice("Please fix the highlighted fields.");
    setStatus("loading");
    try {
      const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lines: items.map((i) => ({ productId: i.slug, quantity: i.quantity })), shipping, couponCode: couponCode || undefined }) });
      const j = await r.json();
      if (!r.ok) { setStatus("error"); return setNotice(j.error || "We could not place your order."); }
      setOrderId(j.order.id);
      setPaidTotal(j.order.total);
      clearCart();
      setLines([]);
      setStatus("success");
    } catch { setStatus("error"); setNotice("A network error occurred. Please try again."); }
  };

  if (status === "success") return (
    <main className="checkout-main">
      <div className="checkout-success">
        <div className="checkout-success-mark">✓</div>
        <p className="eyebrow">Order confirmed</p>
        <h1>Thank you, {shipping.fullName.split(" ")[0] || "friend"}.</h1>
        <p className="checkout-success-sub">Your order <b>{orderId}</b> has been placed. A confirmation email is on its way to {shipping.email}.</p>
        <div className="checkout-success-total"><span>Amount</span><b>{inr(paidTotal)}</b></div>
        <div className="checkout-ctas"><Link href="/" className="button">Continue shopping</Link><Link href="/account" className="text-link">View your orders <span>→</span></Link></div>
        <button className="checkout-anchor" onClick={() => { setStatus("idle"); setShipping(empty); setErrors({}); }}>Place another order</button>
      </div>
    </main>
  );

  return (
    <main className="checkout-main">
      <header className="checkout-header">
        <Link href="/" className="brand" aria-label="Queens Care home"><i>Q</i><span>QUEENS<br /><b>CARE</b></span></Link>
        <Link href="/cart" className="checkout-back">← Back to cart</Link>
      </header>
      <div className="checkout-grid">
        <section className="checkout-form">
          <p className="eyebrow">Secure checkout</p>
          <h1>Almost yours.</h1>
          {bagEmpty ? (
            <div className="checkout-empty-bag" role="status">
              <span className="cart-empty-mark">🛍️</span>
              <h2>Your care bag is empty.</h2>
              <p>Add a product to your bag before checking out.</p>
              <Link href="/#collection" className="button">Explore the collection <span>→</span></Link>
            </div>
          ) : (
            <>
              {productError && (
                <div className="cart-notice" role="alert">
                  <p>We had trouble loading the latest product details. Please try again.</p>
                  <button onClick={loadProducts}>Retry</button>
                </div>
              )}
              <div className="checkout-form-block">
                <h2>Contact</h2>
                {field("fullName", "Full name", "Meera Shah")}
                <div className="checkout-field-row">{field("email", "Email", "you@example.com", "email")}{field("phone", "Phone", "+91 98765 43210", "tel")}</div>
              </div>
              <div className="checkout-form-block">
                <h2>Shipping address</h2>
                {field("address", "Address", "Flat no, building, street")}
                <div className="checkout-field-row">{field("city", "City", "Mumbai")}{field("state", "State", "Maharashtra")}{field("pincode", "PIN code", "400001", "text", "checkout-pincode")}</div>
              </div>
              {notice && <p className="checkout-notice" role="alert">{notice}</p>}
              <button className="button checkout-submit" onClick={placeOrder} disabled={status === "loading"}>{status === "loading" ? "Placing your order…" : `Place order · ${inr(total)}`}</button>
            </>
          )}
        </section>
        <aside className="checkout-summary">
          <h2>Order summary</h2>
          {items.length ? (
            <div className="checkout-items">{items.map((it) => (
              <div key={it.slug} className="checkout-item">
                <Image src={it.image || "/placeholder.png"} alt={it.name} width={56} height={56} />
                <div><b>{it.name}</b><span>Qty {it.quantity}</span></div>
                <em>{inr(it.price * it.quantity)}</em>
              </div>
            ))}</div>
          ) : <p className="checkout-empty">Your care bag is empty. <Link href="/">Shop now</Link>.</p>}
          <div className="checkout-totals">
            <div><span>Subtotal</span><b>{inr(subtotal)}</b></div>
            <div><span>Shipping</span><b>{shippingFee === 0 ? "Free" : inr(shippingFee)}</b></div>
            {shippingFee > 0 && <p className="checkout-shipping-hint">Add {inr(FREE - subtotal)} more for free shipping.</p>}
            <div style={{ display: "flex", gap: 8, margin: "12px 0" }}>
              <input value={couponCode} onChange={e => setCouponCode(e.target.value)} placeholder="Coupon code" style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--line)", fontSize: 13 }} />
              {couponDiscount > 0 ? (
                <button onClick={removeCoupon} style={{ padding: "8px 12px", border: "1px solid #b34141", background: "#fff", color: "#b34141", cursor: "pointer", fontSize: 11 }}>Remove</button>
              ) : (
                <button onClick={applyCoupon} disabled={couponLoading} style={{ padding: "8px 12px", border: "1px solid var(--line)", background: "#fff", cursor: "pointer", fontSize: 11 }}>{couponLoading ? "…" : "Apply"}</button>
              )}
            </div>
            {couponMessage && <p style={{ fontSize: 11, color: couponDiscount > 0 ? "#2e7d32" : "#b34141", margin: "0 0 8px" }}>{couponMessage}</p>}
            {couponDiscount > 0 && <div><span>Coupon discount</span><b style={{ color: "#2e7d32" }}>-{inr(couponDiscount)}</b></div>}
            <div className="checkout-total"><span>Total</span><b>{inr(total > 0 ? total : 0)}</b></div>
          </div>
        </aside>
      </div>
    </main>
  );
}
