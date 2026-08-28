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
  list: async () => prisma.affiliate.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),

  byUserId: async (userId: string) => prisma.affiliate.findUnique({ where: { userId } }),

  byCode: async (code: string) => prisma.affiliate.findUnique({ where: { affiliateCode: code } }),

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
    list: async () => prisma.b2BApplication.findMany({ orderBy: { createdAt: "desc" } }),
    create: async (data: Record<string, unknown>) => prisma.b2BApplication.create({ data: data as never }),
    updateStatus: async (id: string, status: string, reviewedBy?: string, notes?: string) => {
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
    },
  },

  distributors: {
    list: async () => prisma.distributor.findMany({ include: { application: true }, orderBy: { createdAt: "desc" } }),
    byId: async (id: string) => prisma.distributor.findUnique({ where: { id }, include: { application: true } }),
    update: async (id: string, data: Record<string, unknown>) => prisma.distributor.update({ where: { id }, data: data as never }),
  },

  orders: {
    list: async (distributorId?: string) => prisma.b2BOrder.findMany({ where: distributorId ? { distributorId } : {}, include: { distributor: true }, orderBy: { createdAt: "desc" } }),
    create: async (distributorId: string, lines: { productId: string; quantity: number; unitPrice: number }[], total: number, notes?: string) =>
      prisma.b2BOrder.create({ data: { distributorId, total, notes, lines: { create: lines.map(l => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice })) } }, include: { lines: true } }),
    updateStatus: async (id: string, status: string) => prisma.b2BOrder.update({ where: { id }, data: { status: status as never } }),
  },
};

// ─── MEDIA ───────────────────────────────────────────────────────────────────

export const mediaStore = {
  list: async (type?: string) => prisma.media.findMany({ where: type ? { type: type as never } : {}, orderBy: { createdAt: "desc" } }),
  byId: async (id: string) => prisma.media.findUnique({ where: { id } }),
  create: async (data: Record<string, unknown>) => prisma.media.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.media.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.media.delete({ where: { id } }),
};

// ─── BANNERS ─────────────────────────────────────────────────────────────────

export const bannerStore = {
  list: async () => prisma.banner.findMany({ orderBy: { sort: "asc" } }),
  active: async (position?: string) => prisma.banner.findMany({ where: { active: true, visible: true, ...(position ? { position } : {}) }, orderBy: { sort: "asc" } }),
  create: async (data: Record<string, unknown>) => prisma.banner.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.banner.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.banner.delete({ where: { id } }),
};

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export const faqStore = {
  list: async () => prisma.fAQ.findMany({ orderBy: { sort: "asc" } }),
  visible: async () => prisma.fAQ.findMany({ where: { visible: true }, orderBy: { sort: "asc" } }),
  create: async (data: Record<string, unknown>) => prisma.fAQ.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.fAQ.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.fAQ.delete({ where: { id } }),
};

// ─── TESTIMONIALS ───────────────────────────────────────────────────────────

export const testimonialStore = {
  list: async () => prisma.testimonial.findMany({ orderBy: { sort: "asc" } }),
  visible: async () => prisma.testimonial.findMany({ where: { visible: true }, orderBy: { sort: "asc" } }),
  create: async (data: Record<string, unknown>) => prisma.testimonial.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.testimonial.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.testimonial.delete({ where: { id } }),
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export const settingStore = {
  get: async (key: string) => prisma.setting.findUnique({ where: { key } }),
  getGroup: async (group: string) => prisma.setting.findMany({ where: { group } }),
  set: async (key: string, value: unknown, group = "general") =>
    prisma.setting.upsert({ where: { key }, update: { value: value as never }, create: { key, value: value as never, group } }),
  getAll: async () => prisma.setting.findMany({ orderBy: { group: "asc" } }),
};

// ─── ORDERS (extended) ──────────────────────────────────────────────────────

export const orderStoreExtended = {
  updateStatus: async (id: string, status: string, note?: string) => {
    await prisma.order.update({ where: { id }, data: { status: status as never } });
    if (note) await prisma.orderStatusHistory.create({ data: { orderId: id, status: status as never, note } });
  },
  history: async (orderId: string) => prisma.orderStatusHistory.findMany({ where: { orderId }, orderBy: { createdAt: "desc" } }),
  byUser: async (userId: string) => prisma.order.findMany({ where: { userId }, include: { lines: true }, orderBy: { createdAt: "desc" } }),
  all: async () => prisma.order.findMany({ include: { lines: true, user: true }, orderBy: { createdAt: "desc" } }),
};

// ─── CUSTOMERS (admin) ──────────────────────────────────────────────────────

export const customerStore = {
  list: async () => prisma.user.findMany({ where: { role: "customer" }, orderBy: { createdAt: "desc" } }),
  byId: async (id: string) => prisma.user.findUnique({ where: { id }, include: { addresses: true, orders: true, wishlist: true } }),
  count: async () => prisma.user.count({ where: { role: "customer" } }),
  update: async (id: string, data: Record<string, unknown>) => prisma.user.update({ where: { id }, data: data as never }),
};

// ─── ADDRESSES ───────────────────────────────────────────────────────────────

export const addressStore = {
  list: async (userId: string) => prisma.address.findMany({ where: { userId }, orderBy: { isDefault: "desc" } }),
  create: async (userId: string, data: Record<string, unknown>) => prisma.address.create({ data: { userId, ...data } as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.address.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.address.delete({ where: { id } }),
};

// ─── 3D MODELS ──────────────────────────────────────────────────────────────

export const model3dStore = {
  byProduct: async (productId: string) => prisma.product3DModel.findUnique({ where: { productId } }),
  upsert: async (productId: string, data: Record<string, unknown>) =>
    prisma.product3DModel.upsert({ where: { productId }, update: data as never, create: { productId, ...data } as never }),
  delete: async (productId: string) => prisma.product3DModel.delete({ where: { productId } }).catch(() => {}),
};

// ─── HOMEPAGE SECTIONS ──────────────────────────────────────────────────────

export const homepageStore = {
  list: async () => prisma.homepageSection.findMany({ orderBy: { sort: "asc" } }),
  active: async () => prisma.homepageSection.findMany({ where: { active: true, visible: true }, orderBy: { sort: "asc" } }),
  create: async (data: Record<string, unknown>) => prisma.homepageSection.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.homepageSection.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.homepageSection.delete({ where: { id } }),
};

// ─── OFFERS / PROMOTIONS ────────────────────────────────────────────────────

export const offerStore = {
  list: async () => prisma.offer.findMany({ orderBy: { createdAt: "desc" } }),
  active: async () => prisma.offer.findMany({ where: { active: true, visible: true } }),
  create: async (data: Record<string, unknown>) => prisma.offer.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.offer.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.offer.delete({ where: { id } }),
};

export const promotionStore = {
  list: async () => prisma.promotion.findMany({ orderBy: { createdAt: "desc" } }),
  create: async (data: Record<string, unknown>) => prisma.promotion.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.promotion.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.promotion.delete({ where: { id } }),
};

// ─── PRODUCT VARIANTS ───────────────────────────────────────────────────────

export const variantStore = {
  listByProduct: async (productId: string) => prisma.productVariant.findMany({ where: { productId }, orderBy: { sort: "asc" } }),
  create: async (data: Record<string, unknown>) => prisma.productVariant.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.productVariant.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.productVariant.delete({ where: { id } }),
};

// ─── PRODUCT SPECIFICATIONS ─────────────────────────────────────────────────

export const specStore = {
  listByProduct: async (productId: string) => prisma.productSpecification.findMany({ where: { productId }, orderBy: { sort: "asc" } }),
  create: async (data: Record<string, unknown>) => prisma.productSpecification.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.productSpecification.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.productSpecification.delete({ where: { id } }),
};

// ─── PRODUCT VIDEOS ─────────────────────────────────────────────────────────

export const videoStore = {
  listByProduct: async (productId: string) => prisma.productVideo.findMany({ where: { productId }, orderBy: { sort: "asc" } }),
  create: async (data: Record<string, unknown>) => prisma.productVideo.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.productVideo.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.productVideo.delete({ where: { id } }),
};

// ─── A+ CONTENT ─────────────────────────────────────────────────────────────

export const aplusStore = {
  listByProduct: async (productId: string) => prisma.productAPlusSection.findMany({ where: { productId }, orderBy: { sort: "asc" } }),
  create: async (data: Record<string, unknown>) => prisma.productAPlusSection.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.productAPlusSection.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.productAPlusSection.delete({ where: { id } }),
};

// ─── PRODUCT Q&A ────────────────────────────────────────────────────────────

export const qaStore = {
  listByProduct: async (productId: string) => prisma.productQA.findMany({ where: { productId, visible: true }, orderBy: { createdAt: "desc" } }),
  allByProduct: async (productId: string) => prisma.productQA.findMany({ where: { productId }, orderBy: { createdAt: "desc" } }),
  create: async (data: Record<string, unknown>) => prisma.productQA.create({ data: data as never }),
  answer: async (id: string, answer: string, answeredBy: string) => prisma.productQA.update({ where: { id }, data: { answer, answeredBy } }),
  update: async (id: string, data: Record<string, unknown>) => prisma.productQA.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.productQA.delete({ where: { id } }),
};

// ─── PRODUCT IMAGES (extended) ──────────────────────────────────────────────

export const productImageStore = {
  listByProduct: async (productId: string) => prisma.productImage.findMany({ where: { productId }, orderBy: { sort: "asc" } }),
  create: async (data: Record<string, unknown>) => prisma.productImage.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.productImage.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.productImage.delete({ where: { id } }),
  reorder: async (items: { id: string; sort: number }[]) => {
    for (const item of items) await prisma.productImage.update({ where: { id: item.id }, data: { sort: item.sort } });
  },
};

// ─── PRODUCT RELATIONS ──────────────────────────────────────────────────────

export const relationStore = {
  listByProduct: async (productId: string) => prisma.productRelation.findMany({ where: { fromProductId: productId } }),
  set: async (productId: string, relatedIds: string[]) => {
    await prisma.productRelation.deleteMany({ where: { fromProductId: productId } });
    if (relatedIds.length) {
      await prisma.productRelation.createMany({ data: relatedIds.map(rid => ({ fromProductId: productId, relatedProductId: rid })) });
    }
  },
};

// ─── EMPLOYEE ───────────────────────────────────────────────────────────────

export const employeeStore = {
  list: async () => prisma.employee.findMany({ orderBy: { createdAt: "desc" } }),
  bySlug: async (slug: string) => prisma.employee.findUnique({ where: { slug } }),
  byId: async (id: string) => prisma.employee.findUnique({ where: { id } }),
  create: async (data: Record<string, unknown>) => prisma.employee.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.employee.update({ where: { id }, data: data as never }),
  delete: async (id: string) => prisma.employee.delete({ where: { id } }),
};

// ─── DOCTOR ─────────────────────────────────────────────────────────────────

export const doctorStore = {
  list: async () => prisma.doctor.findMany({ orderBy: { createdAt: "desc" } }),
  byId: async (id: string) => prisma.doctor.findUnique({ where: { id } }),
  create: async (data: Record<string, unknown>) => prisma.doctor.create({ data: data as never }),
  update: async (id: string, data: Record<string, unknown>) => prisma.doctor.update({ where: { id }, data: data as never }),
  updateStatus: async (id: string, status: string) => prisma.doctor.update({ where: { id }, data: { status } }),
};
