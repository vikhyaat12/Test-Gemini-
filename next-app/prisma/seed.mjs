// Queens Care Laboratories — database seed
// -----------------------------------------------------------------------------
// Run order (on a machine with DATABASE_URL set and network access):
//   npm run db:generate       # generate the Prisma client from schema.prisma
//   npm run db:migrate:dev     # create the tables (first time) — or: npm run db:push
//   npm run db:seed            # load this data
//
// This file is plain ESM so it runs with `node` directly (no ts-node/tsx needed).
// The password hash format below is IDENTICAL to lib/auth.ts hashPassword():
//   `scrypt$<saltHex>$<scrypt(password, saltHex, 64) as hex>`
// so seeded accounts log in through the normal /api auth flow.
//
// ⚠️  The credentials below are DEVELOPMENT DEFAULTS. Change ADMIN_PASSWORD (and
//     the demo customer) before deploying anything real — or set them via env.

import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@queenscare.in";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "QueensCare#Admin2026";
const CUSTOMER_EMAIL = process.env.SEED_CUSTOMER_EMAIL || "customer@queenscare.in";
const CUSTOMER_PASSWORD = process.env.SEED_CUSTOMER_PASSWORD || "QueensCare#2026";

const products = [
  {
    slug: "lumine-c-serum",
    name: "Lumine-C Serum",
    description: "A considered vitamin C ritual for daily radiance.",
    category: "Dermal care",
    price: 1490,
    stock: 46,
    image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85",
    active: true,
    benefits: ["Visible radiance", "Antioxidant protection", "Lightweight daily finish"],
    rating: 4.9,
    reviewCount: 212,
  },
  {
    slug: "biome-balance",
    name: "Biome Balance",
    description: "Live-culture support formulated for everyday balance.",
    category: "Digestive care",
    price: 1190,
    stock: 61,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=85",
    active: true,
    benefits: ["30 billion live cultures", "Gentle daily support", "Shelf-stable capsules"],
    rating: 4.8,
    reviewCount: 174,
  },
  {
    slug: "nocturne-magnesium",
    name: "Nocturne Magnesium",
    description: "Gentle nightly mineral blend for restful sleep and recovery.",
    category: "Sleep & recovery",
    price: 990,
    stock: 38,
    image: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=900&q=85",
    active: true,
    benefits: ["Supports sleep quality", "Muscle recovery", "Calm evening ritual"],
    rating: 4.7,
    reviewCount: 96,
  },
  {
    slug: "sculpture-spf-50",
    name: "Sculpture SPF 50",
    description: "Invisible broad spectrum shield for everyday dermal care.",
    category: "Dermal care",
    price: 1290,
    stock: 52,
    image: "https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?auto=format&fit=crop&w=900&q=85",
    active: true,
    benefits: ["Broad spectrum SPF 50", "Invisible finish", "Dermatologist tested"],
    rating: 4.8,
    reviewCount: 141,
  },
];

const posts = [
  {
    slug: "afternoon-slump-not-a-personality-flaw",
    title: "Why your afternoon slump is not a personality flaw",
    excerpt: "The 3pm dip is physiology, not a lack of willpower. Here is what is actually happening — and how considered care can help.",
    body: "Most people blame themselves for the mid-afternoon crash. In reality it is a predictable dip in your circadian rhythm, compounded by blood-sugar swings and the cognitive cost of a busy morning. Understanding the mechanism is the first step to working with your body instead of against it. Small, well-timed rituals — hydration, a short walk, and purposefully-dosed support — move the needle far more than another coffee. Care is a practice, and energy is one of its most rewarding returns.",
    category: "Wellness notes",
    readTime: "6 min read",
    image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80",
    published: true,
  },
  {
    slug: "what-clinically-studied-really-means",
    title: "The truth about what “clinically studied” really means",
    excerpt: "Not all evidence is equal. A short, honest guide to reading supplement claims like a scientist.",
    body: "“Clinically studied” can mean anything from a rigorous randomised controlled trial to a single small study funded by the seller. The words that matter are sample size, control group, dose, and independence. At Queens Care we start from a real need, formulate around a meaningful dose, and test independently for purity. This piece walks through the questions worth asking before any product earns a place on your shelf.",
    category: "Expert series",
    readTime: "4 min read",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80",
    published: true,
  },
  {
    slug: "building-an-evening-ritual",
    title: "Building an evening ritual that actually helps you sleep",
    excerpt: "Sleep is downstream of the ninety minutes before bed. A calm, repeatable wind-down beats any single product.",
    body: "Good sleep rarely comes from one heroic intervention. It comes from a repeatable wind-down that signals safety to your nervous system: dimmer light, a consistent time, less input, and gentle mineral support such as magnesium. The goal is not perfection but rhythm. Over a few weeks, a considered evening ritual compounds into deeper, more restorative rest.",
    category: "Wellness notes",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&w=900&q=80",
    published: true,
  },
];

// Editorial page content, keyed to match app/(pages) CmsPage contentKeys.
// This is the canonical, CMS-EDITABLE source of truth: the /admin CMS writes to
// the same Content rows via store.content.save(). Seeding real copy here means
// the About / Manufacturing / Quality / R&D pages ship with distinct, production
// content instead of identical placeholder text — while remaining fully editable.
const content = [
  {
    key: "about",
    value: {
      title: "About Queens Care Laboratories",
      body: "Queens Care Laboratories was founded on a simple conviction: everyday wellness deserves the same rigour and transparency as clinical medicine. We formulate dermal, digestive, and recovery products around clinically meaningful doses, test them independently for purity, and explain plainly what each one does. From our laboratories in India, we serve individuals, clinicians, and distribution partners who expect evidence over marketing.",
      sections: [
        { heading: "Evidence over hype", text: "Every formulation begins with a genuine need and a dose supported by published science — never a passing trend." },
        { heading: "Radical transparency", text: "Clear ingredients, honest claims, and plain-language guidance at every touchpoint." },
        { heading: "Care as a practice", text: "We measure ourselves by outcomes and long-term trust, not by units shipped." },
      ],
    },
  },
  {
    key: "manufacturing",
    value: {
      title: "Manufacturing",
      body: "Our products are made in facilities that operate to Good Manufacturing Practice principles, with controlled environments, calibrated equipment, and documented processes at every stage. Each batch is traceable from raw material to finished unit, so we can stand behind everything that leaves our doors. We favour small, carefully-monitored production runs over sheer volume, because consistency is what turns a good formula into a dependable ritual.",
      sections: [
        { heading: "GMP-aligned facilities", text: "Controlled environments, calibrated equipment, and documented procedures across production." },
        { heading: "Full batch traceability", text: "Every unit is traceable from raw material through to the finished product." },
        { heading: "Consistency by design", text: "Carefully-monitored runs keep each batch true to the formulation you trust." },
      ],
    },
  },
  {
    key: "quality",
    value: {
      title: "Quality assurance",
      body: "Quality at Queens Care is not a final checkpoint — it is built into every step. Raw materials are verified on arrival, in-process controls run throughout production, and finished batches are tested for identity, potency, and purity before release. Where it matters, we commission independent third-party laboratories to confirm our results. Stability testing tells us how a product performs across its shelf life, so the claim on the label still holds true in your hands.",
      sections: [
        { heading: "Tested, then verified", text: "In-house release testing is confirmed by independent third-party laboratories where it matters." },
        { heading: "Purity you can trust", text: "Batches are screened for identity, potency, and contaminants before release." },
        { heading: "Stability-proven", text: "Shelf-life testing ensures the label claim holds true through to the last dose." },
      ],
    },
  },
  {
    key: "research",
    value: {
      title: "Research & development",
      body: "Our development process starts in the literature. Before a product is formulated, we map the evidence for each active, identify the dose that actually moves the outcome, and design around bioavailability and tolerability rather than marketing appeal. Formulations are refined through iterative testing and, where appropriate, guided by input from practising clinicians. The result is a considered, focused range — fewer products, each with a clear reason to exist.",
      sections: [
        { heading: "Literature first", text: "We map the published evidence for every active before a formula is drafted." },
        { heading: "Dose that matters", text: "We formulate to the dose shown to move the outcome — not the cheapest effective minimum." },
        { heading: "Clinician-guided", text: "Input from practising clinicians sharpens tolerability and real-world usefulness." },
      ],
    },
  },
  {
    key: "faq",
    value: [
      { q: "How are Queens Care products different from other wellness brands?", a: "Every formulation begins with a real need and a clinically meaningful dose, not a marketing trend. We test independently for purity, explain plainly what each product does, and favour radical transparency over hype." },
      { q: "Are your products tested on animals?", a: "No. Queens Care is committed to cruelty-free practices. Our products are tested through in-vitro and third-party laboratory methods, never on animals." },
      { q: "How long does delivery take?", a: "Standard delivery across India typically takes 3-5 business days. Orders above 1,500 qualify for complimentary delivery." },
      { q: "Can I return a product if I am not satisfied?", a: "Yes. If a product does not meet your expectations, please reach out to our care team within 14 days of delivery and we will arrange a return or replacement." },
      { q: "Are your ingredients sourced sustainably?", a: "We prioritise traceable, responsibly sourced ingredients. Each product page lists key actives and their sources where available." },
      { q: "Do you offer wholesale or distributor partnerships?", a: "Yes. Visit our B2B portal at /b2b to apply for a distributor or clinic partnership. Our team reviews applications within 5 business days." },
    ],
  },
];

async function main() {
  console.log("Seeding Queens Care database…");

  for (const p of products) {
    await prisma.product.upsert({ where: { slug: p.slug }, update: p, create: p });
  }
  console.log(`  ✓ ${products.length} products`);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { name: "Queens Care Admin", role: "admin" },
    create: { email: ADMIN_EMAIL, name: "Queens Care Admin", role: "admin", passwordHash: hashPassword(ADMIN_PASSWORD) },
  });
  console.log(`  ✓ admin user  → ${ADMIN_EMAIL}`);

  await prisma.user.upsert({
    where: { email: CUSTOMER_EMAIL },
    update: { name: "Demo Customer", role: "customer" },
    create: { email: CUSTOMER_EMAIL, name: "Demo Customer", role: "customer", passwordHash: hashPassword(CUSTOMER_PASSWORD) },
  });
  console.log(`  ✓ demo customer → ${CUSTOMER_EMAIL}`);

  for (const post of posts) {
    await prisma.blogPost.upsert({ where: { slug: post.slug }, update: post, create: post });
  }
  console.log(`  ✓ ${posts.length} blog posts`);

  for (const c of content) {
    await prisma.content.upsert({ where: { key: c.key }, update: { value: c.value }, create: { key: c.key, value: c.value } });
  }
  console.log(`  ✓ ${content.length} content pages`);

  // Silence unused-var lint for `admin` if the client id is not needed downstream.
  void admin.id;

  console.log("\nSeed complete.");
  console.log("  Admin login    :", ADMIN_EMAIL, "/", ADMIN_PASSWORD);
  console.log("  Customer login :", CUSTOMER_EMAIL, "/", CUSTOMER_PASSWORD);
  console.log("  ⚠  Change these credentials before any public deployment.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
