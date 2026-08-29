import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// All extensions use the Prisma client directly — these are server-only
// and are NOT called when DATABASE_URL is absent (usePrisma guard in store.ts).

// ─── COUPONS ─────────────────────────────────────────────────────────────────

export const couponStore = {
  list: async () => prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),

  byCode: async (code: string) => prisma.coupon.findUnique({ where: { code: code.toUpperCase() } }),

  create: async (data: Record<string, unknown>) =>
    prisma.coupon.create({ data: { ...data, code: String(data.code).toUpperCase() } as never }),

  update: async (id: string, data: Record<string, unknown>) =>
    prisma.coupon.update({ where: { id }, data: data as never }),

  delete: async (id: string) => prisma.coupon.delete({ where: { id } }),

  validate: async (code: string, subtotal: number, userId?: string) => {
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) return { valid: false, error: "Coupon not found." };
    if (!coupon.isActive) return { valid: false, error: "This coupon is no longer active." };
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) return { valid: false, error: "This coupon has expired." };
    if (coupon.startDate && new Date(coupon.startDate) > new Date()) return { valid: false, error: "This coupon is not yet active." };
    if (subtotal < coupon.minOrder) return { valid: false, error: `Minimum order of ₹${coupon.minOrder.toLocaleString("en-IN")} required.` };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { valid: false, error: "This coupon has reached its usage limit." };
    if (userId && coupon.perUserLimit) {
      const userUsage = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
      if (userUsage >= coupon.perUserLimit) return { valid: false, error: "You have already used this coupon." };
    }
    let discount = coupon.type === "percentage" ? Math.round(subtotal * coupon.discount / 100) : coupon.discount;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) discount = coupon.maxDiscount;
    return { valid: true, coupon, discount };
  },

  recordUsage: async (couponId: string, userId: string, orderId: string, discount: number) => {
    await prisma.couponUsage.create({ data: { couponId, userId, orderId, discount } });
    await prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
  },
};

// ─── AFFILIATES ──────────────────────────────────────────────────────────────

function generateAffiliateCode(): string {
  return `QC${randomBytes(4).toString("hex").toUpperCase()}`;
}

export const affiliateStore = {
  list: async () => { try { return await prisma.affiliate.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }); } catch { return []; } },

  byUserId: async (userId: string) => { try { return await prisma.affiliate.findUnique({ where: { userId } }); } catch { return null; } },

  byCode: async (code: string) => { try { return await prisma.affiliate.findUnique({ where: { affiliateCode: code } }); } catch { return null; } },

  create: async (userId: string) => {
    const code = generateAffiliateCode();
    return prisma.affiliate.create({ data: { userId, affiliateCode: code } });
  },

  updateStatus: async (id: string, status: string) =>
    prisma.affiliate.update({ where: { id }, data: { status: status as never } }),

  recordClick: async (linkId: string, affiliateId: string, ip?: string, userAgent?: string, referer?: string) => {
    await prisma.affiliateClick.create({ data: { linkId, affiliateId, ip, userAgent, referer } });
    await prisma.affiliateLink.update({ where: { id: linkId }, data: { clicks: { increment: 1 } } });
  },

  recordCommission: async (affiliateId: string, orderId: string, amount: number) => {
    await prisma.affiliateCommission.create({ data: { affiliateId, orderId, amount } });
    await prisma.affiliate.update({ where: { id: affiliateId }, data: { pendingCommission: { increment: amount }, totalCommission: { increment: amount } } });
  },

  getStats: async (affiliateId: string) => {
    const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
    if (!affiliate) return null;
    const links = await prisma.affiliateLink.findMany({ where: { affiliateId } });
    const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
    const totalConversions = links.reduce((s, l) => s + l.conversions, 0);
    return { ...affiliate, totalClicks, totalConversions, conversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(1) : "0" };
  },

  links: {
    list: async (affiliateId: string) => prisma.affiliateLink.findMany({ where: { affiliateId } }),
    create: async (affiliateId: string, productId?: string) => {
      const shortCode = randomBytes(3).toString("hex");
      const url = productId ? `/products/${productId}?ref=${shortCode}` : `/?ref=${shortCode}`;
      return prisma.affiliateLink.create({ data: { affiliateId, productId, url, shortCode } });
    },
  },

  withdrawals: {
    list: async (affiliateId: string) => prisma.affiliateWithdrawal.findMany({ where: { affiliateId }, orderBy: { createdAt: "desc" } }),
    request: async (affiliateId: string, amount: number, method?: string, accountDetails?: Record<string, unknown>) => {
      const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
      if (!affiliate || affiliate.wallet < amount) throw new Error("Insufficient wallet balance.");
      await prisma.affiliate.update({ where: { id: affiliateId }, data: { wallet: { decrement: amount } } });
      return prisma.affiliateWithdrawal.create({ data: { affiliateId, amount, method, accountDetails: accountDetails ?? undefined } as never });
    },
  },

  commissions: {
    list: async (affiliateId: string) => prisma.affiliateCommission.findMany({ where: { affiliateId }, orderBy: { createdAt: "desc" } }),
    approve: async (id: string) => {
      const commission = await prisma.affiliateCommission.findUnique({ where: { id } });
      if (!commission || commission.status !== "pending") return;
      await prisma.affiliateCommission.update({ where: { id }, data: { status: "approved" } });
      await prisma.affiliate.update({
        where: { id: commission.affiliateId },
        data: { pendingCommission: { decrement: commission.amount }, approvedCommission: { increment: commission.amount }, wallet: { increment: commission.amount } },
      });
    },
  },
};

// ─── B2B / DISTRIBUTOR ──────────────────────────────────────────────────────

export const b2bStore = {
  applications: {
    list: async () => { try { return await prisma.b2BApplication.findMany({ orderBy: { createdAt: "desc" } }); } catch { return []; } },
    create: async (data: Record<string, unknown>) => { try { return await prisma.b2BApplication.create({ data: data as never }); } catch { return data as never; } },
    updateStatus: async (id: string, status: string, reviewedBy?: string, notes?: string) => {
      try {
      const app = await prisma.b2BApplication.update({ where: { id }, data: { status: status as never, reviewedBy, reviewedAt: new Date(), notes } });
      if (status === "approved") {
        const existing = await prisma.distributor.findFirst({ where: { applicationId: id } });
        if (!existing) {
          await prisma.distributor.create({
            data: { applicationId: id, company: app.company, contactName: app.name, email: app.email, phone: app.phone || undefined, status: "approved" },
          });
        }
      }
      return app;
      } catch { return null; }
    },
  },

  distributors: {
    list: async () => { try { return await prisma.distributor.findMany({ include: { application: true }, orderBy: { createdAt: "desc" } }); } catch { return []; } },
    byId: async (id: string) => { try { return await prisma.distributor.findUnique({ where: { id }, include: { application: true } }); } catch { return null; } },
    update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.distributor.update({ where: { id }, data: data as never }); } catch { return null; } },
  },

  orders: {
    list: async (distributorId?: string) => { try { return await prisma.b2BOrder.findMany({ where: distributorId ? { distributorId } : {}, include: { distributor: true }, orderBy: { createdAt: "desc" } }); } catch { return []; } },
    create: async (distributorId: string, lines: { productId: string; quantity: number; unitPrice: number }[], total: number, notes?: string) => {
      try { return await prisma.b2BOrder.create({ data: { distributorId, total, notes, lines: { create: lines.map(l => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })) } }, include: { lines: true } }); } catch { return null; }
    },
    updateStatus: async (id: string, status: string) => { try { return await prisma.b2BOrder.update({ where: { id }, data: { status: status as never } }); } catch { return null; } },
  },
};

// ─── MEDIA ───────────────────────────────────────────────────────────────────

export const mediaStore = {
  list: async (type?: string) => { try { return await prisma.media.findMany({ where: type ? { type: type as never } : {}, orderBy: { createdAt: "desc" } }); } catch { return []; } },
  byId: async (id: string) => { try { return await prisma.media.findUnique({ where: { id } }); } catch { return null; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.media.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.media.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.media.delete({ where: { id } }); } catch {} },
};

// ─── BANNERS ─────────────────────────────────────────────────────────────────

export const bannerStore = {
  list: async () => { try { return await prisma.banner.findMany({ orderBy: { sort: "asc" } }); } catch { return []; } },
  active: async (position?: string) => { try { return await prisma.banner.findMany({ where: { active: true, visible: true, ...(position ? { position } : {}) }, orderBy: { sort: "asc" } }); } catch { return []; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.banner.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.banner.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.banner.delete({ where: { id } }); } catch {} },
};

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export const faqStore = {
  list: async () => { try { return await prisma.fAQ.findMany({ orderBy: { sort: "asc" } }); } catch { return []; } },
  visible: async () => { try { return await prisma.fAQ.findMany({ where: { visible: true }, orderBy: { sort: "asc" } }); } catch { return []; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.fAQ.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.fAQ.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.fAQ.delete({ where: { id } }); } catch {} },
};

// ─── TESTIMONIALS ───────────────────────────────────────────────────────────

export const testimonialStore = {
  list: async () => { try { return await prisma.testimonial.findMany({ orderBy: { sort: "asc" } }); } catch { return []; } },
  visible: async () => { try { return await prisma.testimonial.findMany({ where: { visible: true }, orderBy: { sort: "asc" } }); } catch { return []; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.testimonial.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.testimonial.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.testimonial.delete({ where: { id } }); } catch {} },
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export const settingStore = {
  get: async (key: string) => { try { return await prisma.setting.findUnique({ where: { key } }); } catch { return null; } },
  getGroup: async (group: string) => { try { return await prisma.setting.findMany({ where: { group } }); } catch { return []; } },
  set: async (key: string, value: unknown, group = "general") => {
    try { return await prisma.setting.upsert({ where: { key }, update: { value: value as never }, create: { key, value: value as never, group } }); } catch { return null; }
  },
  getAll: async () => { try { return await prisma.setting.findMany({ orderBy: { group: "asc" } }); } catch { return []; } },
};

// ─── ORDERS (extended) ──────────────────────────────────────────────────────

export const orderStoreExtended = {
  updateStatus: async (id: string, status: string, note?: string) => {
    try {
      await prisma.order.update({ where: { id }, data: { status: status as never } });
      if (note) await prisma.orderStatusHistory.create({ data: { orderId: id, status: status as never, note } });
    } catch {}
  },
  history: async (orderId: string) => { try { return await prisma.orderStatusHistory.findMany({ where: { orderId }, orderBy: { createdAt: "desc" } }); } catch { return []; } },
  byUser: async (userId: string) => { try { return await prisma.order.findMany({ where: { userId }, include: { lines: true }, orderBy: { createdAt: "desc" } }); } catch { return []; } },
  all: async () => { try { return await prisma.order.findMany({ include: { lines: true, user: true }, orderBy: { createdAt: "desc" } }); } catch { return []; } },
};

// ─── CUSTOMERS (admin) ──────────────────────────────────────────────────────

export const customerStore = {
  list: async () => { try { return await prisma.user.findMany({ where: { role: "customer" }, orderBy: { createdAt: "desc" } }); } catch { return []; } },
  byId: async (id: string) => { try { return await prisma.user.findUnique({ where: { id }, include: { addresses: true, orders: true, wishlist: true } }); } catch { return null; } },
  count: async () => { try { return await prisma.user.count({ where: { role: "customer" } }); } catch { return 0; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.user.update({ where: { id }, data: data as never }); } catch { return null; } },
};

// ─── ADDRESSES ───────────────────────────────────────────────────────────────

export const addressStore = {
  list: async (userId: string) => { try { return await prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } }); } catch { return []; } },
  create: async (userId: string, data: Record<string, unknown>) => { try { return await prisma.address.create({ data: { userId, ...data } as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.address.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.address.delete({ where: { id } }); } catch {} },
};

// ─── 3D MODELS ──────────────────────────────────────────────────────────────

export const model3dStore = {
  byProduct: async (productId: string) => { try { return await prisma.product3DModel.findUnique({ where: { productId } }); } catch { return null; } },
  upsert: async (productId: string, data: Record<string, unknown>) => {
    try { return await prisma.product3DModel.upsert({ where: { productId }, update: data as never, create: { productId, ...data } as never }); } catch { return null; }
  },
  delete: async (productId: string) => { try { await prisma.product3DModel.delete({ where: { productId } }); } catch {} },
};

// ─── HOMEPAGE SECTIONS ──────────────────────────────────────────────────────

const seedHomepageSections: Record<string, unknown>[] = [
  {
    id: "hs-hero", title: "Hero", type: "hero", sort: 0, active: true, visible: true,
    content: {
      eyebrow: "A higher standard of everyday care",
      heading: "Science, made personal.",
      subtitle: "Intelligent formulations that turn your daily health rituals into small, powerful acts of self-respect.",
      ctaText: "Explore the collection", ctaLink: "/#collection",
      secondaryText: "How we formulate", secondaryLink: "/#science",
      rating: "4.9 / 5", ratingCount: "12,000+ care rituals",
    },
  },
  {
    id: "hs-trust", title: "Trust Strip", type: "trust", sort: 1, active: true, visible: true,
    content: {
      badges: ["Made in India", "Third-party tested", "Traceable ingredients", "Designed with doctors"],
    },
  },
  {
    id: "hs-collection", title: "Product Collection", type: "collection", sort: 2, active: true, visible: true,
    content: {
      eyebrow: "The care edit",
      heading: "Considered essentials for your whole self.",
      ctaText: "Shop all care",
    },
  },
  {
    id: "hs-science", title: "Our Science", type: "science", sort: 3, active: true, visible: true,
    content: {
      imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1200&q=85",
      stat: "97%", statText: "of customers feel a difference within 30 days*",
      eyebrow: "The Queens Care standard",
      heading: "Precision you can feel. Proof you can see.",
      description: "We bring pharmaceutical rigor to the products that live on your shelf. Each formula begins with a real need, is built around meaningful dosage, and is independently tested for purity.",
      principles: [
        { number: "01", title: "Purposeful dosage", text: "Not marketing-magic ingredients." },
        { number: "02", title: "Radical clarity", text: "Every ingredient has a reason to be here." },
        { number: "03", title: "Better by design", text: "Elegant rituals, lower-impact choices." },
      ],
      ctaText: "Meet our standard", ctaLink: "/about",
    },
  },
  {
    id: "hs-ritual", title: "Build Your Ritual", type: "ritual", sort: 4, active: true, visible: true,
    content: {
      eyebrow: "Build your ritual",
      heading: "Care that meets you where you are.",
      sideText: "Not sure where to begin? Let our guided care finder create a considered starting point in under two minutes.",
      cards: [
        { label: "01", heading: "I want to feel more energised.", link: "/#collection", color: "amber" },
        { label: "02", heading: "I want a calmer evening.", link: "/#collection", color: "lavender" },
        { label: "03", heading: "I want to glow from within.", link: "/#collection", color: "rose" },
      ],
    },
  },
  {
    id: "hs-quote", title: "Testimonial Quote", type: "testimonial", sort: 5, active: true, visible: true,
    content: {
      quote: "For the first time, my wellness routine feels less like a chore — and more like a quiet promise to myself.",
      author: "Meera Shah",
      attribution: "Queens Care member since 2023",
    },
  },
  {
    id: "hs-newsletter", title: "Newsletter CTA", type: "newsletter", sort: 6, active: true, visible: true,
    content: {
      eyebrow: "The care letter",
      heading: "A smarter kind of inbox.",
      subtitle: "Thoughtful dispatches on science, care, and living well.",
    },
  },
  {
    id: "hs-consult", title: "Talk to Our Team", type: "consult", sort: 7, active: true, visible: true,
    content: {
      eyebrow: "Care, with a human on the other end",
      heading: "Questions deserve thoughtful answers.",
      description: "Our care team is here to help you make confident choices — no pressure, no jargon.",
      ctaText: "Talk to our care team", ctaLink: "/contact",
      imageUrl: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1000&q=85",
    },
  },
  {
    id: "hs-announcement", title: "Announcement Bar", type: "banner", sort: 8, active: true, visible: true,
    content: {
      text: "Complimentary delivery on orders above ₹1,500",
      secondaryText: "For healthcare professionals",
      secondaryLink: "/doctors",
    },
  },
];

const _homepageSections = [...seedHomepageSections];
let _hpIdCounter = 100;

export const homepageStore = {
  list: async () => {
    try { const rows = await prisma.homepageSection.findMany({ orderBy: { sort: "asc" } }); if (rows.length > 0) return rows; } catch {}
    return _homepageSections;
  },
  active: async () => {
    try { const rows = await prisma.homepageSection.findMany({ where: { active: true, visible: true }, orderBy: { sort: "asc" } }); if (rows.length > 0) return rows; } catch {}
    return _homepageSections.filter((s) => s.active && s.visible);
  },
  create: async (data: Record<string, unknown>) => {
    try { return await prisma.homepageSection.create({ data: data as never }); } catch {}
    const record = { id: `hp-${++_hpIdCounter}`, title: String(data.title || ""), type: String(data.type || "custom"), content: data.content || {}, sort: Number(data.sort || 0), active: data.active !== false, visible: data.visible !== false, createdAt: new Date(), updatedAt: new Date() };
    _homepageSections.push(record);
    return record;
  },
  update: async (id: string, data: Record<string, unknown>) => {
    try { return await prisma.homepageSection.update({ where: { id }, data: data as never }); } catch {}
    const idx = _homepageSections.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    _homepageSections[idx] = { ..._homepageSections[idx], ...data, updatedAt: new Date() };
    return _homepageSections[idx];
  },
  delete: async (id: string) => {
    try { await prisma.homepageSection.delete({ where: { id } }); return; } catch {}
    const idx = _homepageSections.findIndex((s) => s.id === id);
    if (idx !== -1) _homepageSections.splice(idx, 1);
  },
};

// ─── OFFERS / PROMOTIONS ────────────────────────────────────────────────────

export const offerStore = {
  list: async () => { try { return await prisma.offer.findMany({ orderBy: { createdAt: "desc" } }); } catch { return []; } },
  active: async () => { try { return await prisma.offer.findMany({ where: { active: true, visible: true } }); } catch { return []; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.offer.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.offer.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.offer.delete({ where: { id } }); } catch {} },
};

export const promotionStore = {
  list: async () => { try { return await prisma.promotion.findMany({ orderBy: { createdAt: "desc" } }); } catch { return []; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.promotion.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.promotion.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.promotion.delete({ where: { id } }); } catch {} },
};

// ─── PRODUCT VARIANTS ───────────────────────────────────────────────────────

export const variantStore = {
  listByProduct: async (productId: string) => { try { return await prisma.productVariant.findMany({ where: { productId }, orderBy: { sort: "asc" } }); } catch { return []; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.productVariant.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.productVariant.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.productVariant.delete({ where: { id } }); } catch {} },
};

// ─── PRODUCT SPECIFICATIONS ─────────────────────────────────────────────────

export const specStore = {
  listByProduct: async (productId: string) => { try { return await prisma.productSpecification.findMany({ where: { productId }, orderBy: { sort: "asc" } }); } catch { return []; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.productSpecification.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.productSpecification.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.productSpecification.delete({ where: { id } }); } catch {} },
};

// ─── PRODUCT VIDEOS ─────────────────────────────────────────────────────────

export const videoStore = {
  listByProduct: async (productId: string) => { try { return await prisma.productVideo.findMany({ where: { productId }, orderBy: { sort: "asc" } }); } catch { return []; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.productVideo.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.productVideo.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.productVideo.delete({ where: { id } }); } catch {} },
};

// ─── A+ CONTENT ─────────────────────────────────────────────────────────────

export const aplusStore = {
  listByProduct: async (productId: string) => { try { return await prisma.productAPlusSection.findMany({ where: { productId }, orderBy: { sort: "asc" } }); } catch { return []; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.productAPlusSection.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.productAPlusSection.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.productAPlusSection.delete({ where: { id } }); } catch {} },
};

// ─── PRODUCT Q&A ────────────────────────────────────────────────────────────

export const qaStore = {
  listByProduct: async (productId: string) => { try { return await prisma.productQA.findMany({ where: { productId, visible: true }, orderBy: { createdAt: "desc" } }); } catch { return []; } },
  allByProduct: async (productId: string) => { try { return await prisma.productQA.findMany({ where: { productId }, orderBy: { createdAt: "desc" } }); } catch { return []; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.productQA.create({ data: data as never }); } catch { return data as never; } },
  answer: async (id: string, answer: string, answeredBy: string) => { try { return await prisma.productQA.update({ where: { id }, data: { answer, answeredBy } }); } catch { return null; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.productQA.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.productQA.delete({ where: { id } }); } catch {} },
};

// ─── PRODUCT IMAGES (extended) ──────────────────────────────────────────────

export const productImageStore = {
  listByProduct: async (productId: string) => { try { return await prisma.productImage.findMany({ where: { productId }, orderBy: { sort: "asc" } }); } catch { return []; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.productImage.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.productImage.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.productImage.delete({ where: { id } }); } catch {} },
  reorder: async (items: { id: string; sort: number }[]) => {
    try { for (const item of items) await prisma.productImage.update({ where: { id: item.id }, data: { sort: item.sort } }); } catch {}
  },
};

// ─── PRODUCT RELATIONS ──────────────────────────────────────────────────────

export const relationStore = {
  listByProduct: async (productId: string) => { try { return await prisma.productRelation.findMany({ where: { fromProductId: productId } }); } catch { return []; } },
  set: async (productId: string, relatedIds: string[]) => {
    try {
      await prisma.productRelation.deleteMany({ where: { fromProductId: productId } });
      if (relatedIds.length) {
        await prisma.productRelation.createMany({ data: relatedIds.map(rid => ({ fromProductId: productId, relatedProductId: rid })) });
      }
    } catch {}
  },
};

// ─── EMPLOYEE ───────────────────────────────────────────────────────────────

export const employeeStore = {
  list: async () => { try { return await prisma.employee.findMany({ orderBy: { createdAt: "desc" } }); } catch { return []; } },
  bySlug: async (slug: string) => { try { return await prisma.employee.findUnique({ where: { slug } }); } catch { return null; } },
  byId: async (id: string) => { try { return await prisma.employee.findUnique({ where: { id } }); } catch { return null; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.employee.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.employee.update({ where: { id }, data: data as never }); } catch { return null; } },
  delete: async (id: string) => { try { await prisma.employee.delete({ where: { id } }); } catch {} },
};

// ─── DOCTOR ─────────────────────────────────────────────────────────────────

export const doctorStore = {
  list: async () => { try { return await prisma.doctor.findMany({ orderBy: { createdAt: "desc" } }); } catch { return []; } },
  byId: async (id: string) => { try { return await prisma.doctor.findUnique({ where: { id } }); } catch { return null; } },
  create: async (data: Record<string, unknown>) => { try { return await prisma.doctor.create({ data: data as never }); } catch { return data as never; } },
  update: async (id: string, data: Record<string, unknown>) => { try { return await prisma.doctor.update({ where: { id }, data: data as never }); } catch { return null; } },
  updateStatus: async (id: string, status: string) => { try { return await prisma.doctor.update({ where: { id }, data: { status } }); } catch { return null; } },
};
