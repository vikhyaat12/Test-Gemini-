/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { store } from "@/lib/commerce/store";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/app/components/AddToCartButton";
import ProductGallery from "@/app/components/ProductGallery";
import ProductTabs from "./ProductTabs";
import DeliveryCalculator from "@/app/components/DeliveryCalculator";
import RecommendationsSection from "@/app/components/RecommendationsSection";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = await store.products.bySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.image ? [product.image] : [],
    },
  };
}

async function getProductFull(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { sort: "asc" } },
        variants: { where: { active: true }, orderBy: { sort: "asc" } },
        specifications: { orderBy: { sort: "asc" } },
        model3d: true,
        productFaqs: { orderBy: { sort: "asc" } },
        reviews: { where: { visible: true }, orderBy: { createdAt: "desc" }, include: { user: true } },
        relatedFrom: { include: { relatedProduct: true } },
        aplusSections: { where: { active: true }, orderBy: { sort: "asc" } },
        videos: { where: { active: true }, orderBy: { sort: "asc" } },
      },
    });
    return product;
  } catch {
    return null;
  }
}

async function getQA(productId: string) {
  try {
    return await prisma.productQA.findMany({ where: { productId, visible: true }, orderBy: { createdAt: "desc" } });
  } catch { return []; }
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const product = await store.products.bySlug((await params).slug);
  if (!product) return notFound();

  const full = await getProductFull(product.slug);
  const rawImages = (product as Record<string, unknown>).images;
  const fallbackImages = Array.isArray(rawImages) ? (rawImages as string[]).map((u, i) => ({ id: `img-${i}`, url: u, alt: product.name })) : [];
  const images = (full?.images && full.images.length > 0) ? full.images : fallbackImages;
  const variants = full?.variants || [];
  
  let fallbackSpecs: Array<{ id: string; name: string; value: string }> = [];
  try {
    const rawSpecs = (product as Record<string, unknown>).specifications;
    if (Array.isArray(rawSpecs)) fallbackSpecs = rawSpecs.map((s, i) => ({ id: `sp-${i}`, name: s.name, value: s.value }));
    else if (typeof rawSpecs === "string") fallbackSpecs = JSON.parse(rawSpecs).map((s: { name: string; value: string }, i: number) => ({ id: `sp-${i}`, name: s.name, value: s.value }));
  } catch {}

  const specs = (full?.specifications && full.specifications.length > 0) ? full.specifications : fallbackSpecs;
  const faqs = full?.productFaqs || [];
  const reviews = full?.reviews || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let related: any[] = (full?.relatedFrom || []).map(r => r.relatedProduct).filter(Boolean);
  // Fallback: read relatedProducts slugs from the product itself
  if (related.length === 0) {
    try {
      const rawRelated = (product as Record<string, unknown>).relatedProducts;
      if (Array.isArray(rawRelated) && rawRelated.length > 0) {
        related = (await Promise.all(rawRelated.map(async (slug: string) => {
          const p = await store.products.bySlug(slug);
          return p ? { id: p.id, slug: p.slug, name: p.name, image: p.image, price: p.price } : null;
        }))).filter(Boolean);
      }
    } catch {}
  }
  const aplusPrisma = full?.aplusSections || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let aplusFallback: any[] = [];
  try {
    const raw = (product as Record<string, unknown>).aplusContent;
    if (Array.isArray(raw)) aplusFallback = raw.map((s: Record<string, unknown>, i: number) => ({
      id: `ap-${i}`,
      type: String(s.type || 'richText'),
      heading: String(s.heading || ''),
      title: String(s.heading || ''),
      text: String(s.text || ''),
      body: String(s.text || ''),
      imageUrl: String(s.imageUrl || ''),
      imageAlt: String(s.imageAlt || ''),
      videoUrl: String(s.videoUrl || ''),
      ctaText: String(s.ctaText || ''),
      ctaLink: String(s.ctaLink || ''),
      items: Array.isArray(s.items) ? s.items as string[] : [],
      published: s.published !== false,
    }));
  } catch {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aplusRaw: any[] = aplusPrisma.length > 0 ? aplusPrisma : aplusFallback;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aplusPublished = !!(product as any).aplusPublished;
  const aplus: any[] = aplusPublished ? aplusRaw : [];
  const videos = full?.videos || [];
  const model3d = full?.model3d;
  const questions = full ? await getQA(full.id) : [];

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : String(product.rating || "—");
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({ star, count: reviews.filter(r => r.rating === star).length }));

  return (
    <main className="product-detail">
      <Link href="/shop" className="back">← Back to shop</Link>

      {/* ─── GALLERY ─── */}
      <div className="detail-grid">
        <div className="product-gallery">
          <ProductGallery mainImage={product.image} productName={product.name} images={images.map(img => ({ id: img.id, url: img.url, alt: img.alt || undefined }))} />
        </div>

        <div className="product-info">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="rating">★★★★★ {avgRating} · {reviews.length || product.reviewCount || 0} verified reviews</p>
          <p className="product-description">{product.description}</p>

          {/* ─── VARIANTS ─── */}
          {variants.length > 0 && (
            <div style={{ margin: "16px 0" }}>
              <label style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 8 }}>Available options</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {variants.map(v => (
                  <div key={v.id} style={{ padding: "8px 16px", border: "1px solid var(--line)", fontSize: 12 }}>
                    <b>{v.name}</b> — ₹{v.price.toLocaleString("en-IN")} {v.stock > 0 ? `· ${v.stock} in stock` : <span style={{ color: "#b34141" }}>Out of stock</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── PRICING ─── */}
          <div className="detail-price">
            ₹{product.price.toLocaleString("en-IN")}
            {product.mrp && product.mrp > product.price && (
              <span style={{ textDecoration: "line-through", color: "var(--muted)", fontSize: 16, marginLeft: 8 }}>₹{product.mrp.toLocaleString("en-IN")}</span>
            )}
            {product.discount && product.discount > 0 && (
              <span style={{ color: "#4caf50", fontSize: 13, marginLeft: 8 }}>({product.discount}% off)</span>
            )}
          </div>

          {/* ─── BENEFITS ─── */}
          {product.benefits && product.benefits.length > 0 && (
            <div className="benefits-section">
              <h3>Key benefits</h3>
              <ul>
                {product.benefits.map((benefit) => (
                  <li key={benefit}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {/* ─── BADGES ─── */}
          {Boolean((product as Record<string, unknown>).bestSeller) && (
            <div style={{ display: "inline-block", padding: "4px 12px", background: "var(--gold)", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" as const, marginTop: 12 }}>BEST SELLER</div>
          )}
          {Boolean((product as Record<string, unknown>).newArrival) && (
            <div style={{ display: "inline-block", padding: "4px 12px", background: "#4caf50", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" as const, marginTop: 12, marginLeft: 8 }}>NEW ARRIVAL</div>
          )}
          {Boolean((product as Record<string, unknown>).featured) && (
            <div style={{ display: "inline-block", padding: "4px 12px", background: "var(--purple)", color: "#fff", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" as const, marginTop: 12, marginLeft: 8 }}>FEATURED</div>
          )}
          <div className="trust-signals">
            <span>✦ Third-party tested</span>
            <span>✦ Traceable ingredients</span>
            <span>✦ Made in India</span>
          </div>
          <div style={{ marginTop: 12 }}>
            <DeliveryCalculator productPrice={product.price} />
          </div>

          {/* ─── STOCK & ADD TO CART ─── */}
          <div className="product-meta">
            {product.stock > 0 ? <p style={{ color: "#4caf50" }}>In stock: {product.stock} units</p> : <p style={{ color: "#b34141" }}>Out of stock</p>}
            <p>SKU: {product.slug}</p>
          </div>
          <div className="product-actions">
            <AddToCartButton productId={product.slug} />
            <Link className="button" href="/checkout">Checkout <span>→</span></Link>
          </div>
        </div>
      </div>

      {/* ─── SPECIFICATIONS TABLE ─── */}
      {specs.length > 0 && (
        <section style={{ marginTop: 48, maxWidth: 800 }}>
          <h2 style={{ font: "22px var(--font-display)", marginBottom: 20 }}>Product information</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              <tr><td style={{ padding: "10px 16px", background: "var(--paper)", fontWeight: 600, width: "40%", border: "1px solid var(--line)" }}>Brand</td><td style={{ padding: "10px 16px", border: "1px solid var(--line)" }}>{product.brand || "Queens Care"}</td></tr>
              <tr><td style={{ padding: "10px 16px", background: "var(--paper)", fontWeight: 600, border: "1px solid var(--line)" }}>Product name</td><td style={{ padding: "10px 16px", border: "1px solid var(--line)" }}>{product.name}</td></tr>
              <tr><td style={{ padding: "10px 16px", background: "var(--paper)", fontWeight: 600, border: "1px solid var(--line)" }}>Category</td><td style={{ padding: "10px 16px", border: "1px solid var(--line)" }}>{product.category}</td></tr>
              {product.ingredients && <tr><td style={{ padding: "10px 16px", background: "var(--paper)", fontWeight: 600, border: "1px solid var(--line)" }}>Ingredients</td><td style={{ padding: "10px 16px", border: "1px solid var(--line)" }}>{product.ingredients}</td></tr>}
              {product.usage && <tr><td style={{ padding: "10px 16px", background: "var(--paper)", fontWeight: 600, border: "1px solid var(--line)" }}>Usage</td><td style={{ padding: "10px 16px", border: "1px solid var(--line)" }}>{product.usage}</td></tr>}
              {product.safetyInfo && <tr><td style={{ padding: "10px 16px", background: "var(--paper)", fontWeight: 600, border: "1px solid var(--line)" }}>Safety information</td><td style={{ padding: "10px 16px", border: "1px solid var(--line)" }}>{product.safetyInfo}</td></tr>}
              {specs.map(s => (
                <tr key={s.id}><td style={{ padding: "10px 16px", background: "var(--paper)", fontWeight: 600, border: "1px solid var(--line)" }}>{s.name}</td><td style={{ padding: "10px 16px", border: "1px solid var(--line)" }}>{s.value}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ─── PRODUCT VIDEOS ─── */}
      {videos.length > 0 && (
        <section style={{ marginTop: 48, maxWidth: 800 }}>
          <h2 style={{ font: "22px var(--font-display)", marginBottom: 20 }}>Product videos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {videos.map(v => (
              <div key={v.id} style={{ border: "1px solid var(--line)" }}>
                <video src={v.url} poster={v.posterUrl || undefined} controls style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
                {v.title && <p style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{v.title}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── 3D MODEL ─── */}
      {model3d && model3d.enabled && (
        <section style={{ marginTop: 48, maxWidth: 800 }}>
          <h2 style={{ font: "22px var(--font-display)", marginBottom: 20 }}>3D product view</h2>
          <div style={{ border: "1px solid var(--line)", padding: 20, textAlign: "center" }}>
            <p style={{ color: "var(--muted)", fontSize: 13 }}>Interactive 3D model available. Model format: {model3d.format} · Auto-rotate: {model3d.autoRotate ? "Yes" : "No"}</p>
            {model3d.posterUrl && <img src={model3d.posterUrl} alt="3D model preview" style={{ maxWidth: 400, marginTop: 12 }} />}
          </div>
        </section>
      )}

      {/* ─── A+ CONTENT ─── */}
      {aplus.length > 0 && (
        <section style={{ marginTop: 48, maxWidth: 900 }}>
          <h2 style={{ font: "22px var(--font-display)", marginBottom: 24 }}>About this product</h2>
          {aplus.filter((s: Record<string, unknown>) => s.published !== false).map(section => (
            <div key={section.id} style={{ marginBottom: 32 }}>
              {/* Rich Text */}
              {(section.type === "rich_text" || section.type === "richText") && (
                <div>
                  {section.heading && <h3 style={{ font: "20px var(--font-display)", marginBottom: 12 }}>{section.heading}</h3>}
                  {(section.text || section.body) && <div style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink)" }} dangerouslySetInnerHTML={{ __html: section.text || section.body || "" }} />}
                  {section.imageUrl && <img src={section.imageUrl} alt={section.imageAlt || ""} style={{ width: "100%", marginTop: 16 }} />}
                </div>
              )}
              {/* Hero / Hero Banner */}
              {(section.type === "hero" || section.type === "hero_banner") && (
                <div style={{ position: "relative", width: "100%", aspectRatio: "21/9", overflow: "hidden" }}>
                  {section.imageUrl && <img src={section.imageUrl} alt={section.imageAlt || section.heading || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  {section.heading && <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, color: "#fff", background: "rgba(0,0,0,0.5)", padding: "16px 24px" }}><h3 style={{ margin: 0, fontSize: 22 }}>{section.heading}</h3>{section.text && <p style={{ margin: "4px 0 0", fontSize: 14, opacity: 0.9 }}>{section.text}</p>}</div>}
                </div>
              )}
              {/* Full Width Image */}
              {section.type === "fullWidth" && (
                <div>
                  {section.imageUrl && <img src={section.imageUrl} alt={section.imageAlt || section.heading || ""} style={{ width: "100%" }} />}
                  {section.heading && <h3 style={{ font: "20px var(--font-display)", marginTop: 16, marginBottom: 8 }}>{section.heading}</h3>}
                  {section.text && <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink)" }}>{section.text}</p>}
                </div>
              )}
              {/* Image + Text */}
              {(section.type === "imageText" || section.type === "image_text") && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "center" }}>
                  {section.imageUrl && <img src={section.imageUrl} alt={section.imageAlt || ""} style={{ width: "100%" }} />}
                  <div>
                    {section.heading && <h3 style={{ font: "20px var(--font-display)" }}>{section.heading}</h3>}
                    {(section.body || section.text) && <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink)" }}>{section.body || section.text}</p>}
                  </div>
                </div>
              )}
              {/* Benefits / Features / Comparison / Highlights — grid of items */}
              {(section.type === "benefits" || section.type === "features" || section.type === "comparison" || section.type === "highlights") && (
                <div>
                  {section.heading && <h3 style={{ font: "20px var(--font-display)", marginBottom: 12 }}>{section.heading}</h3>}
                  {(section.items && section.items.length > 0) && (
                    <div style={{ display: "grid", gridTemplateColumns: section.type === "comparison" ? "repeat(auto-fill, minmax(200px, 1fr))" : "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
                      {section.items.map((item: string, idx: number) => (
                        <div key={idx} style={{ padding: 16, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: section.type === "highlights" ? 8 : 0 }}>
                          <p style={{ fontSize: 14, lineHeight: 1.6 }}>{item}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {section.imageUrl && <img src={section.imageUrl} alt="" style={{ width: "100%", marginTop: 16 }} />}
                  {(section.text || section.body) && !section.items?.length && <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink)" }}>{section.text || section.body}</p>}
                </div>
              )}
              {/* Video Section */}
              {section.type === "video" && (
                <div>
                  {section.heading && <h3 style={{ font: "20px var(--font-display)", marginBottom: 12 }}>{section.heading}</h3>}
                  {section.videoUrl && (
                    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden" }}>
                      <iframe src={section.videoUrl.includes("youtube") ? section.videoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/") : section.videoUrl} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }} allowFullScreen loading="lazy" title={section.heading || "Product video"} />
                    </div>
                  )}
                  {!section.videoUrl && section.imageUrl && <img src={section.imageUrl} alt="" style={{ width: "100%" }} />}
                  {section.text && <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8, textAlign: "center" }}>{section.text}</p>}
                </div>
              )}
              {/* CTA Section */}
              {section.type === "cta" && (
                <div style={{ textAlign: "center", padding: "48px 24px", background: section.imageUrl ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${section.imageUrl}) center/cover` : "var(--paper)", borderRadius: 4 }}>
                  {section.heading && <h3 style={{ font: "24px var(--font-display)", color: section.imageUrl ? "#fff" : "var(--purple)", marginBottom: 8 }}>{section.heading}</h3>}
                  {section.text && <p style={{ fontSize: 14, color: section.imageUrl ? "#eee" : "var(--ink)", marginBottom: 20, maxWidth: 600, margin: "0 auto 20px" }}>{section.text}</p>}
                  {section.ctaText && (
                    <a href={section.ctaLink || "/shop"} style={{ display: "inline-block", padding: "14px 32px", background: "var(--purple)", color: "#fff", textDecoration: "none", fontSize: 14, fontWeight: 600, letterSpacing: ".03em" }}>
                      {section.ctaText}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* ─── TABS: Ingredients / Usage / Reviews / Q&A ─── */}
      <ProductTabs
        productId={full?.id || product.id}
        product={product}
        reviews={reviews.map(r => ({ id: r.id, rating: r.rating, title: r.title, body: r.body, user: { name: (r.user as Record<string, unknown>)?.name as string || "Customer" }, createdAt: String(r.createdAt), helpful: r.helpful || 0 }))}
        avgRating={avgRating}
        ratingDist={ratingDist}
        faqs={faqs.map(f => ({ q: f.question, a: f.answer }))}
        questions={questions.map(q => ({ id: q.id, question: q.question, answer: q.answer || null, createdAt: String(q.createdAt) }))}
      />

      {/* ─── RECOMMENDATIONS ENGINE ─── */}
      <RecommendationsSection currentSlug={product.slug} title="You may also like" limit={4} />

      {/* ─── RELATED PRODUCTS (manual fallback) ─── */}
      {related.length > 0 && (
        <section style={{ marginTop: 48 }}>
          <h2 style={{ font: "22px var(--font-display)", marginBottom: 20 }}>Related products</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 20 }}>
            {related.map(p => (
              <Link href={`/products/${p.slug}`} key={p.id} style={{ textDecoration: "none", color: "inherit" }}>
                <img src={p.image} alt={p.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover" }} loading="lazy" />
                <b style={{ display: "block", marginTop: 8, font: "16px var(--font-display)" }}>{p.name}</b>
                <span style={{ fontSize: 13, fontWeight: 600 }}>₹{p.price.toLocaleString("en-IN")}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
