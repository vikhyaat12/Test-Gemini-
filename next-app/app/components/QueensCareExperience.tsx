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
  bestSeller?: boolean;
  newArrival?: boolean;
  featured?: boolean;
};

type BlogPostItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category?: string;
  readTime?: string;
  image?: string;
  author?: string;
  createdAt: string;
  featured?: boolean;
};

function Icon({ children }: { children: string }) { return <span aria-hidden="true">{children}</span>; }

export default function QueensCareExperience() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPostItem[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wish, setWish] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [menu, setMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{name?:string;email?:string;role?:string} | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoHeight, setLogoHeight] = useState<string>("34px");
  const [logoMaxWidth, setLogoMaxWidth] = useState<string>("180px");
  const [hpSections, setHpSections] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    fetch("/api/auth/me").then(r=>r.json()).then(d=>{ if(d.user) setUser(d.user); }).catch(()=>{});
    // Fetch public theme settings and apply as CSS variables
    fetch("/api/settings").then(r=>r.json()).then(d=>{
      (d.settings||[]).forEach((s:{key:string;value:string})=>{
        if(s.key==='theme_primary' && s.value) document.documentElement.style.setProperty('--purple', s.value);
        if(s.key==='theme_gold' && s.value) document.documentElement.style.setProperty('--gold', s.value);
        if(s.key==='logo_url' && s.value) setLogoUrl(s.value);
        if(s.key==='logo_height_desktop' && s.value) setLogoHeight(`${s.value}px`);
        if(s.key==='logo_max_width' && s.value) setLogoMaxWidth(`${s.value}px`);
      });
    }).catch(()=>{});
    fetch("/api/homepage").then(r=>r.json()).then(d=>{ if(d.sections?.length) setHpSections(d.sections); }).catch(()=>{});
    fetch("/api/blog").then(r=>r.json()).then(d=>{ if(d.posts?.length) setBlogPosts(d.posts); }).catch(()=>{});
  }, []);

  const getHp = (type: string) => hpSections.find((s) => s.type === type && s.active && s.visible);
  const getHpContent = (type: string) => { const s = getHp(type); try { return (typeof s?.content === 'string' ? JSON.parse(s.content as string) : s?.content) || {}; } catch { return {}; } };

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const productList = (data.products || []) as Product[];
        const mappedProducts = productList.map((p) => ({
          ...p,
          note: p.description ? (p.description.split(".")[0] || p.description) : "",
          tag: p.bestSeller ? "Bestseller" : (p.newArrival ? "New" : (p.featured ? "Featured" : (p.rating && p.rating >= 4.8 ? "Popular" : "New"))),
        }));
        setProducts(mappedProducts);
        const cats = [...new Set(productList.map((p) => p.category).filter(Boolean))];
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
    <div className="announcement"><span>{getHpContent("banner").text || "Complimentary delivery on orders above ₹1,500"}</span><DeliveryTimer/><Link href={getHpContent("banner").secondaryLink || "/doctors"}>{getHpContent("banner").secondaryText || "For healthcare professionals"} →</Link></div>
    <header className="nav-wrap"><Link href="/" className="brand" aria-label="Queens Care home">{logoUrl ? <img src={logoUrl} alt="Queens Care" style={{height:logoHeight,maxWidth:logoMaxWidth,objectFit:'contain'}} /> : <i>Q</i>}<span>QUEENS<br/><b>CARE</b></span></Link><nav className={menu ? "open" : ""}><a href="#collection">Shop</a><Link href="/about">About</Link><a href="#science">Our science</a><Link href="/blog">Journal</Link><Link href="/b2b">Partners</Link><Link href="/affiliate">Affiliate</Link><Link href="/doctors">Doctors</Link><Link href="/employee">Our Team</Link><Link href="/contact">Contact</Link></nav><div className="nav-actions"><Link href="/account" style={{fontSize:12, textDecoration:'none', color:'var(--ink)', marginRight:8, display:'flex', alignItems:'center', gap:4}} aria-label="Account">{user ? <span title={user.email}>Account</span> : <span>Sign In</span>}</Link><label className="search"><Icon>⌕</Icon><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search care" aria-label="Search products" /></label><button className="icon-button" onClick={() => setNotice(wish.length ? `${wish.length} saved product${wish.length > 1 ? "s" : ""}.` : "Your saved list is waiting for its first ritual.")} aria-label="View wishlist">♡<em>{wish.length || ""}</em></button><CartBadge /><button className="bag-dummy" onClick={() => setNotice(cartCount ? `${cartCount} item${cartCount > 1 ? "s" : ""} in your care bag — checkout is ready.` : "Your care bag is empty.")}>Bag <b>{cartCount}</b></button><button className="menu" onClick={() => setMenu(!menu)} aria-label="Toggle navigation">☰</button></div></header>
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
    <main><CareScene />
      <section className="hero"><div className="hero-copy"><p className="eyebrow">{getHpContent("hero").eyebrow || "A higher standard of everyday care"}</p><h1 dangerouslySetInnerHTML={{ __html: getHpContent("hero").heading || "Science, made <em>personal.</em>" }} /><p className="lead">{getHpContent("hero").subtitle || "Intelligent formulations that turn your daily health rituals into small, powerful acts of self-respect."}</p><div className="hero-ctas"><a href={getHpContent("hero").ctaLink || "#collection"} className="button">{getHpContent("hero").ctaText || "Explore the collection"} <span>→</span></a><a href={getHpContent("hero").secondaryLink || "#science"} className="text-link">{getHpContent("hero").secondaryText || "How we formulate"} <span>↗</span></a></div><div className="ratings"><div className="avatars"><span>R</span><span>S</span><span>A</span></div><p><b>{getHpContent("hero").rating || "4.9 / 5"}</b> from {getHpContent("hero").ratingCount || "12,000+ care rituals"}</p></div></div><div className="hero-visual" aria-label="Abstract three dimensional pharmaceutical bottle composition"><div className="orb orb-one"/><div className="orb orb-two"/><div className="ring"/><div className="bottle"><div className="cap"/><div className="bottle-label"><i>Q</i><small>QUEENS CARE</small><b>LUMINE-C™</b><span>Radiance serum</span></div></div><p className="vertical-label">FORMULATED WITH INTENTION</p></div></section>
      <section className="trust-strip">{(getHpContent("trust").badges || ["Made in India", "Third-party tested", "Traceable ingredients", "Designed with doctors"]).map((b: string) => <span key={b}>✦ {b}</span>)}</section>
      <section className="collection section" id="collection"><div className="section-head"><div><p className="eyebrow">{getHpContent("collection").eyebrow || "The care edit"}</p><h2 dangerouslySetInnerHTML={{ __html: (getHpContent("collection").heading || "Considered essentials<br/>for your <em>whole self.</em>") }} /></div><a href="#collection" className="text-link">{getHpContent("collection").ctaText || "Shop all care"} <span>→</span></a></div><div className="category-row">{categories.map((cat, index) => <button key={cat} onClick={() => setSearch(cat)}><span>0{index + 1}</span>{cat}<b>→</b></button>)}</div>{loading ? (
        <p style={{ marginTop: 40, color: "var(--muted)", textAlign: "center" }}>Loading collection…</p>
      ) : (
        <>
          <div className="product-grid">{shown.map((product) => <Link href={`/products/${product.slug}`} key={product.id} style={{ textDecoration: "none", color: "inherit" }}><article className="product"><div className="product-image"><Image src={product.image} alt={product.name} fill sizes="(max-width: 650px) 50vw, 25vw"/><span className="pill">{product.tag}</span><button className="heart" onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); toggleWish(product.name); }} aria-label={`Save ${product.name}`}>{wish.includes(product.name) ? "♥" : "♡"}</button><button className="quick-add" onClick={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); add(product); }}>Add to bag</button></div><p>{product.category}</p><h3>{product.name}</h3><small>{product.note}</small><div className="price"><b>₹{product.price.toLocaleString("en-IN")}</b><span>★★★★★</span></div></article></Link>)}</div>{shown.length === 0 && products.length > 0 && <p className="empty">No results yet. Try &ldquo;wellness&rdquo; or choose a care category above.</p>}
        </>
      )}</section>
      <section className="science" id="science"><div className="science-image"><Image src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=85" alt="Laboratory researcher at work" fill sizes="(max-width: 650px) 100vw, 50vw"/><div className="stat-card"><b>97<sup>%</sup></b><span>of customers feel a difference within 30 days*</span></div></div><div className="science-copy"><p className="eyebrow">The Queens Care standard</p><h2>Precision you can feel. <em>Proof you can see.</em></h2><p>We bring pharmaceutical rigor to the products that live on your shelf. Each formula begins with a real need, is built around meaningful dosage, and is independently tested for purity.</p><div className="principles"><div><b>01</b><span><strong>Purposeful dosage</strong>Not marketing-magic ingredients.</span></div><div><b>02</b><span><strong>Radical clarity</strong>Every ingredient has a reason to be here.</span></div><div><b>03</b><span><strong>Better by design</strong>Elegant rituals, lower-impact choices.</span></div></div><Link className="button light" href="/about">Meet our standard <span>→</span></Link></div></section>
      <section className="ritual section"><div className="section-head"><div><p className="eyebrow">Build your ritual</p><h2>Care that meets you<br/><em>where you are.</em></h2></div><p className="side-copy">Not sure where to begin? Let our guided care finder create a considered starting point in under two minutes.</p></div><div className="ritual-cards"><a href="#collection" className="ritual-card amber"><span>01</span><h3>I want to feel<br/>more <em>energised.</em></h3><b>Discover energy care →</b></a><a href="#collection" className="ritual-card lavender"><span>02</span><h3>I want a calmer<br/><em>evening.</em></h3><b>Discover sleep care →</b></a><a href="#collection" className="ritual-card rose"><span>03</span><h3>I want to glow<br/>from <em>within.</em></h3><b>Discover dermal care →</b></a></div></section>
      <section className="quote"><div className="quote-mark">&ldquo;</div><blockquote>{getHpContent("testimonial").quote || "For the first time, my wellness routine feels less like a chore — and more like a quiet promise to myself."}</blockquote><div><b>{getHpContent("testimonial").author || "Meera Shah"}</b><span>{getHpContent("testimonial").attribution || "Queens Care member since 2023"}</span></div><div className="quote-controls"><button aria-label="Previous testimonial">←</button><span>01 / 03</span><button aria-label="Next testimonial">→</button></div></section>

      {/* ─── JOURNAL / BLOG SECTION ─── */}
      <section className="journal section" id="journal">
        <div className="section-head">
          <div>
            <p className="eyebrow">{getHpContent("newsletter").eyebrow || "The care journal"}</p>
            <h2>Ideas, insights and<br/><em>everyday care.</em></h2>
          </div>
          <Link href="/blog" className="text-link">View all journal <span>→</span></Link>
        </div>
        <div className="journal-grid">
          {blogPosts.slice(0, 2).map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
              <article style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative", aspectRatio: "3/2", overflow: "hidden", marginBottom: 12 }}>
                  <img src={post.image || "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80"} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "var(--muted)" }}>
                  {(post.category || "Wellness Notes").toUpperCase()} {post.readTime ? `· ${post.readTime.toUpperCase()}` : ""}
                </p>
                <h3 style={{ font: "20px var(--font-display)", margin: "6px 0 10px", flex: 1 }}>{post.title}</h3>
                <span style={{ fontSize: 13, color: "var(--purple)", fontWeight: 600 }}>Read story →</span>
              </article>
            </Link>
          ))}
          {blogPosts.length === 0 && (
            <p style={{ gridColumn: "1 / span 2", color: "var(--muted)", padding: "30px 0" }}>
              Dispatches from our laboratory are being prepared. <Link href="/blog" style={{ color: "var(--purple)" }}>Visit the journal</Link>
            </p>
          )}
          <article className="journal-cta">
            <span>THE<br/>CARE<br/>LETTER</span>
            <h3>{getHpContent("newsletter").heading || "A smarter kind of inbox."}</h3>
            <p>{getHpContent("newsletter").subtitle || "Thoughtful dispatches on science, care, and living well."}</p>
            <form onSubmit={subscribe}>
              <input type="email" required aria-label="Your email address" placeholder="Your email address"/>
              <button aria-label="Subscribe">→</button>
            </form>
          </article>
        </div>
      </section>

      {/* ─── BECOME AN AFFILIATE SECTION ─── */}
      <section className="section" style={{ background: "var(--paper)", borderTop: "1px solid var(--line)", borderBottom: "1px solid var(--line)", padding: "72px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center" }}>
          <div>
            <p className="eyebrow" style={{ color: "var(--gold)" }}>PARTNERSHIP PROGRAMME</p>
            <h2 style={{ font: "clamp(28px, 4vw, 42px)/1.15 var(--font-display)", letterSpacing: "-.02em", margin: "12px 0 20px" }}>
              Partner with Queens Care Laboratories
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--muted)", marginBottom: 28 }}>
              Share science-backed formulations you believe in and earn through your personalized referral link. Enjoy transparent tracking, dedicated creator support, and straightforward monthly withdrawals.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
              <div style={{ padding: "16px 14px", background: "#fff", border: "1px solid var(--line)" }}>
                <b style={{ fontSize: 20, color: "var(--purple)", display: "block" }}>10%</b>
                <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Commission</span>
              </div>
              <div style={{ padding: "16px 14px", background: "#fff", border: "1px solid var(--line)" }}>
                <b style={{ fontSize: 20, color: "var(--purple)", display: "block" }}>30 Days</b>
                <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Cookie Window</span>
              </div>
              <div style={{ padding: "16px 14px", background: "#fff", border: "1px solid var(--line)" }}>
                <b style={{ fontSize: 20, color: "var(--purple)", display: "block" }}>Direct</b>
                <span style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".06em" }}>Monthly Payouts</span>
              </div>
            </div>
            <Link href="/affiliate" className="button" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              BECOME AN AFFILIATE <span>→</span>
            </Link>
          </div>
          <div style={{ position: "relative", aspectRatio: "4/3", borderRadius: 4, overflow: "hidden", border: "1px solid var(--line)" }}>
            <img src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=85" alt="Queens Care Laboratory Formulations" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        </div>
      </section>

      {/* ─── DOCTORS & HEALTHCARE PROFESSIONALS / CONSULT SECTION ─── */}
      <section className="consult">
        <div>
          <p className="eyebrow">{getHpContent("consult").eyebrow || "Care, with a human on the other end"}</p>
          <h2>{getHpContent("consult").heading || "Questions deserve<br/>thoughtful answers."}</h2>
          <p>{getHpContent("consult").description || "Our care team is here to help you make confident choices — no pressure, no jargon."}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href={getHpContent("consult").ctaLink || "/contact"} className="button">
              {getHpContent("consult").ctaText || "Talk to our care team"} <span>→</span>
            </Link>
            <Link href="/doctors" className="button" style={{ background: "transparent", color: "var(--purple)", border: "1px solid var(--purple)" }}>
              For healthcare professionals <span>→</span>
            </Link>
          </div>
        </div>
        <div className="consult-image">
          <img src={getHpContent("consult").imageUrl || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1000&q=85"} alt="Doctor speaking with a patient"/>
        </div>
      </section>
    </main>
    <footer>
      <div className="footer-top">
        <Link href="/" className="brand inverse">{logoUrl ? <img src={logoUrl} alt="Queens Care" style={{height:logoHeight,maxWidth:logoMaxWidth,objectFit:'contain'}} /> : <i>Q</i>}<span>QUEENS<br/><b>CARE</b></span></Link>
        <p>Care is a practice.<br/>Make it <em>yours.</em></p>
        <form onSubmit={subscribe}>
          <label htmlFor="footer-email">A considered note, once in a while.</label>
          <div>
            <input id="footer-email" type="email" required placeholder="Email address"/>
            <button aria-label="Subscribe">→</button>
          </div>
        </form>
      </div>
      <div className="footer-links">
        <div>
          <b>Shop</b>
          <Link href="/#collection">All care</Link>
          <Link href="/shop">Best sellers</Link>
          <Link href="/b2b">B2B portal</Link>
        </div>
        <div>
          <b>About</b>
          <Link href="/about">Our story</Link>
          <Link href="/blog">Journal</Link>
          <Link href="/employee">Our team</Link>
          <Link href="/careers">Careers</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div>
          <b>Support</b>
          <Link href="/faq">FAQ</Link>
          <Link href="/track-order">Track order</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
        <div>
          <b>Partnerships</b>
          <Link href="/doctors">Doctor portal</Link>
          <Link href="/b2b">Distributor portal</Link>
          <Link href="/affiliate">Become an Affiliate</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 Queens Care Laboratories. All rights reserved.</span>
        <span>India · English</span>
        <span>Queens Care Laboratories · India</span>
      </div>
    </footer>
  </div>;
}