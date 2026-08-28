import Link from "next/link";
import { store } from "@/lib/commerce/store";

export default async function Page() {
  const items: { q: string; a: string }[] = ((await store.content.get("faq"))?.value as { q: string; a: string }[]) ?? [];
  return (
    <main className="editorial">
      <Link href="/" className="back">← Queens Care</Link>
      <p className="eyebrow">Care support</p>
      <h1>Frequently asked questions.</h1>
      <div className="faq-list">
        {items.map((item: { q: string; a: string }) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
