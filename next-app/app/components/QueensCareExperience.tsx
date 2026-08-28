/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import Image from "next/image";
import CareScene from "./CareScene";
import DeliveryTimer from "./DeliveryTimer";
import CartBadge from "./CartBadge";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getCartCount, subscribeCart } from "@/lib/client-cart";

type Product = { 
  id: string;
  slug: string;
  name: string; 
  category: string; 
  price: number; 
  description: string;
  note: string; 
  image: string; 
  tag: string;
  stock: number;
  rating?: number;
  reviewCount?: number;
  benefits?: string[];
};

function Icon({ children }: { children: string }) { return <span aria-hidden="true">{children}</span>; }

export default function QueensCareExperience() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wish, setWish] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{name?:string;email?:string;role?:string} | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d=>{ if(d.user) setUser(d.user); }).catch(()=>{});
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const { store } = await import("@/lib/commerce/store");
        const data = await store.products.list();
        // Map store products to include note and tag for UI
        const mappedProducts = data.map((p) => ({
          ...p,
          note: p.description.split(".")[0] || p.description,
          tag: p.rating && p.rating >= 4.8 ? "Bestseller" : p.reviewCount && p.reviewCount > 150 ? "Popular" : "New",
        }));
        setProducts(mappedProducts);
        const cats = [...new Set(data.map((p) => p.category))];
        setCategories(cats);
      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const shown = useMemo(() => products.filter((p) => `${p.name} ${p.category}`.toLowerCase().includes(search.toLowerCase())), [search, products]);
  
  const add = (product: Product) => {
    setNotice(`${product.name} is in your care bag.`);
    import("@/lib/client-cart")
      .then((m) => m.addToCart({ productId: product.slug, quantity: 1 }))
      .catch(() => {});
  };

  // keep bag badge in sync with persisted client storage
  useEffect(() => {
    const unsubscribe = subscribeCart((_, count) => setCartCount(count));
    const id = requestAnimationFrame(() => setCartCount(getCartCount()));
    return () => {
      cancelAnimationFrame(id);
      unsubscribe();
    };
  }, []);

  const toggleWish = (name: string) => setWish((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name]);
  const subscribe = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); setNotice("You're on the Queens Care list. Thank you."); };
  
  return <div className="site-shell">
    <div className="announcement"><span>Complimentary delivery on orders above ₹1,500</span><DeliveryTimer/><Link href="/doctors">For healthcare professionals →</Link></div>
    <header className="nav-wrap"><Link href="/" className="brand" aria-label="Queens Care home"><i>Q</i><span>QUEENS<br/><b>CARE</b></span></Link><nav className={menu ? "open" : ""}><a href="#collection">Shop</a><a href="#science">Our science</a><a href="#journal">Journal</a><Link href="/b2b">Partners</Link><Link href="/contact">Contact</Link></nav><div className="nav-actions"><Link href="/account" style={{fontSize:12, textDecoration:'none', color:'var(--ink)', marginRight:8, display:'flex', alignItems:'center', gap:4}} aria-label="Account">{user ? <span title={user.email}>Account</span> : <span>Sign In</span>}</Link><label className="search"><Icon>⌕</Icon><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search care" aria-label="Search products" /></label><button className="icon-button" onClick={() => setNotice(wish.length ? `${wish.length} saved product${wish.length > 1 ? "s" : ""}.` : "Your saved list is waiting for its first ritual.")} aria-label="View wishlist">♡<em>{wish.length || ""}</em></button><CartBadge /><button className="bag-dummy" onClick={() => setNotice(cartCount ? `${cartCount} item${cartCount > 1 ? "s" : ""} in your care bag — checkout is ready.` : "Your care bag is empty.")}>Bag <b>{cartCount}</b></button><button className="menu" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">☰</button></div></header>
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
    <main><CareScene />
      <section className="hero"><div className="hero-copy"><p className="eyebrow">A higher standard of everyday care</p><h1>Science, made <em>personal.</em></h1><p className="lead">Intelligent formulations that turn your daily health rituals into small, powerful acts of self-respect.</p><div className="hero-ctas"><a href="#collection" className="button">Explore the collection <span>→</span></a><a href="#science" className="text-link">How we formulate <span>↗</span></a></div><div className="ratings"><div className="avatars"><span>R</span><span>S</span><span>A</span></div><p><b>4.9 / 5</b> from 12,000+ care rituals</p></div></div><div className="hero-visual" aria-label="Abstract three dimensional pharmaceutical bottle composition"><div className="orb orb-one"/><div className="orb orb-two"/><div className="ring"/><div className="bottle"><div className="cap"/><div className="bottle-label"><i>Q</i><small>QUEENS CARE</small><b>LUMINE-C™</b><span>Radiance serum</span></div></div><p className="vertical-label">FORMULATED WITH INTENTION</p></div></section>
      <section className="trust-strip"><span>✦ Made in India</span><span>✦ Third-party tested</span><span>✦ Traceable ingredients</span><span>✦ Designed with doctors</span></section>
      <section className="collection section" id="collection"><div className="section-head"><div><p className="eyebrow">The care edit</p><h2>Considered essentials<br/>for your <em>whole self.</em></h2></div><a href="#collection" className="text-link">Shop all care <span>→</span></a></div><div className="category-row">{categories.map((cat, index) => <button key={cat} onClick={() => setSearch(cat)}><span>0{index + 1}</span>{cat}<b>→</b></button>)}</div>{loading ? (
        <p style={{ marginTop: 40, color: "var(--muted)", textAlign: "center" }}>Loading collection…</p>
      ) : (
        <>
          <div className="product-grid">{shown.map((product) => <Link href={`/products/${product.slug}`} key={product.id} style={{ textDecoration: "none", color: "inherit" }}><article className="product"><div className="product-image"><Image src={product.image} alt={product.name} fill sizes="(max-width: 650px) 50vw, 25vw"/><span className="pill">{product.tag}</span><button className="heart" onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); toggleWish(product.name); }} aria-label={`Save ${product.name}`}>{wish.includes(product.name) ? "♥" : "♡"}</button><button className="quick-add" onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); add(product); }}>Add to bag</button></div><p>{product.category}</p><h3>{product.name}</h3><small>{product.note}</small><div className="price"><b>₹{product.price.toLocaleString("en-IN")}</b><span>★★★★★</span></div></article></Link>)}</div>{shown.length === 0 && products.length > 0 && <p className="empty">No results yet. Try &ldquo;wellness&rdquo; or choose a care category above.</p>}
        </>
      )}</section>
      <section className="science" id="science"><div className="science-image"><Image src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=85" alt="Laboratory researcher at work" fill sizes="(max-width: 650px) 100vw, 50vw"/><div className="stat-card"><b>97<sup>%</sup></b><span>of customers feel a difference within 30 days*</span></div></div><div className="science-copy"><p className="eyebrow">The Queens Care standard</p><h2>Precision you can feel. <em>Proof you can see.</em></h2><p>We bring pharmaceutical rigor to the products that live on your shelf. Each formula begins with a real need, is built around meaningful dosage, and is independently tested for purity.</p><div className="principles"><div><b>01</b><span><strong>Purposeful dosage</strong>Not marketing-magic ingredients.</span></div><div><b>02</b><span><strong>Radical clarity</strong>Every ingredient has a reason to be here.</span></div><div><b>03</b><span><strong>Better by design</strong>Elegant rituals, lower-impact choices.</span></div></div><Link className="button light" href="/about">Meet our standard <span>→</span></Link></div></section>
      <section className="ritual section"><div className="section-head"><div><p className="eyebrow">Build your ritual</p><h2>Care that meets you<br/><em>where you are.</em></h2></div><p className="side-copy">Not sure where to begin? Let our guided care finder create a considered starting point in under two minutes.</p></div><div className="ritual-cards"><a href="#collection" className="ritual-card amber"><span>01</span><h3>I want to feel<br/>more <em>energised.</em></h3><b>Discover energy care →</b></a><a href="#collection" className="ritual-card lavender"><span>02</span><h3>I want a calmer<br/><em>evening.</em></h3><b>Discover sleep care →</b></a><a href="#collection" className="ritual-card rose"><span>03</span><h3>I want to glow<br/>from <em>within.</em></h3><b>Discover dermal care →</b></a></div></section>
      <section className="quote"><div className="quote-mark">&ldquo;</div><blockquote>For the first time, my wellness routine feels less like a chore — and more like a quiet promise to myself.</blockquote><div><b>Meera Shah</b><span>Queens Care member since 2023</span></div><div className="quote-controls"><button aria-label="Previous testimonial">←</button><span>01 / 03</span><button aria-label="Next testimonial">→</button></div></section>
      <section className="journal section" id="journal"><div className="section-head"><div><p className="eyebrow">The care journal</p><h2>Intelligence for a<br/><em>life well lived.</em></h2></div><Link href="/blog" className="text-link">Read the journal <span>→</span></Link></div><div className="journal-grid"><article><img src="https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80" alt="Fresh morning fruit"/><p>WELLNESS NOTES · 6 MIN READ</p><h3>Why your afternoon slump is not a personality flaw</h3><Link href="/blog/afternoon-slump-not-a-personality-flaw">Read story →</Link></article><article><img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80" alt="Health consultation"/><p>EXPERT SERIES · 4 MIN READ</p><h3>The truth about what &ldquo;clinically studied&rdquo; really means</h3><Link href="/blog/what-clinically-studied-really-means">Read story →</Link></article><article className="journal-cta"><span>THE<br/>CARE<br/>LETTER</span><h3>A smarter kind of inbox.</h3><p>Thoughtful dispatches on science, care, and living well.</p><form onSubmit={subscribe}><input type="email" required aria-label="Your email address" placeholder="Your email address"/><button aria-label="Subscribe">→</button></form></article></div></section>
      <section className="consult"><div><p className="eyebrow">Care, with a human on the other end</p><h2>Questions deserve<br/>thoughtful answers.</h2><p>Our care team is here to help you make confident choices — no pressure, no jargon.</p><Link href="/contact" className="button">Talk to our care team <span>→</span></Link></div><div className="consult-image"><img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1000&q=85" alt="Doctor speaking with a patient"/></div></section>
    </main>
    <footer><div className="footer-top"><Link href="/" className="brand inverse"><i>Q</i><span>QUEENS<br/><b>CARE</b></span></Link><p>Care is a practice.<br/>Make it <em>yours.</em></p><form onSubmit={subscribe}><label htmlFor="footer-email">A considered note, once in a while.</label><div><input id="footer-email" type="email" required placeholder="Email address"/><button aria-label="Subscribe">→</button></div></form></div><div className="footer-links"><div><b>Shop</b><Link href="/#collection">All care</Link><Link href="/shop">Best sellers</Link><Link href="/b2b">B2B portal</Link></div><div><b>About</b><Link href="/about">Our story</Link><Link href="/blog">Journal</Link><Link href="/careers">Careers</Link><Link href="/contact">Contact</Link></div><div><b>Support</b><Link href="/faq">FAQ</Link><Link href="/track-order">Track order</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div><div><b>For professionals</b><Link href="/doctors">Doctor portal</Link><Link href="/b2b">Distributor portal</Link></div></div><div className="footer-bottom"><span>© 2026 Queens Care Laboratories. All rights reserved.</span><span>India · English</span><span>Queens Care Laboratories · India</span></div></footer>
  </div>;
}