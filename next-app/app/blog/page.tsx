import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { store } from "@/lib/commerce/store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Care Journal — Queens Care Laboratories",
  description: "Intelligence for a life well lived. Expert insights, wellness science, and stories from our Queens Care community.",
};

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string; search?: string }> }) {
  const sp = await searchParams;
  const category = sp.category || "all";
  const search = sp.search || "";

  let posts = await store.posts.list();

  if (category && category !== "all") {
    posts = posts.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    posts = posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.tags?.toLowerCase().includes(q)
    );
  }

  const featured = posts.find((p) => p.featured);
  const regular = posts.filter((p) => p !== featured);

  const allPosts = await store.posts.list();
  const categories = [...new Set(allPosts.map((p) => p.category).filter(Boolean))];

  return (
    <main className="editorial">
      <Link href="/" className="back">← Queens Care</Link>
      <p className="eyebrow">Queens Care Laboratories</p>
      <h1>The care journal</h1>
      <p style={{ maxWidth: 520, marginBottom: 40 }}>
        Intelligence for a life well lived. Expert insights, wellness science, and stories from our community.
      </p>

      {/* Category filters */}
      {categories.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          <Link href="/blog" style={{ padding: "6px 16px", fontSize: 12, textTransform: "uppercase" as const, letterSpacing: ".06em", textDecoration: "none", background: category === "all" || !category ? "var(--purple)" : "transparent", color: category === "all" || !category ? "#fff" : "var(--ink)", border: "1px solid var(--line)" }}>All</Link>
          {categories.map((cat) => (
            <Link key={cat} href={`/blog?category=${encodeURIComponent(cat!)}`} style={{ padding: "6px 16px", fontSize: 12, textTransform: "uppercase" as const, letterSpacing: ".06em", textDecoration: "none", background: category === cat?.toLowerCase() ? "var(--purple)" : "transparent", color: category === cat?.toLowerCase() ? "#fff" : "var(--ink)", border: "1px solid var(--line)" }}>{cat}</Link>
          ))}
        </div>
      )}

      {/* Featured post */}
      {featured && !search && (category === "all" || !category) && (
        <Link href={`/blog/${featured.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block", marginBottom: 48 }}>
          <article style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center", padding: "32px 0", borderBottom: "1px solid var(--line)" }}>
            <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden" }}>
              <Image src={featured.image || "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80"} alt={featured.title} fill sizes="(max-width: 768px) 100vw, 50vw" style={{ objectFit: "cover" }} />
            </div>
            <div>
              <p style={{ fontSize: 11, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--gold)", fontWeight: 600, marginBottom: 8 }}>Featured · {(featured.category || "Wellness").toUpperCase()}</p>
              <h2 style={{ font: "clamp(24px,3vw,36px)/1.15 var(--font-display)", marginBottom: 12, letterSpacing: "-.02em" }}>{featured.title}</h2>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--muted)", marginBottom: 16 }}>{featured.excerpt}</p>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--muted)" }}>
                {featured.author && <span>{featured.author}</span>}
                <span>{featured.readTime || "5 min read"}</span>
              </div>
            </div>
          </article>
        </Link>
      )}

      {/* Post grid */}
      <div className="journal-grid">
        {regular.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: "none", color: "inherit" }}>
            <article>
              <div style={{ position: "relative", aspectRatio: "3/2", overflow: "hidden" }}>
                <Image src={post.image || "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80"} alt={post.title} fill sizes="(max-width: 650px) 100vw, (max-width: 1024px) 50vw, 33vw" style={{ objectFit: "cover" }} />
              </div>
              <p style={{ fontSize: 11, textTransform: "uppercase" as const, letterSpacing: ".1em", color: "var(--muted)", marginTop: 16 }}>{(post.category || "WELLNESS NOTES").toUpperCase()} · {(post.readTime || "6 MIN READ").toUpperCase()}</p>
              <h3 style={{ font: "20px var(--font-display)", margin: "8px 0" }}>{post.title}</h3>
              <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 12 }}>{post.excerpt}</p>
              <div style={{ display: "flex", gap: 12, fontSize: 11, color: "var(--muted)" }}>
                {post.author && <span>{post.author}</span>}
                <span>{new Date(post.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </article>
          </Link>
        ))}
        {regular.length === 0 && !featured && (
          <article className="journal-cta">
            <span>THE<br/>CARE<br/>LETTER</span>
            <h3>A smarter kind of inbox.</h3>
            <p>Thoughtful dispatches on science, care, and living well.</p>
            <form>
              <input type="email" required aria-label="Your email address" placeholder="Your email address" />
              <button aria-label="Subscribe">→</button>
            </form>
          </article>
        )}
        {regular.length === 0 && featured && (
          <p style={{ gridColumn: "1/-1", textAlign: "center", color: "var(--muted)", padding: "60px 0" }}>
            No more articles match your filter. <Link href="/blog" style={{ color: "var(--purple)" }}>View all posts</Link>
          </p>
        )}
      </div>

      {/* Newsletter */}
      <article className="journal-cta" style={{ marginTop: 48 }}>
        <span>THE<br/>CARE<br/>LETTER</span>
        <h3>A smarter kind of inbox.</h3>
        <p>Thoughtful dispatches on science, care, and living well.</p>
        <form>
          <input type="email" required aria-label="Your email address" placeholder="Your email address" />
          <button aria-label="Subscribe">→</button>
        </form>
      </article>
    </main>
  );
}
