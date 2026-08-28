import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuthUser, B2BApplication, BlogPost, CartLine, ContactMessage, Notification, Order, Product, Review, ShippingDetails, SiteContent, User } from "./types";

type OrderLineInput = CartLine & { unitPrice?: number };
const now = () => new Date().toISOString();
const seedProducts: Product[] = [
	{
		id: "p-lumine",
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
		createdAt: now(),
	},
	{
		id: "p-biome",
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
		createdAt: now(),
	},
	{
		id: "p-nocturne",
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
		createdAt: now(),
	},
	{
		id: "p-sculpture",
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
		createdAt: now(),
	},
];

const usePrisma = Boolean(process.env.DATABASE_URL);
const seedOrders: Order[] = [];
const seedUsers: AuthUser[] = [];

// Editorial page content for the in-memory preview path. Mirrors prisma/seed.mjs
// so About / Manufacturing / Quality / R&D render real, distinct copy even when
// no DATABASE_URL is set. In Prisma mode this array is unused (rows come from the
// seeded Content table); in both modes the /admin CMS remains the editor.
// Blog posts (in-memory)
const seedBlogPosts: BlogPost[] = [
	{
		id: "bp-1",
		slug: "afternoon-slump-not-a-personality-flaw",
		title: "Why your afternoon slump is not a personality flaw",
		excerpt: "The 3pm dip is physiology, not a lack of willpower. Here is what is actually happening.",
		body: "<p>Most people blame themselves for the mid-afternoon crash. In reality it is a predictable dip in your circadian rhythm, compounded by blood-sugar swings and the cognitive cost of a busy morning.</p><p>Understanding the mechanism is the first step to working with your body instead of against it. Small, well-timed rituals \u2014 hydration, a short walk, and purposefully-dosed support \u2014 move the needle far more than another coffee.</p><h3>The science behind the dip</h3><p>Your body runs on a roughly 24-hour cycle. Between 1pm and 3pm, your core temperature drops slightly, and alertness follows. This is not a sign of poor health \u2014 it is a feature of human biology.</p><p>Add a high-glycemic lunch to the mix, and you get a blood-sugar spike followed by a sharp drop. The result: that foggy, can\u2019t-focus feeling that arrives like clockwork.</p><h3>What actually helps</h3><ul><li><strong>Hydrate first</strong> \u2014 Dehydration alone accounts for significant cognitive fatigue.</li><li><strong>Move briefly</strong> \u2014 A 10-minute walk resets circulation and cortisol.</li><li><strong>Choose steady energy</strong> \u2014 Protein-rich snacks and considered supplementation outperform caffeine.</li><li><strong>Embrace the dip</strong> \u2014 Schedule creative work for your peak hours and administrative tasks for the valley.</li></ul><p>Care is a practice, and energy is one of its most rewarding returns.</p>",
		category: "Wellness notes",
		author: "Queens Care Research Team",
		readTime: "6 min read",
		image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=900&q=80",
		tags: "wellness,energy,rhythm,circadian",
		featured: true,
		published: true,
		createdAt: now(),
	},
	{
		id: "bp-2",
		slug: "what-clinically-studied-really-means",
		title: 'The truth about what "clinically studied" really means',
		excerpt: "Not all evidence is equal. A short, honest guide to reading supplement claims like a scientist.",
		body: "<p>\u201cClinically studied\u201d can mean anything from a rigorous randomised controlled trial to a single small study funded by the seller. The words that matter are sample size, control group, dose, and independence.</p><h2>What to look for</h2><p>When evaluating a supplement claim, ask these questions:</p><ol><li><strong>Sample size</strong> \u2014 Was the study conducted on 12 people or 1,200?</li><li><strong>Control group</strong> \u2014 Did it include a placebo comparison?</li><li><strong>Dose</strong> \u2014 Was the dose used in the study the same as what\u2019s in the product?</li><li><strong>Independence</strong> \u2014 Was the study funded by an unbiased third party?</li></ol><p>At Queens Care we start from a real need, formulate around a meaningful dose, and test independently for purity. This piece walks through the questions worth asking before any product earns a place on your shelf.</p>",
		category: "Expert series",
		author: "Dr. Priya Sharma",
		readTime: "4 min read",
		image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80",
		tags: "science,evidence,supplements,education",
		featured: false,
		published: true,
		createdAt: now(),
	},
	{
		id: "bp-3",
		slug: "building-an-evening-ritual",
		title: "Building an evening ritual that actually helps you sleep",
		excerpt: "Sleep is downstream of the ninety minutes before bed. A calm, repeatable wind-down beats any single product.",
		body: "<p>Good sleep rarely comes from one heroic intervention. It comes from a repeatable wind-down that signals safety to your nervous system: dimmer light, a consistent time, less input, and gentle mineral support.</p><h2>The ninety-minute rule</h2><p>The period between 90 minutes before sleep and lights-out is the most consequential window for sleep quality. What you do here determines how quickly you fall asleep and how deep that sleep will be.</p><h3>Build your ritual</h3><ul><li><strong>Dim the lights</strong> \u2014 Reduce overhead lighting 90 minutes before bed.</li><li><strong>Lower input</strong> \u2014 No screens, no news, no problem-solving.</li><li><strong>Magnesium</strong> \u2014 Gentle mineral support helps signal relaxation to the nervous system.</li><li><strong>Consistency</strong> \u2014 The same time, the same steps, every night.</li></ul><p>Over a few weeks, a considered evening ritual compounds into deeper, more restorative rest.</p>",
		category: "Wellness notes",
		author: "Queens Care Research Team",
		readTime: "5 min read",
		image: "https://images.unsplash.com/photo-1500673922987-e212871fec22?auto=format&fit=crop&w=900&q=80",
		tags: "sleep,ritual,evening,magnesium",
		featured: false,
		published: true,
		createdAt: now(),
	},
];

// In-memory seed for testimonials
const seedTestimonials = [
	{ id: "t-1", name: "Dr. Priya Sharma", title: "Dermatologist, Mumbai", body: "Queens Care formulates with the kind of rigour I expect from clinical medicine.", rating: 5, visible: true, sort: 0, createdAt: now() },
	{ id: "t-2", name: "Ananya R.", title: "Customer since 2024", body: "For the first time, my wellness routine feels less like a chore.", rating: 5, visible: true, sort: 1, createdAt: now() },
	{ id: "t-3", name: "Vikram Mehta", title: "Distributor, Delhi NCR", body: "Professional team, premium products. My pharmacy customers consistently reorder.", rating: 5, visible: true, sort: 2, createdAt: now() },
];

// In-memory seed for FAQ
const seedFAQ = [
	{ id: "faq-1", question: "How are Queens Care products different?", answer: "Every formulation begins with a real need and a clinically meaningful dose.", category: "Products", sort: 0, visible: true, createdAt: now() },
	{ id: "faq-2", question: "Are your products tested on animals?", answer: "No. Queens Care is committed to cruelty-free practices.", category: "Products", sort: 1, visible: true, createdAt: now() },
	{ id: "faq-3", question: "How long does delivery take?", answer: "Standard delivery across India typically takes 3-5 business days.", category: "Shipping", sort: 2, visible: true, createdAt: now() },
	{ id: "faq-4", question: "Can I return a product?", answer: "Yes. Please reach out to our care team within 14 days of delivery.", category: "Returns", sort: 3, visible: true, createdAt: now() },
];

// In-memory seed for banners
const seedBanners = [
	{ id: "bn-1", title: "Lumine-C Serum", subtitle: "Vitamin C radiance ritual", imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1400&q=85", linkUrl: "/products/lumine-c-serum", position: "hero", sort: 0, active: true, visible: true, createdAt: now() },
];

// In-memory seed for coupons
const seedCoupons = [
	{ id: "c-1", code: "WELCOME10", type: "percentage", discount: 10, minOrder: 500, maxDiscount: 500, usedCount: 0, perUserLimit: 1, isActive: true, usageLimit: 1000, expiryDate: null, startDate: null, createdAt: now() },
	{ id: "c-2", code: "QUEENS200", type: "flat", discount: 200, minOrder: 1500, maxDiscount: null, usedCount: 0, perUserLimit: 2, isActive: true, usageLimit: 500, expiryDate: null, startDate: null, createdAt: now() },
];

// In-memory seed for employees
const seedEmployees = [
	{ id: "emp-1", name: "Dr. Ananya Mehta", employeeId: "QCL-001", designation: "Chief Research Scientist", department: "R&D", photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", phone: "+91 98765 43210", email: "ananya.mehta@queenscare.in", bio: "Leading research initiatives at Queens Care Laboratories with over 12 years of experience.", slug: "dr-ananya-mehta", active: true, createdAt: now() },
	{ id: "emp-2", name: "Rajesh Kumar", employeeId: "QCL-002", designation: "Head of Quality Assurance", department: "Quality", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80", phone: "+91 98765 43211", email: "rajesh.kumar@queenscare.in", bio: "Ensuring every product meets the highest standards of quality and safety.", slug: "rajesh-kumar", active: true, createdAt: now() },
];

// In-memory seed for doctors
const seedDoctors: Array<Record<string, unknown>> = [];

// In-memory seed for B2B apps
const seedB2BApps: Array<Record<string, unknown>> = [];

// In-memory seed for settings
const seedSettings: Array<{ key: string; value: unknown; group: string }> = [
	{ key: "site_name", value: "Queens Care Laboratories", group: "general" },
	{ key: "site_tagline", value: "Science, made personal.", group: "general" },
	{ key: "primary_color", value: "#2d1b4e", group: "theme" },
	{ key: "accent_color", value: "#d4ad65", group: "theme" },
];

// In-memory seed for media
const seedMedia = [
	{ id: "m-1", filename: "lumine-c-serum.jpg", type: "image", url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85", alt: "Lumine-C Serum", size: 245000, createdAt: now() },
];

// In-memory seed for offers
const seedOffers = [
	{ id: "of-1", title: "Welcome Offer", description: "Get 10% off your first order", type: "banner", discount: 10, active: true, visible: true, createdAt: now() },
];

const seedContent: SiteContent[] = [
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
		updatedAt: now(),
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
		updatedAt: now(),
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
		updatedAt: now(),
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
		updatedAt: now(),
	},
	{
		key: "faq",
		value: [
			{ q: "How are Queens Care products different from other wellness brands?", a: "Every formulation begins with a real need and a clinically meaningful dose, not a marketing trend. We test independently for purity, explain plainly what each product does, and favour radical transparency over hype." },
			{ q: "Are your products tested on animals?", a: "No. Queens Care is committed to cruelty-free practices. Our products are tested through in-vitro and third-party laboratory methods, never on animals." },
			{ q: "How long does delivery take?", a: "Standard delivery across India typically takes 3–5 business days. Orders above \u20B91,500 qualify for complimentary delivery." },
			{ q: "Can I return a product if I am not satisfied?", a: "Yes. If a product does not meet your expectations, please reach out to our care team within 14 days of delivery and we will arrange a return or replacement." },
			{ q: "Are your ingredients sourced sustainably?", a: "We prioritise traceable, responsibly sourced ingredients. Each product page lists key actives and their sources where available." },
			{ q: "Do you offer wholesale or distributor partnerships?", a: "Yes. Visit our B2B portal at /b2b to apply for a distributor or clinic partnership. Our team reviews applications within 5 business days." },
		],
		updatedAt: now(),
	},
];
export const store = {
	products: {
		list: async (): Promise<Product[]> => {
			if (usePrisma) {
				return prisma.product.findMany({ where: { active: true } }) as unknown as Product[];
			}
			return structuredClone(seedProducts);
		},
		all: async (): Promise<Product[]> => {
			if (usePrisma) {
				const products = await prisma.product.findMany();
				return products as unknown as Product[];
			}
			return structuredClone(seedProducts);
		},
		bySlug: async (slug: string): Promise<Product | null> => {
			if (usePrisma) {
				const product = await prisma.product.findUnique({ where: { slug } });
				return product as unknown as Product | null;
			}
			return seedProducts.find((p) => p.slug === slug) ?? null;
		},
		save: async (input: Partial<Product> & { slug?: string }): Promise<Product> => {
			if (usePrisma) {
				const up = await prisma.product.upsert({ where: { slug: String(input.slug) }, update: input as unknown as Prisma.ProductUpdateInput, create: input as unknown as Prisma.ProductCreateInput });
				return up as unknown as Product;
			}
			const item = { id: input.id || randomUUID(), createdAt: input.createdAt || now(), ...input } as Product;
			const idx = seedProducts.findIndex((p) => p.id === item.id || p.slug === item.slug);
			if (idx >= 0) seedProducts[idx] = item; else seedProducts.push(item);
			return item;
		},
		decrementStock: async (slugOrId: string, quantity: number): Promise<boolean> => {
			if (usePrisma) {
				const updated = await prisma.product.updateMany({ where: { slug: slugOrId, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } });
				return updated.count === 1;
			}
			const p = seedProducts.find((x) => x.slug === slugOrId || x.id === slugOrId);
			if (!p || p.stock < quantity) return false;
			p.stock -= quantity;
			return true;
		},
	},
	users: {
		hasAny: async (): Promise<boolean> => {
			if (usePrisma) return (await prisma.user.count()) > 0;
			return seedUsers.length > 0;
		},
		findEmail: async (email: string): Promise<AuthUser | null> => {
			if (usePrisma) {
				const user = await prisma.user.findUnique({ where: { email } });
				return user as unknown as AuthUser | null;
			}
			return seedUsers.find(u => u.email === email) ?? null;
		},
		byId: async (id: string): Promise<AuthUser | null> => {
			if (usePrisma) {
				const user = await prisma.user.findUnique({ where: { id } });
				return user as unknown as AuthUser | null;
			}
			return seedUsers.find(u => u.id === id) ?? null;
		},
		create: async (input: Partial<User> & { passwordHash: string }): Promise<AuthUser> => {
			if (usePrisma) {
				const user = await prisma.user.create({ data: input as unknown as Prisma.UserCreateInput });
				return user as unknown as AuthUser;
			}
			const user = { ...(input as User), id: randomUUID(), createdAt: now() } as AuthUser;
			seedUsers.push(user);
			return user;
		},
	},
	orders: {
		list: async (user?: User) => {
			if (usePrisma) {
				if (!user || user.role === "admin") return prisma.order.findMany() as unknown as Order[];
				return prisma.order.findMany({ where: { userId: user.id } }) as unknown as Order[];
			}
			if (!user || user.role === "admin") return structuredClone(seedOrders);
			return structuredClone(seedOrders.filter((o) => o.userId === user.id));
		},
		byId: async (id: string) => {
			if (usePrisma) return prisma.order.findUnique({ where: { id } }) as unknown as Order | null;
			return seedOrders.find((o) => o.id === id) ? { ...seedOrders.find((o) => o.id === id)! } : null;
		},
		create: async (userId: string, lines: OrderLineInput[], total: number, shipping?: ShippingDetails) => {
			if (usePrisma) {
				const data: Record<string, unknown> = { userId, subtotal: total, discount: 0, shippingFee: 0, tax: 0, total, status: "pending", paymentStatus: "pending", trackingCode: `QC${Math.floor(100000 + Math.random() * 899999)}`, lines: { create: lines.map((l) => ({ product: { connect: { slug: l.productId } }, quantity: l.quantity, unitPrice: l.unitPrice ?? 0 })) } };
				if (shipping) data.shipping = shipping;
				const order = await prisma.order.create({ data: data as unknown as Prisma.OrderCreateInput, include: { lines: true } });
				return order as unknown as Order;
			}
			const item: Order = { id: `QC-${Date.now().toString(36).toUpperCase()}`, userId, lines, subtotal: total, discount: 0, couponCode: undefined, shippingFee: 0, tax: 0, total, status: "pending", trackingCode: `QC${Math.floor(100000 + Math.random() * 899999)}`, createdAt: now(), shipping };
			seedOrders.push(item);
			return { ...item };
		},
		update: async (id: string, patch: Partial<Order>) => {
			if (usePrisma) return prisma.order.update({ where: { id }, data: patch as unknown as Prisma.OrderUpdateInput }) as unknown as Order;
			const idx = seedOrders.findIndex((o) => o.id === id);
			if (idx < 0) return null;
			seedOrders[idx] = { ...seedOrders[idx], ...patch };
			return { ...seedOrders[idx] };
		},
		findRecentDuplicate: async (userId: string, linesKey: string, total: number): Promise<Order | null> => {
			const cutoffMs = Date.now() - 10 * 60 * 1000;
			if (usePrisma) {
				// In Prisma mode OrderLine.productId stores the Product id, so rebuild the
				// key from the connected product slug to match the caller's linesKey.
				const orders = await prisma.order.findMany({
					where: { userId, status: "pending", total, createdAt: { gte: new Date(cutoffMs) } },
					include: { lines: { include: { product: true } } },
				}) as unknown as Array<{ id: string; lines: Array<{ quantity: number; product: { slug: string } }> }>;
				const hit = orders.find((o) => o.lines.map((l) => `${l.product.slug}:${l.quantity}`).sort().join("|") === linesKey);
				return hit ? (hit as unknown as Order) : null;
			}
			const match = seedOrders.find((o) => o.userId === userId && o.status === "pending" && o.total === total && new Date(o.createdAt).getTime() >= cutoffMs && o.lines.map((l) => `${l.productId}:${l.quantity}`).sort().join("|") === linesKey);
			return match ? { ...match } : null;
		},
	},
	content: {
		list: async () => {
			if (usePrisma) return prisma.content.findMany() as unknown as SiteContent[];
			return structuredClone(seedContent);
		},
		get: async (key: string) => {
			if (usePrisma) return prisma.content.findUnique({ where: { key } }) as unknown as SiteContent | null;
			return seedContent.find((c) => c.key === key) ?? null;
		},
		save: async (key: string, value: unknown) => {
			if (usePrisma) return prisma.content.upsert({ where: { key }, update: { value } as Prisma.ContentUpdateInput, create: { key, value } as Prisma.ContentCreateInput }) as unknown as SiteContent;
			const idx = seedContent.findIndex((c) => c.key === key);
			const record: SiteContent = { key, value, updatedAt: now() };
			if (idx >= 0) seedContent[idx] = record; else seedContent.push(record);
			return record;
		},
	},
	posts: {
		list: async (draft = false) => {
			if (usePrisma) return prisma.blogPost.findMany({ where: draft ? {} : { published: true } }) as unknown as BlogPost[];
			return structuredClone(seedBlogPosts.filter(p => draft || p.published));
		},
		bySlug: async (slug: string): Promise<BlogPost | null> => {
			if (usePrisma) {
				const post = await prisma.blogPost.findUnique({ where: { slug } });
				return post as unknown as BlogPost | null;
			}
			return seedBlogPosts.find(p => p.slug === slug) ?? null;
		},
		save: async (input: Partial<BlogPost>) => {
			if (usePrisma) return prisma.blogPost.upsert({ where: { slug: String(input.slug) }, update: input as unknown as Prisma.BlogPostUpdateInput, create: input as unknown as Prisma.BlogPostCreateInput }) as unknown as BlogPost;
			const id = input.id || randomUUID();
			const slug = input.slug || String(input.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
			const existing = seedBlogPosts.findIndex(p => p.id === id || p.slug === slug);
			const record = { id, slug, title: input.title || "", excerpt: input.excerpt || "", body: input.body || "", content: input.content, category: input.category, tags: input.tags, author: input.author, readTime: input.readTime, image: input.image, images: input.images, videoUrl: input.videoUrl, videoTitle: input.videoTitle, featured: input.featured ?? false, seoTitle: input.seoTitle, seoDescription: input.seoDescription, ogImage: input.ogImage, published: input.published ?? false, visible: input.visible ?? true, createdAt: input.createdAt || now(), updatedAt: now() };
			if (existing >= 0) seedBlogPosts[existing] = record as BlogPost; else seedBlogPosts.push(record as BlogPost);
			return record as BlogPost;
		},
		delete: async (id: string) => {
			if (usePrisma) return prisma.blogPost.delete({ where: { id } });
			const idx = seedBlogPosts.findIndex(p => p.id === id);
			if (idx >= 0) seedBlogPosts.splice(idx, 1);
		},
	},
	contacts: {
		create: async (input: Partial<ContactMessage>) => {
			if (usePrisma) return prisma.contactMessage.create({ data: input as unknown as Prisma.ContactMessageCreateInput }) as unknown as ContactMessage;
			return input as ContactMessage;
		},
	},
	// lightweight placeholders for other areas
	applications: {
		all: async () => {
			if (usePrisma) return prisma.b2BApplication.findMany() as unknown as B2BApplication[];
			return structuredClone(seedB2BApps);
		},
		create: async (input: Partial<B2BApplication>) => {
			if (usePrisma) return prisma.b2BApplication.create({ data: input as unknown as Prisma.B2BApplicationCreateInput }) as unknown as B2BApplication;
			const id = randomUUID();
			const app = { id, ...input, createdAt: now() };
			seedB2BApps.push(app);
			return app as unknown as B2BApplication;
		},
	},
	reviews: {
		list: async (productId: string) => {
			if (usePrisma) return prisma.review.findMany({ where: { productId } }) as unknown as Review[];
			return [];
		},
		create: async (input: Partial<Review>) => {
			if (usePrisma) return prisma.review.create({ data: input as unknown as Prisma.ReviewCreateInput }) as unknown as Review;
			return input as Review;
		},
	},
	notifications: {
		list: async (userId: string) => {
			if (usePrisma) return prisma.notification.findMany({ where: { userId } }) as unknown as Notification[];
			return [];
		},
		create: async (input: Partial<Notification>) => {
			if (usePrisma) return prisma.notification.create({ data: input as unknown as Prisma.NotificationCreateInput }) as unknown as Notification;
			return input as Notification;
		},
	},
	wishlist: {
		get: async (userId: string) => {
			if (usePrisma) {
				const items = await prisma.wishlistItem.findMany({ where: { userId } }) as Array<{ productId: string }>;
				return items.map((x) => x.productId);
			}
			return [] as string[];
		},
		toggle: async (userId: string, productId: string) => {
			if (usePrisma) {
				const exists = await prisma.wishlistItem.findFirst({ where: { userId, productId } });
				if (exists) await prisma.wishlistItem.delete({ where: { id: exists.id } });
				else await prisma.wishlistItem.create({ data: { userId, productId } });
				const items = await prisma.wishlistItem.findMany({ where: { userId } }) as Array<{ productId: string }>;
				return items.map((x) => x.productId);
			}
			return [] as string[];
		},
	},
	categories: {
		list: async () => {
			if (usePrisma) return prisma.category.findMany({ orderBy: { sort: "asc" } });
			return [
				{ id: "cat-1", name: "Dermal care", slug: "dermal-care", description: "Skin health and radiance", sort: 0, active: true, visible: true, image: null, parentId: null, createdAt: now(), updatedAt: now() },
				{ id: "cat-2", name: "Digestive care", slug: "digestive-care", description: "Gut health and balance", sort: 1, active: true, visible: true, image: null, parentId: null, createdAt: now(), updatedAt: now() },
				{ id: "cat-3", name: "Sleep & recovery", slug: "sleep-recovery", description: "Rest and recovery support", sort: 2, active: true, visible: true, image: null, parentId: null, createdAt: now(), updatedAt: now() },
			];
		},
		bySlug: async (slug: string) => {
			if (usePrisma) return prisma.category.findUnique({ where: { slug } });
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const cats = await (store as any).categories.list();
			return cats.find((c: Record<string, unknown>) => c.slug === slug) ?? null;
		},
		save: async (input: Record<string, unknown>) => {
			if (usePrisma) {
				const slug = String(input.slug || input.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
				return prisma.category.upsert({ where: { slug }, update: input as never, create: { ...input, slug } as never });
			}
			return input;
		},
		delete: async (id: string) => {
			if (usePrisma) return prisma.category.delete({ where: { id } });
		},
	},
	// ─── TESTIMONIALS ───────────────────────────────────────────────────────
	testimonials: {
		list: async () => {
			if (usePrisma) return prisma.testimonial.findMany({ orderBy: { sort: "asc" } });
			return structuredClone(seedTestimonials);
		},
		create: async (data: Record<string, unknown>) => {
			if (usePrisma) return prisma.testimonial.create({ data: data as never });
			const t = { id: randomUUID(), name: "", title: "", body: "", rating: 5, visible: true, sort: 0, createdAt: now(), ...data };
			seedTestimonials.push(t as typeof seedTestimonials[0]);
			return t;
		},
		update: async (id: string, data: Record<string, unknown>) => {
			if (usePrisma) return prisma.testimonial.update({ where: { id }, data: data as never });
			const idx = seedTestimonials.findIndex(t => t.id === id);
			if (idx >= 0) { Object.assign(seedTestimonials[idx], data); return seedTestimonials[idx]; }
		},
		delete: async (id: string) => {
			if (usePrisma) return prisma.testimonial.delete({ where: { id } });
			const idx = seedTestimonials.findIndex(t => t.id === id);
			if (idx >= 0) seedTestimonials.splice(idx, 1);
		},
	},
	// ─── FAQ ────────────────────────────────────────────────────────────────
	faqs: {
		list: async () => {
			if (usePrisma) return prisma.fAQ.findMany({ orderBy: { sort: "asc" } });
			return structuredClone(seedFAQ);
		},
		create: async (data: Record<string, unknown>) => {
			if (usePrisma) return prisma.fAQ.create({ data: data as never });
			const f = { id: randomUUID(), question: "", answer: "", category: "", sort: 0, visible: true, createdAt: now(), ...data };
			seedFAQ.push(f as typeof seedFAQ[0]);
			return f;
		},
		update: async (id: string, data: Record<string, unknown>) => {
			if (usePrisma) return prisma.fAQ.update({ where: { id }, data: data as never });
			const idx = seedFAQ.findIndex(f => f.id === id);
			if (idx >= 0) { Object.assign(seedFAQ[idx], data); return seedFAQ[idx]; }
		},
		delete: async (id: string) => {
			if (usePrisma) return prisma.fAQ.delete({ where: { id } });
			const idx = seedFAQ.findIndex(f => f.id === id);
			if (idx >= 0) seedFAQ.splice(idx, 1);
		},
	},
	// ─── BANNERS ────────────────────────────────────────────────────────────
	banners: {
		list: async () => {
			if (usePrisma) return prisma.banner.findMany({ orderBy: { sort: "asc" } });
			return structuredClone(seedBanners);
		},
		create: async (data: Record<string, unknown>) => {
			if (usePrisma) return prisma.banner.create({ data: data as never });
			const b = { id: randomUUID(), title: "", subtitle: "", imageUrl: "", linkUrl: "", position: "hero", sort: 0, active: true, visible: true, createdAt: now(), ...data };
			seedBanners.push(b as typeof seedBanners[0]);
			return b;
		},
		update: async (id: string, data: Record<string, unknown>) => {
			if (usePrisma) return prisma.banner.update({ where: { id }, data: data as never });
			const idx = seedBanners.findIndex(b => b.id === id);
			if (idx >= 0) { Object.assign(seedBanners[idx], data); return seedBanners[idx]; }
		},
		delete: async (id: string) => {
			if (usePrisma) return prisma.banner.delete({ where: { id } });
			const idx = seedBanners.findIndex(b => b.id === id);
			if (idx >= 0) seedBanners.splice(idx, 1);
		},
	},
	// ─── COUPONS ────────────────────────────────────────────────────────────
	coupons: {
		list: async () => {
			if (usePrisma) return prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
			return structuredClone(seedCoupons);
		},
		create: async (data: Record<string, unknown>) => {
			if (usePrisma) return prisma.coupon.create({ data: { ...data, code: String(data.code).toUpperCase() } as never });
			const c = { id: randomUUID(), code: String(data.code || "").toUpperCase(), type: "percentage", discount: 0, minOrder: 0, maxDiscount: null, usedCount: 0, perUserLimit: 1, isActive: true, usageLimit: null, expiryDate: null, startDate: null, createdAt: now(), ...data };
			seedCoupons.push(c as unknown as typeof seedCoupons[0]);
			return c;
		},
		update: async (id: string, data: Record<string, unknown>) => {
			if (usePrisma) return prisma.coupon.update({ where: { id }, data: data as never });
			const idx = seedCoupons.findIndex(c => c.id === id);
			if (idx >= 0) { Object.assign(seedCoupons[idx], data); return seedCoupons[idx]; }
		},
		delete: async (id: string) => {
			if (usePrisma) return prisma.coupon.delete({ where: { id } });
			const idx = seedCoupons.findIndex(c => c.id === id);
			if (idx >= 0) seedCoupons.splice(idx, 1);
		},
	},
	// ─── EMPLOYEES ──────────────────────────────────────────────────────────
	employees: {
		list: async () => {
			if (usePrisma) return prisma.employee.findMany({ orderBy: { createdAt: "desc" } });
			return structuredClone(seedEmployees);
		},
		bySlug: async (slug: string) => {
			if (usePrisma) return prisma.employee.findUnique({ where: { slug } });
			return seedEmployees.find(e => e.slug === slug) ?? null;
		},
		create: async (data: Record<string, unknown>) => {
			if (usePrisma) return prisma.employee.create({ data: data as never });
			const e = { id: randomUUID(), name: "", employeeId: "", designation: "", department: "", photo: "", phone: "", email: "", bio: "", slug: "", active: true, createdAt: now(), ...data };
			seedEmployees.push(e as typeof seedEmployees[0]);
			return e;
		},
		update: async (id: string, data: Record<string, unknown>) => {
			if (usePrisma) return prisma.employee.update({ where: { id }, data: data as never });
			const idx = seedEmployees.findIndex(e => e.id === id);
			if (idx >= 0) { Object.assign(seedEmployees[idx], data); return seedEmployees[idx]; }
		},
		delete: async (id: string) => {
			if (usePrisma) return prisma.employee.delete({ where: { id } });
			const idx = seedEmployees.findIndex(e => e.id === id);
			if (idx >= 0) seedEmployees.splice(idx, 1);
		},
	},
	// ─── DOCTORS ────────────────────────────────────────────────────────────
	doctors: {
		list: async () => {
			if (usePrisma) return prisma.doctor.findMany({ orderBy: { createdAt: "desc" } });
			return structuredClone(seedDoctors);
		},
		create: async (data: Record<string, unknown>) => {
			if (usePrisma) return prisma.doctor.create({ data: data as never });
			const d = { id: randomUUID(), name: "", email: "", phone: "", clinic: "", specialty: "", qualification: "", regNumber: "", message: "", status: "pending", createdAt: now(), ...data };
			seedDoctors.push(d);
			return d;
		},
		update: async (id: string, data: Record<string, unknown>) => {
			if (usePrisma) return prisma.doctor.update({ where: { id }, data: data as never });
			const idx = seedDoctors.findIndex(d => d.id === id);
			if (idx >= 0) { Object.assign(seedDoctors[idx], data); return seedDoctors[idx]; }
		},
	},
	// ─── SETTINGS ───────────────────────────────────────────────────────────
	settings: {
		list: async () => {
			if (usePrisma) return prisma.setting.findMany({ orderBy: { group: "asc" } });
			return structuredClone(seedSettings);
		},
		save: async (key: string, value: unknown, group = "general") => {
			if (usePrisma) return prisma.setting.upsert({ where: { key }, update: { value: value as Prisma.InputJsonValue, group: group as string }, create: { key, value: value as Prisma.InputJsonValue, group: group as string } });
			const idx = seedSettings.findIndex(s => s.key === key);
			const entry = { key, value, group };
			if (idx >= 0) seedSettings[idx] = entry as typeof seedSettings[0]; else seedSettings.push(entry as typeof seedSettings[0]);
			return { key, value, group };
		},
	},
	// ─── MEDIA ──────────────────────────────────────────────────────────────
	media: {
		list: async () => {
			if (usePrisma) return prisma.media.findMany({ orderBy: { createdAt: "desc" } });
			return structuredClone(seedMedia);
		},
		create: async (data: Record<string, unknown>) => {
			if (usePrisma) return prisma.media.create({ data: data as never });
			const m = { id: randomUUID(), filename: "", type: "image", url: "", alt: "" as string | null, size: null, createdAt: now(), ...data };
			seedMedia.push(m as unknown as typeof seedMedia[0]);
			return m;
		},
		delete: async (id: string) => {
			if (usePrisma) return prisma.media.delete({ where: { id } });
			const idx = seedMedia.findIndex(m => m.id === id);
			if (idx >= 0) seedMedia.splice(idx, 1);
		},
	},
	// ─── OFFERS ─────────────────────────────────────────────────────────────
	offers: {
		list: async () => {
			if (usePrisma) return prisma.offer.findMany({ orderBy: { createdAt: "desc" } });
			return structuredClone(seedOffers);
		},
		create: async (data: Record<string, unknown>) => {
			if (usePrisma) return prisma.offer.create({ data: data as never });
			const o = { id: randomUUID(), title: "", description: "", type: "banner", discount: 0, active: true, visible: true, createdAt: now(), ...data };
			seedOffers.push(o as typeof seedOffers[0]);
			return o;
		},
		update: async (id: string, data: Record<string, unknown>) => {
			if (usePrisma) return prisma.offer.update({ where: { id }, data: data as never });
			const idx = seedOffers.findIndex(o => o.id === id);
			if (idx >= 0) { Object.assign(seedOffers[idx], data); return seedOffers[idx]; }
		},
		delete: async (id: string) => {
			if (usePrisma) return prisma.offer.delete({ where: { id } });
			const idx = seedOffers.findIndex(o => o.id === id);
			if (idx >= 0) seedOffers.splice(idx, 1);
		},
	},
	// ─── AFFILIATES ─────────────────────────────────────────────────────────
	affiliates: {
		list: async () => {
			if (usePrisma) return prisma.affiliate.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } });
			return [];
		},
	},
	// ─── PRODUCT EXTENDED CRUD ──────────────────────────────────────────────
	productMeta: {
		getFull: async (slug: string) => {
			if (usePrisma) return prisma.product.findUnique({ where: { slug }, include: { images: true, variants: true, specifications: true, model3d: true, productFaqs: true, reviews: true, relatedFrom: { include: { relatedProduct: true } } } });
			return null;
		},
		update: async (id: string, data: Record<string, unknown>) => {
			if (usePrisma) return prisma.product.update({ where: { id }, data: data as never });
			const idx = seedProducts.findIndex(p => p.id === id);
			if (idx >= 0) { Object.assign(seedProducts[idx], data); return seedProducts[idx]; }
			return null;
		},
		create: async (data: Record<string, unknown>) => {
			if (usePrisma) return prisma.product.create({ data: data as never });
			const p = { id: randomUUID(), slug: "", name: "", description: "", category: "", price: 0, stock: 0, image: "", active: true, createdAt: now(), ...data };
			seedProducts.push(p as Product);
			return p;
		},
		delete: async (id: string) => {
			if (usePrisma) return prisma.product.delete({ where: { id } });
			const idx = seedProducts.findIndex(p => p.id === id);
			if (idx >= 0) seedProducts.splice(idx, 1);
		},
	},
};