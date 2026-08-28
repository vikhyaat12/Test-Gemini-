import type { Metadata } from "next";
import Link from "next/link";

// This catch-all renders a graceful placeholder for unbuilt sections so mistyped
// or legacy links don't hard-404. Because it responds 200 for ANY unknown path,
// it must never be indexed (avoids soft-404 / thin-content SEO penalties).
export const metadata: Metadata = {
  title: "Queens Care",
  robots: { index: false, follow: false },
};

export default async function ContentPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const title = slug.map((part) => part.replace(/-/g, " ")).join(" / ");
  return <main className="subpage"><Link href="/" className="back">← Queens Care</Link><p className="eyebrow">Queens Care Laboratories</p><h1>{title}</h1><p>We are preparing a considered experience for this section. For product discovery, consultation, and care support, please return to our main collection.</p><Link href="/#collection" className="button">Explore the collection</Link></main>;
}
