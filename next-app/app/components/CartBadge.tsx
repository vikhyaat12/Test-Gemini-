"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCartCount, subscribeCart } from "@/lib/client-cart";

export default function CartBadge() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const unsubscribe = subscribeCart((_, c) => setCount(c));
    const id = requestAnimationFrame(() => setCount(getCartCount()));
    return () => {
      cancelAnimationFrame(id);
      unsubscribe();
    };
  }, []);
  return (
    <Link href="/cart" className="bag" aria-label={`Cart with ${count} item${count === 1 ? "" : "s"}`}>
      Bag
      <b>{count}</b>
    </Link>
  );
}