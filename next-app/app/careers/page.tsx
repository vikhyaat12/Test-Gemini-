import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Careers" };

export default function CareersPage() {
  return (
    <main className="subpage">
      <Link href="/" className="back">← Queens Care</Link>
      <p className="eyebrow">Queens Care Laboratories</p>
      <h1>Careers</h1>
      <p>We are always looking for curious, rigorous people who care about the science of wellbeing. Open roles will be posted here as we grow.</p>
      <Link href="/contact" className="button">Get in touch</Link>
    </main>
  );
}