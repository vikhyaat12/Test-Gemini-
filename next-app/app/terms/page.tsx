import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of the Queens Care Laboratories website and services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main className="subpage legal">
      <Link href="/" className="back">← Queens Care</Link>
      <p className="eyebrow">Queens Care Laboratories</p>
      <h1>Terms of service</h1>
      <p className="legal-meta">Last updated: August 2026</p>

      <p>These terms govern your use of the Queens Care Laboratories (&ldquo;Queens Care&rdquo;) website and services. By accessing our site or placing an order, you agree to these terms. Please read them carefully.</p>

      <h2>Eligibility</h2>
      <p>You must be at least 18 years of age and able to form a legally binding contract to use our services. By using the site, you confirm that you meet these requirements and that the information you provide is accurate.</p>

      <h2>Products and health disclaimer</h2>
      <p>Our products are wellness and nutritional supplements. They are not intended to diagnose, treat, cure, or prevent any disease, and the information on this site is provided for general educational purposes only. It is not medical advice. Please consult a qualified healthcare professional before starting any supplement, particularly if you are pregnant or nursing, taking medication, or managing a medical condition.</p>

      <h2>Orders and acceptance</h2>
      <p>Your order is an offer to purchase. We may accept or decline it, and we may cancel an order if a product is unavailable, if pricing or product information was published in error, or if we suspect fraud. Where we cancel an order that you have already paid for, we will issue a refund.</p>

      <h2>Pricing and payment</h2>
      <p>All prices are listed in Indian Rupees and are inclusive or exclusive of taxes as indicated at checkout. Payments are processed securely through our payment partner, Razorpay. By submitting a payment, you authorise us and our payment partner to charge the applicable amount for your order.</p>

      <h2>Shipping and delivery</h2>
      <p>We aim to dispatch orders promptly and to deliver within the estimated timeframes shown at checkout. Delivery times are estimates and are not guaranteed. Risk in the products passes to you on delivery.</p>

      <h2>Returns, refunds, and cancellations</h2>
      <p>If a product arrives damaged, defective, or incorrect, please contact our care team promptly so we can arrange a replacement or refund. For hygiene and safety reasons, opened or used consumable products may not be eligible for return except where required by law. Approved refunds are issued to the original payment method.</p>

      <h2>Intellectual property</h2>
      <p>All content on this site, including text, graphics, logos, product names, and design, is owned by or licensed to Queens Care and is protected by intellectual property laws. You may not copy, reproduce, or use our content without our prior written permission.</p>

      <h2>Acceptable use</h2>
      <p>You agree not to misuse the site, including by attempting to gain unauthorised access, interfering with its operation, scraping data, or using it for any unlawful purpose.</p>

      <h2>Disclaimers and limitation of liability</h2>
      <p>The site and products are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. To the fullest extent permitted by law, Queens Care disclaims implied warranties and is not liable for indirect, incidental, or consequential damages arising from your use of the site or products. Nothing in these terms limits any liability that cannot be excluded under applicable law.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of India, and the courts of India shall have jurisdiction over any dispute arising from them.</p>

      <h2>Changes to these terms</h2>
      <p>We may update these terms from time to time. Continued use of the site after changes take effect constitutes acceptance of the revised terms.</p>

      <h2>Contact</h2>
      <p>For any question about these terms, please write to us at care@queenscare.in or through our contact page.</p>

      <Link href="/contact" className="button">Contact our care team <span>→</span></Link>
    </main>
  );
}
