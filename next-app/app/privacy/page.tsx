import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Queens Care Laboratories collects, uses, and protects your personal information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="subpage legal">
      <Link href="/" className="back">← Queens Care</Link>
      <p className="eyebrow">Queens Care Laboratories</p>
      <h1>Privacy policy</h1>
      <p className="legal-meta">Last updated: August 2026</p>

      <p>Your trust is our highest standard. This policy explains how Queens Care Laboratories (&ldquo;Queens Care&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, uses, shares, and protects your personal information when you visit our website, create an account, or place an order. By using our website, you agree to the practices described here.</p>

      <h2>Information we collect</h2>
      <p>We collect information that you provide directly, including your name, email address, phone number, shipping and billing address, and the details of the orders you place. When you contact our care team or subscribe to updates, we retain the information you choose to share with us.</p>
      <p>We also collect limited technical information automatically, such as your device type, browser, approximate location derived from your IP address, and how you interact with our pages. This helps us keep the site secure, measure performance, and improve the experience.</p>
      <p>We do not store your full card or banking details. Payments are processed by our payment partner, Razorpay, which handles your payment information under its own security standards and privacy policy.</p>

      <h2>How we use your information</h2>
      <p>We use your information to process and deliver your orders, confirm payments, provide customer care, prevent fraud and misuse, meet our legal and tax obligations, and, where you have given consent, send you product updates and offers. You can withdraw marketing consent at any time.</p>

      <h2>Your consent and legal basis</h2>
      <p>We process personal data in accordance with applicable Indian law, including the Digital Personal Data Protection Act, 2023. We rely on your consent for optional processing such as marketing, and on legitimate and contractual grounds for the processing needed to fulfil your orders and operate our service.</p>

      <h2>How we share information</h2>
      <p>We share information only as needed to run our service: with payment processors to complete transactions, with logistics and courier partners to deliver your orders, and with technology providers who host and support our systems under confidentiality obligations. We may disclose information where required by law or to protect our rights. We do not sell your personal information.</p>

      <h2>Cookies</h2>
      <p>We use essential cookies to keep the site working and, with your consent where required, analytics cookies to understand usage. You can control cookies through your browser settings; disabling some cookies may affect how the site functions.</p>

      <h2>Data retention</h2>
      <p>We retain personal information for as long as needed to provide our services and to meet legal, accounting, and reporting requirements. When information is no longer needed, we delete or anonymise it.</p>

      <h2>Security</h2>
      <p>We apply appropriate technical and organisational measures to protect your information, including encryption in transit, access controls, and secure session handling. No method of transmission or storage is completely secure, but we work continuously to safeguard your data.</p>

      <h2>Your rights</h2>
      <p>Subject to applicable law, you may request access to the personal data we hold about you, ask us to correct or update it, request its deletion, and withdraw consent you have previously given. To exercise these rights, please contact our care team using the details below.</p>

      <h2>Children</h2>
      <p>Our products and website are intended for adults aged 18 and over. We do not knowingly collect personal information from children. If you believe a child has provided us information, please contact us so we can remove it.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy from time to time. When we do, we will revise the date at the top of this page and, where appropriate, notify you of significant changes.</p>

      <h2>Contact and grievances</h2>
      <p>For any question about this policy or your personal data, or to reach our Grievance Officer under the Digital Personal Data Protection Act, 2023, please write to us at care@queenscare.in or through our contact page. We will respond within the timelines required by applicable law.</p>

      <Link href="/contact" className="button">Contact our care team <span>→</span></Link>
    </main>
  );
}
