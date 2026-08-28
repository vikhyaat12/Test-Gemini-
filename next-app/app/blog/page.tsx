import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { store } from "@/lib/commerce/store";

export const metadata: Metadata = { title: "The Care Journal" };

export default async function BlogPage() {
  const posts = await store.posts.list();
  return (
    <main className="editorial">
      <Link href="/" className="back">← Queens Care</Link>
      <p className="eyebrow">Queens Care Laboratories</p>
      <h1>The care journal</h1>
      <p>Intelligence for a life well lived. Expert insights, wellness science, and stories from our community.</p>
      <div className="journal-grid">
        {posts.map((post) => (
          <article key={post.slug}>
            <Image src={post.image || "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80"} alt={post.title} width={900} height={600} />
            <p>{(post.category || "WELLNESS NOTES").toUpperCase()} · {(post.readTime || "6 min read").toUpperCase()}</p>
            <h3>{post.title}</h3>
            <Link href={`/blog/${post.slug}`}>Read story →</Link>
          </article>
        ))}
        {!posts.length && (
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
      </div>
    </main>
  );
}