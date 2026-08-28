import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { store } from "@/lib/commerce/store";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = await store.posts.bySlug((await params).slug);
  return { title: post?.title || "Post not found" };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await store.posts.bySlug((await params).slug);
  if (!post) return notFound();

  return (
    <main className="editorial">
      <Link href="/blog" className="back">← The Care Journal</Link>
      <p className="eyebrow">Queens Care Laboratories</p>
      <article style={{ maxWidth: 800 }}>
        <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
          {post.category || "WELLNESS NOTES"} · {post.readTime || "6 MIN READ"}
        </p>
        <h1 style={{ font: "clamp(36px,5vw,64px)/1.1 var(--font-display)", margin: "16px 0 24px", letterSpacing: "-.03em" }}>
          {post.title}
        </h1>
        {post.excerpt && (
          <p style={{ fontSize: 18, lineHeight: 1.7, color: "var(--muted)", marginBottom: 40, fontStyle: "italic" }}>
            {post.excerpt}
          </p>
        )}
        {post.image && (
          <Image
            src={post.image}
            alt={post.title}
            width={1200}
            height={630}
            sizes="(max-width: 820px) 100vw, 820px"
            style={{ width: "100%", height: "auto", maxHeight: 500, objectFit: "cover", marginBottom: 40, borderRadius: 8 }}
          />
        )}
        <div
          style={{
            fontSize: 16,
            lineHeight: 1.9,
            color: "var(--ink)",
            maxWidth: 720,
          }}
          dangerouslySetInnerHTML={{ __html: post.content || post.body || "" }}
        />
        {!post.content && !post.body && (
          <p style={{ color: "var(--muted)", fontStyle: "italic" }}>
            Full article content is managed in our CMS. Connect your content source to display the complete article.
          </p>
        )}
        <hr style={{ margin: "60px 0", border: "none", borderTop: "1px solid var(--line)" }} />
        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <Link href="/blog" className="text-link">
            Back to journal <span>←</span>
          </Link>
          <Link href="/#collection" className="button">
            Explore the collection <span>→</span>
          </Link>
        </div>
      </article>
    </main>
  );
}