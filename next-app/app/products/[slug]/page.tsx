/* eslint-disable @next/next/no-img-element */
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { store } from "@/lib/commerce/store";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/app/components/AddToCartButton";
import ProductGallery from "@/app/components/ProductGallery";
import ProductTabs from "./ProductTabs";

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
  const related = (full?.relatedFrom || []).map(r => r.relatedProduct).filter(Boolean);
  const aplus = full?.aplusSections || [];
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

          <div className="trust-signals">
            <span>✦ Third-party tested</span>
            <span>✦ Traceable ingredients</span>
            <span>✦ Made in India</span>
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
          {aplus.map(section => (
            <div key={section.id} style={{ marginBottom: 32 }}>
              {section.type === "hero_banner" && section.imageUrl && (
                <div style={{ position: "relative", width: "100%", aspectRatio: "21/9", overflow: "hidden" }}>
                  <img src={section.imageUrl} alt={section.imageAlt || section.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {section.heading && <div style={{ position: "absolute", bottom: 20, left: 20, color: "#fff", background: "rgba(0,0,0,0.5)", padding: "12px 20px" }}><h3 style={{ margin: 0 }}>{section.heading}</h3></div>}
                </div>
              )}
              {section.type === "image_text" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "center" }}>
                  {section.imageUrl && <img src={section.imageUrl} alt={section.imageAlt || ""} style={{ width: "100%" }} />}
                  <div>
                    {section.title && <p className="eyebrow">{section.title}</p>}
                    {section.heading && <h3 style={{ font: "20px var(--font-display)" }}>{section.heading}</h3>}
                    {section.body && <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink)" }}>{section.body}</p>}
                  </div>
                </div>
              )}
              {section.type === "rich_text" && (
                <div>
                  {section.title && <p className="eyebrow">{section.title}</p>}
                  {section.heading && <h3 style={{ font: "20px var(--font-display)", marginBottom: 12 }}>{section.heading}</h3>}
                  {section.body && <p style={{ fontSize: 14, lineHeight: 1.8, color: "var(--ink)" }}>{section.body}</p>}
                  {section.imageUrl && <img src={section.imageUrl} alt={section.imageAlt || ""} style={{ width: "100%", marginTop: 16 }} />}
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

      {/* ─── RELATED PRODUCTS ─── */}
      {related.length > 0 && (
        <section style={{ marginTop: 48 }}>
          <h2 style={{ font: "22px var(--font-display)", marginBottom: 20 }}>You may also like</h2>
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
