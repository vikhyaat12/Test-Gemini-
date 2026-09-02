"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { CartLine } from "@/lib/commerce/types";
import { getCartLines, subscribeCart, updateCartLine, removeFromCart } from "@/lib/client-cart";


type Product = { id: string; slug: string; name: string; price: number; image: string; category: string; stock: number };
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function Page() {
  // localStorage is not available during the server render. Re-read it once the
  // page is mounted so navigation from a product page cannot render a stale bag.
  // Lazy initializer reads localStorage on client hydration (returns [] during SSR).
  const [lines, setLines] = useState<CartLine[]>(() => getCartLines());
  const [products, setProducts] = useState<Product[]>([]);
  const [productError, setProductError] = useState(false);
  const [freeThreshold, setFreeThreshold] = useState(1500);
  const [standardFee, setStandardFee] = useState(99);

  const fetchProducts = () =>
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => Array.isArray(d?.products) && setProducts(d.products))
      .catch(() => setProductError(true));

  const fetchRules = () =>
    fetch("/api/shipping/rules")
      .then((r) => r.json())
      .then((d) => {
        if (d?.freeShippingThreshold !== undefined) setFreeThreshold(Number(d.freeShippingThreshold));
        if (d?.standardShippingFee !== undefined) setStandardFee(Number(d.standardShippingFee));
      })
      .catch(() => {});

  const loadProducts = () => {
    setProductError(false);
    fetchProducts();
    fetchRules();
  };

  useEffect(() => {
    fetchProducts();
    fetchRules();
    // Analytics: cart view
    try { ((window as unknown) as Record<string, (...args: unknown[]) => void>).__qc_track_cart_view?.(); } catch {}
    return subscribeCart((nextLines) => setLines(nextLines));
  }, []);

  const items = useMemo(() => lines.map((l) => {
    const p = products.find((x) => x.id === l.productId || x.slug === l.productId);
    return p ? { ...p, quantity: l.quantity } : null;
  }).filter(Boolean) as (Product & { quantity: number })[], [lines, products]);

  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  const shippingFee = items.length === 0 ? 0 : subtotal >= freeThreshold ? 0 : standardFee;
  const total = subtotal + shippingFee;
  const count = lines.reduce((s, l) => s + l.quantity, 0);

  const changeQty = (slug: string, qty: number) => {
    if (qty < 1) return;
    setLines(updateCartLine(slug, qty));
  };

  const remove = (slug: string) => setLines(removeFromCart(slug));

  return (
    <main className="cart-main">
      <header className="cart-header">
        <Link href="/" className="brand" aria-label="Queens Care home"><i>Q</i><span>QUEENS<br /><b>CARE</b></span></Link>
        <Link href="/" className="cart-back">← Continue shopping</Link>
      </header>
      <p className="eyebrow cart-eyebrow">Your care bag</p>
      <h1 className="cart-title">The bag.</h1>
      {items.length ? (
        <div className="cart-grid">
          <section className="cart-items">
            {productError && (
              <div className="cart-notice" role="alert">
                <p>We had trouble loading the latest product details. Please try again.</p>
                <button onClick={loadProducts}>Retry</button>
              </div>
            )}
            {items.map((it) => (
              <div key={it.slug} className="cart-item">
                <Image src={it.image || "/placeholder.png"} alt={it.name} width={96} height={96} />
                <div className="cart-item-info">
                  <p className="cart-item-cat">{it.category}</p>
                  <b>{it.name}</b>
                  <div className="cart-qty">
                    <button onClick={() => changeQty(it.slug, it.quantity - 1)} aria-label="Decrease quantity">−</button>
                    <span>{it.quantity}</span>
                    <button onClick={() => changeQty(it.slug, it.quantity + 1)} aria-label="Increase quantity" disabled={it.quantity >= it.stock}>+</button>
                  </div>
                  {it.quantity >= it.stock && <p className="cart-stock-hint">Max available: {it.stock}</p>}
                </div>
                <div className="cart-item-right">
                  <em>{inr(it.price * it.quantity)}</em>
                  <button className="cart-remove" onClick={() => remove(it.slug)} aria-label={`Remove ${it.name}`}>Remove</button>
                </div>
              </div>
            ))}
          </section>
          <aside className="cart-summary">
            <h2>Summary</h2>
            <div className="cart-totals">
              <div><span>Subtotal ({count} item{count === 1 ? "" : "s"})</span><b>{inr(subtotal)}</b></div>
              <div><span>Shipping</span><b>{shippingFee === 0 ? "Free" : inr(shippingFee)}</b></div>
              {shippingFee > 0 && <p className="cart-hint">Add {inr(freeThreshold - subtotal)} more for free shipping.</p>}
              <div className="cart-total"><span>Total</span><b>{inr(total)}</b></div>
            </div>
            <Link href="/checkout" className="button cart-cta">Checkout <span>→</span></Link>
            <p className="cart-note">Complimentary delivery on orders above {inr(freeThreshold)}. Secure payments.</p>
          </aside>
        </div>
      ) : (
        <div className="cart-empty">
          <span className="cart-empty-mark">🛍️</span>
          <h2>Your care bag is empty.</h2>
          <p>Explore the collection and discover your next ritual.</p>
          <Link href="/#collection" className="button">Explore the collection <span>→</span></Link>
        </div>
      )}
    </main>
  );
}
