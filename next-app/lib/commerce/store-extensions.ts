import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

// All extensions use the Prisma client directly — these are server-only
// and are NOT called when DATABASE_URL is absent (usePrisma guard in store.ts).

// ─── COUPONS ─────────────────────────────────────────────────────────────────

const _seedCoupons: Record<string, unknown>[] = [
  {
    id: "cpn-welcome10",
    code: "WELCOME10",
    type: "percentage",
    discount: 10,
    minOrder: 500,
    maxDiscount: 500,
    usageLimit: 1000,
    perUserLimit: 1,
    usedCount: 14,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: "cpn-flat200",
    code: "FLAT200",
    type: "flat",
    discount: 200,
    minOrder: 1500,
    maxDiscount: 200,
    usageLimit: 500,
    perUserLimit: 1,
    usedCount: 8,
    isActive: true,
    createdAt: new Date(),
  },
];

export const couponStore = {
  list: async () => {
    try { return await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }); }
    catch { return structuredClone(_seedCoupons); }
  },

  byCode: async (code: string) => {
    try { return await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } }); }
    catch { return _seedCoupons.find(c => String(c.code).toUpperCase() === code.toUpperCase()) || null; }
  },

  create: async (data: Record<string, unknown>) => {
    const code = String(data.code).toUpperCase();
    try {
      return await prisma.coupon.create({ data: { ...data, code } as never });
    } catch {
      const c = { id: `cpn-${Date.now()}`, ...data, code, usedCount: 0, isActive: data.isActive !== false, createdAt: new Date() };
      _seedCoupons.unshift(c);
      return c;
    }
  },

  update: async (id: string, data: Record<string, unknown>) => {
    try {
      return await prisma.coupon.update({ where: { id }, data: data as never });
    } catch {
      const idx = _seedCoupons.findIndex(c => c.id === id);
      if (idx === -1) return null;
      _seedCoupons[idx] = { ..._seedCoupons[idx], ...data, ...(data.code ? { code: String(data.code).toUpperCase() } : {}) };
      return _seedCoupons[idx];
    }
  },

  delete: async (id: string) => {
    try { return await prisma.coupon.delete({ where: { id } }); }
    catch {
      const idx = _seedCoupons.findIndex(c => c.id === id);
      if (idx >= 0) _seedCoupons.splice(idx, 1);
    }
  },

  validate: async (code: string, subtotal: number, userId?: string) => {
    let coupon: Record<string, unknown> | null = null;
    try {
      coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } }) as Record<string, unknown> | null;
    } catch {
      coupon = _seedCoupons.find(c => String(c.code).toUpperCase() === code.toUpperCase()) || null;
    }
    if (!coupon) return { valid: false, error: "Coupon not found." };
    if (!coupon.isActive) return { valid: false, error: "This coupon is no longer active." };
    if (coupon.expiryDate && new Date(String(coupon.expiryDate)) < new Date()) return { valid: false, error: "This coupon has expired." };
    if (coupon.startDate && new Date(String(coupon.startDate)) > new Date()) return { valid: false, error: "This coupon is not yet active." };
    const minOrder = Number(coupon.minOrder || 0);
    if (subtotal < minOrder) return { valid: false, error: `Minimum order of ₹${minOrder.toLocaleString("en-IN")} required.` };
    const usageLimit = Number(coupon.usageLimit || 0);
    const usedCount = Number(coupon.usedCount || 0);
    if (usageLimit && usedCount >= usageLimit) return { valid: false, error: "This coupon has reached its usage limit." };
    if (userId && coupon.perUserLimit) {
      try {
        const userUsage = await prisma.couponUsage.count({ where: { couponId: String(coupon.id), userId } });
        if (userUsage >= Number(coupon.perUserLimit)) return { valid: false, error: "You have already used this coupon." };
      } catch {}
    }
    const discVal = Number(coupon.discount || 0);
    let discount = coupon.type === "percentage" ? Math.round(subtotal * discVal / 100) : discVal;
    const maxDiscount = Number(coupon.maxDiscount || 0);
    if (maxDiscount && discount > maxDiscount) discount = maxDiscount;
    return { valid: true, coupon, discount };
  },

  recordUsage: async (couponId: string, userId: string, orderId: string, discount: number) => {
    try {
      await prisma.couponUsage.create({ data: { couponId, userId, orderId, discount } });
      await prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
    } catch {
      const c = _seedCoupons.find(x => x.id === couponId);
      if (c) c.usedCount = Number(c.usedCount || 0) + 1;
    }
  },
};

// ─── AFFILIATES ──────────────────────────────────────────────────────────────

function generateAffiliateCode(): string {
  return `QC${randomBytes(4).toString("hex").toUpperCase()}`;
}

const _seedAffiliates: Record<string, unknown>[] = [];
const _seedLinks: Record<string, unknown>[] = [];
const _seedClicks: Record<string, unknown>[] = [];
const _seedCommissions: Record<string, unknown>[] = [];
const _seedWithdrawals: Record<string, unknown>[] = [];

export const affiliateStore = {
  list: async () => {
    try {
      return await prisma.affiliate.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } });
    } catch {
      return structuredClone(_seedAffiliates);
    }
  },

  byId: async (id: string) => {
    try {
      return await prisma.affiliate.findUnique({ where: { id }, include: { user: true } });
    } catch {
      return (_seedAffiliates.find(a => a.id === id) as unknown as Record<string, unknown>) ?? null;
    }
  },

  byUserId: async (userId: string) => {
    try {
      return await prisma.affiliate.findUnique({ where: { userId }, include: { user: true } });
    } catch {
      return (_seedAffiliates.find(a => a.userId === userId) as unknown as Record<string, unknown>) ?? null;
    }
  },

  byCode: async (code: string) => {
    const norm = code.toUpperCase();
    try {
      return await prisma.affiliate.findUnique({ where: { affiliateCode: norm }, include: { user: true } });
    } catch {
      return (_seedAffiliates.find(a => String(a.affiliateCode).toUpperCase() === norm) as unknown as Record<string, unknown>) ?? null;
    }
  },

  byRef: async (ref: string) => {
    const code = ref.trim();
    if (!code) return null;
    try {
      // Check affiliate code directly
      const byCode = await prisma.affiliate.findUnique({ where: { affiliateCode: code.toUpperCase() }, include: { user: true } });
      if (byCode) return { affiliate: byCode, link: null };
      // Check affiliate link shortCode
      const link = await prisma.affiliateLink.findUnique({ where: { shortCode: code }, include: { affiliate: { include: { user: true } } } });
      if (link && link.affiliate) return { affiliate: link.affiliate, link };
      return null;
    } catch {
      const byCode = _seedAffiliates.find(a => String(a.affiliateCode).toUpperCase() === code.toUpperCase());
      if (byCode) return { affiliate: byCode, link: null };
      const link = _seedLinks.find(l => l.shortCode === code);
      if (link) {
        const affiliate = _seedAffiliates.find(a => a.id === link.affiliateId);
        return { affiliate: affiliate ?? null, link };
      }
      return null;
    }
  },

  create: async (userId: string, data?: Partial<{ commissionRate: number; customCoupon: string }>) => {
    const code = generateAffiliateCode();
    try {
      return await prisma.affiliate.create({
        data: {
          userId,
          affiliateCode: code,
          status: "active",
          commissionRate: data?.commissionRate ?? 10,
          customCoupon: data?.customCoupon,
        },
        include: { user: true },
      });
    } catch {
      const rec = {
        id: `aff-${Date.now()}`,
        userId,
        affiliateCode: code,
        status: "active",
        commissionRate: data?.commissionRate ?? 10,
        level: 1,
        totalSales: 0,
        totalCommission: 0,
        pendingCommission: 0,
        approvedCommission: 0,
        withdrawnCommission: 0,
        wallet: 0,
        customCoupon: data?.customCoupon ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      _seedAffiliates.push(rec);
      return rec;
    }
  },

  updateStatus: async (id: string, status: string) => {
    try {
      return await prisma.affiliate.update({ where: { id }, data: { status: status as never } });
    } catch {
      const a = _seedAffiliates.find(x => x.id === id);
      if (a) a.status = status;
      return a;
    }
  },

  update: async (id: string, data: Record<string, unknown>) => {
    try {
      return await prisma.affiliate.update({ where: { id }, data: data as never });
    } catch {
      const a = _seedAffiliates.find(x => x.id === id);
      if (a) Object.assign(a, data);
      return a;
    }
  },

  recordClick: async (linkId: string | null, affiliateId: string, ip?: string, userAgent?: string, referer?: string) => {
    try {
      if (linkId) {
        await prisma.affiliateClick.create({ data: { linkId, affiliateId, ip, userAgent, referer } });
        await prisma.affiliateLink.update({ where: { id: linkId }, data: { clicks: { increment: 1 } } });
      } else {
        // Direct affiliate code click
        const defaultLink = await prisma.affiliateLink.findFirst({ where: { affiliateId } });
        if (defaultLink) {
          await prisma.affiliateClick.create({ data: { linkId: defaultLink.id, affiliateId, ip, userAgent, referer } });
          await prisma.affiliateLink.update({ where: { id: defaultLink.id }, data: { clicks: { increment: 1 } } });
        }
      }
    } catch {
      const click = { id: `clk-${Date.now()}`, linkId, affiliateId, ip, userAgent, referer, createdAt: new Date() };
      _seedClicks.push(click);
      if (linkId) {
        const l = _seedLinks.find(x => x.id === linkId);
        if (l) l.clicks = Number(l.clicks || 0) + 1;
      }
    }
  },

  recordCommission: async (affiliateId: string, orderId: string, amount: number, linkId?: string) => {
    try {
      await prisma.affiliateCommission.create({ data: { affiliateId, orderId, amount } });
      await prisma.affiliate.update({
        where: { id: affiliateId },
        data: {
          pendingCommission: { increment: amount },
          totalCommission: { increment: amount },
        },
      });
      if (linkId) {
        await prisma.affiliateLink.update({ where: { id: linkId }, data: { conversions: { increment: 1 } } }).catch(() => {});
      }
    } catch {
      const comm = { id: `comm-${Date.now()}`, affiliateId, orderId, amount, status: "pending", createdAt: new Date() };
      _seedCommissions.push(comm);
      const a = _seedAffiliates.find(x => x.id === affiliateId);
      if (a) {
        a.pendingCommission = Number(a.pendingCommission || 0) + amount;
        a.totalCommission = Number(a.totalCommission || 0) + amount;
      }
      if (linkId) {
        const l = _seedLinks.find(x => x.id === linkId);
        if (l) l.conversions = Number(l.conversions || 0) + 1;
      }
    }
  },

  getStats: async (affiliateId: string) => {
    try {
      const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
      if (!affiliate) return null;
      const links = await prisma.affiliateLink.findMany({ where: { affiliateId } });
      const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
      const totalConversions = links.reduce((s, l) => s + l.conversions, 0);
      return {
        ...affiliate,
        totalClicks,
        totalConversions,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(1) : "0",
      };
    } catch {
      const affiliate = _seedAffiliates.find(x => x.id === affiliateId);
      if (!affiliate) return null;
      const links = _seedLinks.filter(x => x.affiliateId === affiliateId);
      const totalClicks = links.reduce((s, l) => s + Number(l.clicks || 0), 0) + _seedClicks.filter(c => c.affiliateId === affiliateId).length;
      const totalConversions = links.reduce((s, l) => s + Number(l.conversions || 0), 0);
      return {
        ...affiliate,
        totalClicks,
        totalConversions,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks * 100).toFixed(1) : "0",
      };
    }
  },

  links: {
    list: async (affiliateId: string) => {
      try {
        return await prisma.affiliateLink.findMany({ where: { affiliateId }, orderBy: { createdAt: "desc" } });
      } catch {
        return _seedLinks.filter(l => l.affiliateId === affiliateId);
      }
    },
    create: async (affiliateId: string, productId?: string, customCode?: string) => {
      const shortCode = customCode || randomBytes(3).toString("hex");
      const url = productId ? `/products/${productId}?ref=${shortCode}` : `/?ref=${shortCode}`;
      try {
        return await prisma.affiliateLink.create({ data: { affiliateId, productId, url, shortCode } });
      } catch {
        const link = { id: `lnk-${Date.now()}`, affiliateId, productId, url, shortCode, clicks: 0, conversions: 0, isActive: true, createdAt: new Date() };
        _seedLinks.push(link);
        return link;
      }
    },
  },

  withdrawals: {
    list: async (affiliateId: string) => {
      try {
        return await prisma.affiliateWithdrawal.findMany({ where: { affiliateId }, orderBy: { createdAt: "desc" } });
      } catch {
        return _seedWithdrawals.filter(w => w.affiliateId === affiliateId);
      }
    },
    all: async () => {
      try {
        return await prisma.affiliateWithdrawal.findMany({ include: { affiliate: { include: { user: true } } }, orderBy: { createdAt: "desc" } });
      } catch {
        return structuredClone(_seedWithdrawals);
      }
    },
    request: async (affiliateId: string, amount: number, method?: string, accountDetails?: Record<string, unknown>) => {
      try {
        const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
        if (!affiliate || affiliate.wallet < amount) throw new Error("Insufficient wallet balance.");
        await prisma.affiliate.update({ where: { id: affiliateId }, data: { wallet: { decrement: amount } } });
        return await prisma.affiliateWithdrawal.create({
          data: { affiliateId, amount, method, accountDetails: accountDetails ?? undefined } as never,
        });
      } catch (err) {
        const affiliate = _seedAffiliates.find(x => x.id === affiliateId);
        if (!affiliate || Number(affiliate.wallet || 0) < amount) throw new Error("Insufficient wallet balance.");
        affiliate.wallet = Number(affiliate.wallet || 0) - amount;
        const w = { id: `wth-${Date.now()}`, affiliateId, amount, status: "pending", method, accountDetails, createdAt: new Date() };
        _seedWithdrawals.push(w);
        return w;
      }
    },
    updateStatus: async (withdrawalId: string, status: "approved" | "paid" | "rejected") => {
      try {
        const w = await prisma.affiliateWithdrawal.findUnique({ where: { id: withdrawalId } });
        if (!w) return null;
        if (status === "rejected" && w.status !== "rejected") {
          // refund back to wallet
          await prisma.affiliate.update({ where: { id: w.affiliateId }, data: { wallet: { increment: w.amount } } });
        } else if (status === "paid" && w.status !== "paid") {
          await prisma.affiliate.update({ where: { id: w.affiliateId }, data: { withdrawnCommission: { increment: w.amount } } });
        }
        return await prisma.affiliateWithdrawal.update({
          where: { id: withdrawalId },
          data: { status: status as never, processedAt: new Date() },
        });
      } catch {
        const w = _seedWithdrawals.find(x => x.id === withdrawalId);
        if (w) {
          const prevStatus = w.status;
          w.status = status;
          w.processedAt = new Date();
          const a = _seedAffiliates.find(x => x.id === w.affiliateId);
          if (a) {
            if (status === "rejected" && prevStatus !== "rejected") {
              a.wallet = Number(a.wallet || 0) + Number(w.amount || 0);
            } else if (status === "paid" && prevStatus !== "paid") {
              a.withdrawnCommission = Number(a.withdrawnCommission || 0) + Number(w.amount || 0);
            }
          }
        }
        return w;
      }
    },
  },

  commissions: {
    list: async (affiliateId: string) => {
      try {
        return await prisma.affiliateCommission.findMany({ where: { affiliateId }, orderBy: { createdAt: "desc" } });
      } catch {
        return _seedCommissions.filter(c => c.affiliateId === affiliateId);
      }
    },
    approve: async (id: string) => {
      try {
        const commission = await prisma.affiliateCommission.findUnique({ where: { id } });
        if (!commission || commission.status !== "pending") return;
        await prisma.affiliateCommission.update({ where: { id }, data: { status: "approved" } });
        await prisma.affiliate.update({
          where: { id: commission.affiliateId },
          data: {
            pendingCommission: { decrement: commission.amount },
            approvedCommission: { increment: commission.amount },
            wallet: { increment: commission.amount },
          },
        });
      } catch {
        const c = _seedCommissions.find(x => x.id === id);
        if (c && c.status === "pending") {
          c.status = "approved";
          const a = _seedAffiliates.find(x => x.id === c.affiliateId);
          if (a) {
            a.pendingCommission = Math.max(0, Number(a.pendingCommission || 0) - Number(c.amount));
            a.approvedCommission = Number(a.approvedCommission || 0) + Number(c.amount);
            a.wallet = Number(a.wallet || 0) + Number(c.amount);
          }
        }
      }
    },
    reject: async (id: string) => {
      try {
        const commission = await prisma.affiliateCommission.findUnique({ where: { id } });
        if (!commission || commission.status !== "pending") return;
        await prisma.affiliateCommission.update({ where: { id }, data: { status: "rejected" } });
        await prisma.affiliate.update({
          where: { id: commission.affiliateId },
          data: {
            pendingCommission: { decrement: commission.amount },
          },
        });
      } catch {
        const c = _seedCommissions.find(x => x.id === id);
        if (c && c.status === "pending") {
          c.status = "rejected";
          const a = _seedAffiliates.find(x => x.id === c.affiliateId);
          if (a) {
            a.pendingCommission = Math.max(0, Number(a.pendingCommission || 0) - Number(c.amount));
          }
        }
      }
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

const _seedEmployees: Record<string, unknown>[] = [
  {
    id: "emp-1",
    name: "Dr. Vikram Singhania",
    slug: "vikram-singhania",
    employeeId: "QC-EMP-1042",
    designation: "Lead Research Scientist & Medical Affairs",
    department: "Clinical Research & Formulations",
    email: "vikram.s@queenscare.in",
    phone: "+91 98200 12345",
    photo: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=800&q=80",
    bio: "Dr. Vikram Singhania leads clinical formulations and purity validations at Queens Care Laboratories. With over 14 years in pharmaceutical pharmacology and biochemical medicine, he oversees evidence-based ingredient selection and third-party stability testing.",
    active: true,
    createdAt: new Date(),
  },
];

export const employeeStore = {
  list: async () => {
    try { return await prisma.employee.findMany({ orderBy: { createdAt: "desc" } }); }
    catch { return structuredClone(_seedEmployees); }
  },
  bySlug: async (slug: string) => {
    try { return await prisma.employee.findUnique({ where: { slug } }); }
    catch { return _seedEmployees.find(e => e.slug === slug) || null; }
  },
  byId: async (id: string) => {
    try { return await prisma.employee.findUnique({ where: { id } }); }
    catch { return _seedEmployees.find(e => e.id === id) || null; }
  },
  create: async (data: Record<string, unknown>) => {
    try { return await prisma.employee.create({ data: data as never }); }
    catch {
      const emp = { id: `emp-${Date.now()}`, ...data, active: data.active !== false, createdAt: new Date() };
      _seedEmployees.unshift(emp);
      return emp;
    }
  },
  update: async (id: string, data: Record<string, unknown>) => {
    try { return await prisma.employee.update({ where: { id }, data: data as never }); }
    catch {
      const idx = _seedEmployees.findIndex(e => e.id === id || e.slug === id);
      if (idx === -1) return null;
      _seedEmployees[idx] = { ..._seedEmployees[idx], ...data };
      return _seedEmployees[idx];
    }
  },
  delete: async (id: string) => {
    try { await prisma.employee.delete({ where: { id } }); }
    catch {
      const idx = _seedEmployees.findIndex(e => e.id === id || e.slug === id);
      if (idx >= 0) _seedEmployees.splice(idx, 1);
    }
  },
};

// ─── DOCTOR ─────────────────────────────────────────────────────────────────

const _seedDoctors: Record<string, unknown>[] = [];

export const doctorStore = {
  list: async () => {
    try { return await prisma.doctor.findMany({ orderBy: { createdAt: "desc" } }); }
    catch { return structuredClone(_seedDoctors); }
  },
  byId: async (id: string) => {
    try { return await prisma.doctor.findUnique({ where: { id } }); }
    catch { return _seedDoctors.find(d => d.id === id) || null; }
  },
  create: async (data: Record<string, unknown>) => {
    try { return await prisma.doctor.create({ data: data as never }); }
    catch {
      const doc = { id: `doc-${Date.now()}`, ...data, status: "pending", createdAt: new Date() };
      _seedDoctors.unshift(doc);
      return doc;
    }
  },
  update: async (id: string, data: Record<string, unknown>) => {
    try { return await prisma.doctor.update({ where: { id }, data: data as never }); }
    catch {
      const idx = _seedDoctors.findIndex(d => d.id === id);
      if (idx === -1) return null;
      _seedDoctors[idx] = { ..._seedDoctors[idx], ...data };
      return _seedDoctors[idx];
    }
  },
  updateStatus: async (id: string, status: string) => {
    try { return await prisma.doctor.update({ where: { id }, data: { status } }); }
    catch {
      const doc = _seedDoctors.find(d => d.id === id);
      if (doc) doc.status = status;
      return doc;
    }
  },
};
