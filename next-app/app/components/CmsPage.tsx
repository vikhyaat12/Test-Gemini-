import Link from "next/link";
import { store } from "@/lib/commerce/store";

type CmsSection = { heading?: string; text?: string };
type CmsContent = { title?: string; body?: string; sections?: CmsSection[] };

const fallbackSections: CmsSection[] = [
  { heading: "Designed for trust", text: "Transparent standards and clear product information at every touchpoint." },
  { heading: "Built for people", text: "Human insight guides every formulation and service decision." },
  { heading: "Always improving", text: "Our CMS makes this content precise, current, and easy to maintain." },
];

export default async function CmsPage({ contentKey, label }: { contentKey: string; label: string }) {
  const value = await store.content.get(contentKey);
  const content = value?.value as CmsContent | undefined;
  const sections = content?.sections?.length ? content.sections : fallbackSections;
  return (
    <main className="editorial">
      <Link href="/" className="back">← Queens Care</Link>
      <p className="eyebrow">Queens Care / {label}</p>
      <h1>{content?.title || label}</h1>
      <p>{content?.body || "Our team is committed to thoughtful, evidence-led care."}</p>
      <div className="editorial-grid">
        {sections.map((section, i) => (
          <div key={section.heading || i}>
            <b>{section.heading}</b>
            <span>{section.text}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
