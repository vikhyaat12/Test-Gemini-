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
			return [] as BlogPost[];
		},
		bySlug: async (slug: string): Promise<BlogPost | null> => {
			if (usePrisma) {
				const post = await prisma.blogPost.findUnique({ where: { slug } });
				return post as unknown as BlogPost | null;
			}
			return null;
		},
		save: async (input: Partial<BlogPost>) => {
			if (usePrisma) return prisma.blogPost.upsert({ where: { slug: String(input.slug) }, update: input as unknown as Prisma.BlogPostUpdateInput, create: input as unknown as Prisma.BlogPostCreateInput }) as unknown as BlogPost;
			return input as BlogPost;
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
		all: async () => (usePrisma ? prisma.b2BApplication.findMany() as unknown as B2BApplication[] : []),
		create: async (input: Partial<B2BApplication>) => (usePrisma ? prisma.b2BApplication.create({ data: input as unknown as Prisma.B2BApplicationCreateInput }) as unknown as B2BApplication : input as B2BApplication),
	},
	reviews: {
		list: async (productId: string) => (usePrisma ? prisma.review.findMany({ where: { productId } }) as unknown as Review[] : []),
		create: async (input: Partial<Review>) => (usePrisma ? prisma.review.create({ data: input as unknown as Prisma.ReviewCreateInput }) as unknown as Review : input as Review),
	},
	notifications: {
		list: async (userId: string) => (usePrisma ? prisma.notification.findMany({ where: { userId } }) as unknown as Notification[] : []),
		create: async (input: Partial<Notification>) => (usePrisma ? prisma.notification.create({ data: input as unknown as Prisma.NotificationCreateInput }) as unknown as Notification : input as Notification),
	},  wishlist: {
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
      return [];
    },
    bySlug: async (slug: string) => {
      if (usePrisma) return prisma.category.findUnique({ where: { slug } });
      return null;
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
  // ─── PRODUCT EXTENDED CRUD ──────────────────────────────────────────────
  productMeta: {
    getFull: async (slug: string) => {
      if (usePrisma) return prisma.product.findUnique({ where: { slug }, include: { images: true, variants: true, specifications: true, model3d: true, productFaqs: true, reviews: true, relatedFrom: { include: { relatedProduct: true } } } });
      return null;
    },
    update: async (id: string, data: Record<string, unknown>) => {
      if (usePrisma) return prisma.product.update({ where: { id }, data: data as never });
      return null;
    },
    create: async (data: Record<string, unknown>) => {
      if (usePrisma) return prisma.product.create({ data: data as never });
      return null;
    },
    delete: async (id: string) => {
      if (usePrisma) return prisma.product.delete({ where: { id } });
    },
  },
};