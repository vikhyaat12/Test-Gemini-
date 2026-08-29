import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { fileDb } from "./file-db";

const usePrisma = Boolean(process.env.DATABASE_URL);
const now = () => new Date().toISOString();

// ─── COUPONS ─────────────────────────────────────────────────────────────────

export const couponStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }); } catch {}
    }
    return fileDb.findMany("coupons");
  },

  byCode: async (code: string) => {
    const norm = code.toUpperCase();
    if (usePrisma) {
      try { return await prisma.coupon.findUnique({ where: { code: norm } }); } catch {}
    }
    return fileDb.findOne("coupons", c => String(c.code).toUpperCase() === norm);
  },

  create: async (data: Record<string, unknown>) => {
    const code = String(data.code).toUpperCase();
    if (usePrisma) {
      try {
        const c = await prisma.coupon.create({ data: { ...data, code } as never });
        fileDb.insert("coupons", c as unknown as Record<string, unknown>);
        return c;
      } catch {}
    }
    return fileDb.insert("coupons", { ...data, code, usedCount: 0, isActive: data.isActive !== false });
  },

  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const c = await prisma.coupon.update({ where: { id }, data: data as never });
        fileDb.update("coupons", id, c as unknown as Record<string, unknown>);
        return c;
      } catch {}
    }
    return fileDb.update("coupons", id, data);
  },

  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.coupon.delete({ where: { id } });
        fileDb.remove("coupons", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("coupons", id));
  },

  validate: async (code: string, subtotal: number, userId?: string) => {
    let coupon: Record<string, unknown> | null = null;
    const norm = code.toUpperCase();
    if (usePrisma) {
      try {
        coupon = (await prisma.coupon.findUnique({ where: { code: norm } })) as Record<string, unknown> | null;
      } catch {}
    }
    if (!coupon) {
      coupon = fileDb.findOne("coupons", c => String(c.code).toUpperCase() === norm);
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
    if (userId && coupon.perUserLimit && usePrisma) {
      try {
        const userUsage = await prisma.couponUsage.count({ where: { couponId: String(coupon.id), userId } });
        if (userUsage >= Number(coupon.perUserLimit)) return { valid: false, error: "You have already used this coupon." };
      } catch {}
    }
    const discVal = Number(coupon.discount || 0);
    let discount = coupon.type === "percentage" ? Math.round((subtotal * discVal) / 100) : discVal;
    const maxDiscount = Number(coupon.maxDiscount || 0);
    if (maxDiscount && discount > maxDiscount) discount = maxDiscount;
    return { valid: true, coupon, discount };
  },

  recordUsage: async (couponId: string, userId: string, orderId: string, discount: number) => {
    if (usePrisma) {
      try {
        await prisma.couponUsage.create({ data: { couponId, userId, orderId, discount } });
        await prisma.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
      } catch {}
    }
    const found = fileDb.findOne("coupons", c => c.id === couponId);
    if (found) {
      fileDb.update("coupons", couponId, { usedCount: Number(found.usedCount || 0) + 1 });
    }
  },
};

// ─── AFFILIATES ──────────────────────────────────────────────────────────────

function generateAffiliateCode(): string {
  return `QC${randomBytes(4).toString("hex").toUpperCase()}`;
}

type AffiliateRecord = {
  id: string;
  userId: string;
  affiliateCode: string;
  status: string;
  commissionRate: number;
  customCoupon?: string | null;
  level: number;
  totalSales: number;
  totalCommission: number;
  pendingCommission: number;
  approvedCommission: number;
  withdrawnCommission: number;
  wallet: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  user?: Record<string, unknown> | null;
};

export const affiliateStore = {
  list: async (): Promise<AffiliateRecord[]> => {
    if (usePrisma) {
      try { return (await prisma.affiliate.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } })) as unknown as AffiliateRecord[]; } catch {}
    }
    const affiliates = fileDb.findMany("affiliates");
    const users = fileDb.findMany("users");
    return affiliates.map(a => ({
      ...a,
      user: users.find(u => u.id === a.userId) || { name: "Partner", email: "partner@queenscare.in" },
    })) as unknown as AffiliateRecord[];
  },

  byId: async (id: string): Promise<AffiliateRecord | null> => {
    if (usePrisma) {
      try { return (await prisma.affiliate.findUnique({ where: { id }, include: { user: true } })) as unknown as AffiliateRecord | null; } catch {}
    }
    const a = fileDb.findOne("affiliates", x => x.id === id);
    if (!a) return null;
    const user = fileDb.findOne("users", u => u.id === a.userId);
    return { ...a, user } as unknown as AffiliateRecord;
  },

  byUserId: async (userId: string): Promise<AffiliateRecord | null> => {
    if (usePrisma) {
      try { return (await prisma.affiliate.findUnique({ where: { userId }, include: { user: true } })) as unknown as AffiliateRecord | null; } catch {}
    }
    const a = fileDb.findOne("affiliates", x => x.userId === userId);
    if (!a) return null;
    const user = fileDb.findOne("users", u => u.id === userId);
    return { ...a, user } as unknown as AffiliateRecord;
  },

  byCode: async (code: string): Promise<AffiliateRecord | null> => {
    const norm = code.toUpperCase();
    if (usePrisma) {
      try { return (await prisma.affiliate.findUnique({ where: { affiliateCode: norm }, include: { user: true } })) as unknown as AffiliateRecord | null; } catch {}
    }
    const a = fileDb.findOne("affiliates", x => String(x.affiliateCode).toUpperCase() === norm);
    if (!a) return null;
    const user = fileDb.findOne("users", u => u.id === a.userId);
    return { ...a, user } as unknown as AffiliateRecord;
  },

  byRef: async (ref: string): Promise<{ affiliate: AffiliateRecord | null; link: Record<string, unknown> | null } | null> => {
    const code = ref.trim();
    if (!code) return null;
    if (usePrisma) {
      try {
        const byCode = (await prisma.affiliate.findUnique({ where: { affiliateCode: code.toUpperCase() }, include: { user: true } })) as unknown as AffiliateRecord | null;
        if (byCode) return { affiliate: byCode, link: null };
        const link = (await prisma.affiliateLink.findUnique({ where: { shortCode: code }, include: { affiliate: { include: { user: true } } } })) as unknown as Record<string, unknown> | null;
        if (link && link.affiliate) return { affiliate: link.affiliate as unknown as AffiliateRecord, link };
      } catch {}
    }
    const byCode = fileDb.findOne("affiliates", a => String(a.affiliateCode).toUpperCase() === code.toUpperCase());
    if (byCode) {
      const user = fileDb.findOne("users", u => u.id === byCode.userId);
      return { affiliate: { ...byCode, user } as unknown as AffiliateRecord, link: null };
    }
    const link = fileDb.findOne("affiliateLinks", l => String(l.shortCode).toUpperCase() === code.toUpperCase() || l.shortCode === code);
    if (link) {
      const aff = fileDb.findOne("affiliates", a => a.id === link.affiliateId);
      const user = aff ? fileDb.findOne("users", u => u.id === aff.userId) : null;
      return { affiliate: aff ? ({ ...aff, user } as unknown as AffiliateRecord) : null, link };
    }
    return null;
  },

  create: async (userId: string, data?: Partial<{ commissionRate: number; customCoupon: string }>) => {
    const code = generateAffiliateCode();
    if (usePrisma) {
      try {
        const aff = await prisma.affiliate.create({
          data: {
            userId,
            affiliateCode: code,
            status: "active",
            commissionRate: data?.commissionRate ?? 10,
            customCoupon: data?.customCoupon,
          },
          include: { user: true },
        });
        fileDb.insert("affiliates", aff as unknown as Record<string, unknown>);
        return aff;
      } catch {}
    }
    const record = {
      userId,
      affiliateCode: code,
      status: "active",
      commissionRate: data?.commissionRate ?? 10,
      customCoupon: data?.customCoupon,
      level: 1,
      totalSales: 0,
      totalCommission: 0,
      pendingCommission: 0,
      approvedCommission: 0,
      withdrawnCommission: 0,
      wallet: 0,
    };
    return fileDb.insert("affiliates", record);
  },

  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const aff = await prisma.affiliate.update({ where: { id }, data: data as never });
        fileDb.update("affiliates", id, aff as unknown as Record<string, unknown>);
        return aff;
      } catch {}
    }
    return fileDb.update("affiliates", id, data);
  },

  updateStatus: async (id: string, status: string) => {
    if (usePrisma) {
      try {
        const aff = await prisma.affiliate.update({ where: { id }, data: { status: status as never } });
        fileDb.update("affiliates", id, { status });
        return aff;
      } catch {}
    }
    return fileDb.update("affiliates", id, { status });
  },

  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.affiliate.delete({ where: { id } });
        fileDb.remove("affiliates", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("affiliates", id));
  },

  recordCommission: async (affiliateId: string, orderId: string, amount: number, linkId?: string) => {
    return affiliateStore.commissions.create({ affiliateId, orderId, amount });
  },

  recordClick: async (linkId: string | null, affiliateId: string, ip?: string, userAgent?: string, referer?: string) => {
    return affiliateStore.links.logClick(linkId || "direct", affiliateId, { ip, userAgent, referer });
  },

  getStats: async (affiliateId: string) => {
    const aff = (await affiliateStore.byId(affiliateId)) as Record<string, unknown> | null;
    const commissions = await affiliateStore.commissions.list(affiliateId);
    const links = await affiliateStore.links.list(affiliateId);
    const clicks = links.reduce((sum, l) => sum + Number(l.clicks || 0), 0);
    return {
      totalSales: Number(aff?.totalSales || 0),
      totalCommission: Number(aff?.totalCommission || 0),
      pendingCommission: Number(aff?.pendingCommission || 0),
      approvedCommission: Number(aff?.approvedCommission || 0),
      withdrawnCommission: Number(aff?.withdrawnCommission || 0),
      wallet: Number(aff?.wallet || 0),
      clicks,
      totalLinks: links.length,
      totalOrders: commissions.length,
    };
  },

  links: {
    list: async (affiliateId: string) => {
      if (usePrisma) {
        try { return await prisma.affiliateLink.findMany({ where: { affiliateId }, orderBy: { createdAt: "desc" } }); } catch {}
      }
      return fileDb.findMany("affiliateLinks", l => l.affiliateId === affiliateId);
    },
    create: async (affiliateId: string, dataOrProductId?: string | { productId?: string; url?: string; shortCode?: string }, customCode?: string) => {
      let productId: string | undefined;
      let url = "https://queenscare.in";
      let shortCode = customCode;
      if (typeof dataOrProductId === "object" && dataOrProductId !== null) {
        productId = dataOrProductId.productId;
        url = dataOrProductId.url || url;
        shortCode = dataOrProductId.shortCode || shortCode;
      } else if (typeof dataOrProductId === "string") {
        productId = dataOrProductId;
      }
      shortCode = shortCode || randomBytes(4).toString("hex");
      if (usePrisma) {
        try {
          const l = await prisma.affiliateLink.create({ data: { affiliateId, productId, url, shortCode } });
          fileDb.insert("affiliateLinks", l as unknown as Record<string, unknown>);
          return l;
        } catch {}
      }
      return fileDb.insert("affiliateLinks", { affiliateId, productId, url, shortCode, clicks: 0, conversions: 0, isActive: true });
    },
    byCode: async (shortCode: string) => {
      if (usePrisma) {
        try { return await prisma.affiliateLink.findUnique({ where: { shortCode }, include: { affiliate: true } }); } catch {}
      }
      const l = fileDb.findOne("affiliateLinks", x => x.shortCode === shortCode);
      if (!l) return null;
      const affiliate = fileDb.findOne("affiliates", a => a.id === l.affiliateId);
      return { ...l, affiliate };
    },
    logClick: async (linkId: string, affiliateId: string, reqInfo?: { ip?: string; userAgent?: string; referer?: string }) => {
      if (usePrisma) {
        try {
          await prisma.affiliateClick.create({ data: { linkId, affiliateId, ip: reqInfo?.ip, userAgent: reqInfo?.userAgent, referer: reqInfo?.referer } });
          await prisma.affiliateLink.update({ where: { id: linkId }, data: { clicks: { increment: 1 } } });
        } catch {}
      }
      const l = fileDb.findOne("affiliateLinks", x => x.id === linkId);
      if (l) {
        fileDb.update("affiliateLinks", linkId, { clicks: Number(l.clicks || 0) + 1 });
      }
      fileDb.insert("affiliateClicks", { linkId, affiliateId, ...reqInfo });
    },
  },

  commissions: {
    list: async (affiliateId?: string) => {
      if (usePrisma) {
        try { return await prisma.affiliateCommission.findMany({ where: affiliateId ? { affiliateId } : {}, orderBy: { createdAt: "desc" } }); } catch {}
      }
      return fileDb.findMany("affiliateCommissions", c => !affiliateId || c.affiliateId === affiliateId);
    },
    create: async (data: { affiliateId: string; orderId?: string; amount: number }) => {
      if (usePrisma) {
        try {
          const c = await prisma.affiliateCommission.create({ data: { affiliateId: data.affiliateId, orderId: data.orderId, amount: data.amount, status: "pending" } });
          await prisma.affiliate.update({ where: { id: data.affiliateId }, data: { pendingCommission: { increment: data.amount } } });
          fileDb.insert("affiliateCommissions", c as unknown as Record<string, unknown>);
          return c;
        } catch {}
      }
      const c = fileDb.insert("affiliateCommissions", { ...data, status: "pending" });
      const aff = fileDb.findOne("affiliates", a => a.id === data.affiliateId);
      if (aff) {
        fileDb.update("affiliates", data.affiliateId, { pendingCommission: Number(aff.pendingCommission || 0) + data.amount });
      }
      return c;
    },
    approve: async (id: string) => {
      if (usePrisma) {
        try {
          const commission = await prisma.affiliateCommission.findUnique({ where: { id } });
          if (commission && commission.status === "pending") {
            await prisma.affiliateCommission.update({ where: { id }, data: { status: "approved" } });
            await prisma.affiliate.update({
              where: { id: commission.affiliateId },
              data: {
                pendingCommission: { decrement: commission.amount },
                approvedCommission: { increment: commission.amount },
                wallet: { increment: commission.amount },
              },
            });
          }
        } catch {}
      }
      const c = fileDb.findOne("affiliateCommissions", x => x.id === id);
      if (c && c.status === "pending") {
        fileDb.update("affiliateCommissions", id, { status: "approved" });
        const a = fileDb.findOne("affiliates", x => x.id === c.affiliateId);
        if (a) {
          fileDb.update("affiliates", String(c.affiliateId), {
            pendingCommission: Math.max(0, Number(a.pendingCommission || 0) - Number(c.amount)),
            approvedCommission: Number(a.approvedCommission || 0) + Number(c.amount),
            wallet: Number(a.wallet || 0) + Number(c.amount),
          });
        }
      }
    },
    reject: async (id: string) => {
      if (usePrisma) {
        try {
          const commission = await prisma.affiliateCommission.findUnique({ where: { id } });
          if (commission && commission.status === "pending") {
            await prisma.affiliateCommission.update({ where: { id }, data: { status: "rejected" } });
            await prisma.affiliate.update({
              where: { id: commission.affiliateId },
              data: { pendingCommission: { decrement: commission.amount } },
            });
          }
        } catch {}
      }
      const c = fileDb.findOne("affiliateCommissions", x => x.id === id);
      if (c && c.status === "pending") {
        fileDb.update("affiliateCommissions", id, { status: "rejected" });
        const a = fileDb.findOne("affiliates", x => x.id === c.affiliateId);
        if (a) {
          fileDb.update("affiliates", String(c.affiliateId), {
            pendingCommission: Math.max(0, Number(a.pendingCommission || 0) - Number(c.amount)),
          });
        }
      }
    },
  },

  withdrawals: {
    all: async () => {
      if (usePrisma) {
        try { return await prisma.affiliateWithdrawal.findMany({ include: { affiliate: true }, orderBy: { createdAt: "desc" } }); } catch {}
      }
      return fileDb.findMany("affiliateWithdrawals");
    },
    list: async (affiliateId?: string) => {
      if (usePrisma) {
        try { return await prisma.affiliateWithdrawal.findMany({ where: affiliateId ? { affiliateId } : {}, include: { affiliate: true }, orderBy: { createdAt: "desc" } }); } catch {}
      }
      return fileDb.findMany("affiliateWithdrawals", w => !affiliateId || w.affiliateId === affiliateId);
    },
    request: async (affiliateId: string, amount: number, method?: string) => {
      return affiliateStore.withdrawals.create({ affiliateId, amount, method });
    },
    create: async (data: { affiliateId: string; amount: number; method?: string; accountDetails?: Record<string, unknown> }) => {
      if (usePrisma) {
        try {
          const w = await prisma.affiliateWithdrawal.create({ data: { affiliateId: data.affiliateId, amount: data.amount, method: data.method || "Bank Transfer", accountDetails: data.accountDetails as never, status: "pending" } });
          await prisma.affiliate.update({ where: { id: data.affiliateId }, data: { wallet: { decrement: data.amount } } });
          fileDb.insert("affiliateWithdrawals", w as unknown as Record<string, unknown>);
          return w;
        } catch {}
      }
      const w = fileDb.insert("affiliateWithdrawals", { ...data, status: "pending" });
      const a = fileDb.findOne("affiliates", x => x.id === data.affiliateId);
      if (a) {
        fileDb.update("affiliates", data.affiliateId, { wallet: Math.max(0, Number(a.wallet || 0) - data.amount) });
      }
      return w;
    },
    updateStatus: async (id: string, status: string) => {
      if (usePrisma) {
        try {
          const w = await prisma.affiliateWithdrawal.update({ where: { id }, data: { status: status as never, processedAt: status === "paid" ? new Date() : undefined } });
          fileDb.update("affiliateWithdrawals", id, w as unknown as Record<string, unknown>);
          return w;
        } catch {}
      }
      return fileDb.update("affiliateWithdrawals", id, { status, processedAt: status === "paid" ? now() : undefined });
    },
  },
};

// ─── B2B / DISTRIBUTOR ──────────────────────────────────────────────────────

export const b2bStore = {
  applications: {
    list: async () => {
      if (usePrisma) {
        try { return await prisma.b2BApplication.findMany({ orderBy: { createdAt: "desc" } }); } catch {}
      }
      return fileDb.findMany("b2bApplications");
    },
    create: async (data: Record<string, unknown>) => {
      if (usePrisma) {
        try {
          const app = await prisma.b2BApplication.create({ data: data as never });
          fileDb.insert("b2bApplications", app as unknown as Record<string, unknown>);
          return app;
        } catch {}
      }
      return fileDb.insert("b2bApplications", { ...data, status: "pending" });
    },
    updateStatus: async (id: string, status: string, reviewedBy?: string, notes?: string) => {
      if (usePrisma) {
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
          fileDb.update("b2bApplications", id, { status, reviewedBy, notes });
          return app;
        } catch {}
      }
      const updated = fileDb.update("b2bApplications", id, { status, reviewedBy, notes }) as Record<string, unknown> | null;
      if (status === "approved" && updated) {
        const exists = fileDb.findOne("distributors", d => d.applicationId === id);
        if (!exists) {
          fileDb.insert("distributors", {
            applicationId: id,
            company: updated.company,
            contactName: updated.name,
            email: updated.email,
            phone: updated.phone,
            status: "approved",
            pricingTier: "Tier 1 - Wholesale",
          });
        }
      }
      return updated;
    },
  },

  distributors: {
    list: async () => {
      if (usePrisma) {
        try { return await prisma.distributor.findMany({ include: { application: true }, orderBy: { createdAt: "desc" } }); } catch {}
      }
      return fileDb.findMany("distributors");
    },
    byId: async (id: string) => {
      if (usePrisma) {
        try { return await prisma.distributor.findUnique({ where: { id }, include: { application: true } }); } catch {}
      }
      return fileDb.findOne("distributors", d => d.id === id);
    },
    update: async (id: string, data: Record<string, unknown>) => {
      if (usePrisma) {
        try {
          const d = await prisma.distributor.update({ where: { id }, data: data as never });
          fileDb.update("distributors", id, d as unknown as Record<string, unknown>);
          return d;
        } catch {}
      }
      return fileDb.update("distributors", id, data);
    },
  },

  orders: {
    list: async (distributorId?: string) => {
      return [];
    },
    create: async (distributorId: string, lines: { productId: string; quantity: number; unitPrice: number }[], total: number, notes?: string) => {
      return null;
    },
    updateStatus: async (id: string, status: string) => {
      return null;
    },
  },
};

// ─── MEDIA ───────────────────────────────────────────────────────────────────

export const mediaStore = {
  list: async (type?: string) => {
    if (usePrisma) {
      try { return await prisma.media.findMany({ where: type ? { type: type as never } : {}, orderBy: { createdAt: "desc" } }); } catch {}
    }
    return fileDb.findMany("media", m => !type || m.type === type);
  },
  byId: async (id: string) => {
    if (usePrisma) {
      try { return await prisma.media.findUnique({ where: { id } }); } catch {}
    }
    return fileDb.findOne("media", m => m.id === id);
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const m = await prisma.media.create({ data: data as never });
        fileDb.insert("media", m as unknown as Record<string, unknown>);
        return m;
      } catch {}
    }
    return fileDb.insert("media", data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const m = await prisma.media.update({ where: { id }, data: data as never });
        fileDb.update("media", id, m as unknown as Record<string, unknown>);
        return m;
      } catch {}
    }
    return fileDb.update("media", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.media.delete({ where: { id } });
        fileDb.remove("media", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("media", id));
  },
};

// ─── BANNERS ─────────────────────────────────────────────────────────────────

export const bannerStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.banner.findMany({ orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("banners").sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },
  active: async (position?: string) => {
    if (usePrisma) {
      try { return await prisma.banner.findMany({ where: { active: true, visible: true, ...(position ? { position } : {}) }, orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("banners", b => b.active !== false && b.visible !== false && (!position || b.position === position));
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const b = await prisma.banner.create({ data: data as never });
        fileDb.insert("banners", b as unknown as Record<string, unknown>);
        return b;
      } catch {}
    }
    return fileDb.insert("banners", data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const b = await prisma.banner.update({ where: { id }, data: data as never });
        fileDb.update("banners", id, b as unknown as Record<string, unknown>);
        return b;
      } catch {}
    }
    return fileDb.update("banners", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.banner.delete({ where: { id } });
        fileDb.remove("banners", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("banners", id));
  },
};

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export const faqStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.fAQ.findMany({ orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("faqs").sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },
  visible: async () => {
    if (usePrisma) {
      try { return await prisma.fAQ.findMany({ where: { visible: true }, orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("faqs", f => f.visible !== false);
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const f = await prisma.fAQ.create({ data: data as never });
        fileDb.insert("faqs", f as unknown as Record<string, unknown>);
        return f;
      } catch {}
    }
    return fileDb.insert("faqs", data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const f = await prisma.fAQ.update({ where: { id }, data: data as never });
        fileDb.update("faqs", id, f as unknown as Record<string, unknown>);
        return f;
      } catch {}
    }
    return fileDb.update("faqs", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.fAQ.delete({ where: { id } });
        fileDb.remove("faqs", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("faqs", id));
  },
};

// ─── TESTIMONIALS ───────────────────────────────────────────────────────────

export const testimonialStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.testimonial.findMany({ orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("testimonials").sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },
  visible: async () => {
    if (usePrisma) {
      try { return await prisma.testimonial.findMany({ where: { visible: true }, orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("testimonials", t => t.visible !== false);
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const t = await prisma.testimonial.create({ data: data as never });
        fileDb.insert("testimonials", t as unknown as Record<string, unknown>);
        return t;
      } catch {}
    }
    return fileDb.insert("testimonials", data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const t = await prisma.testimonial.update({ where: { id }, data: data as never });
        fileDb.update("testimonials", id, t as unknown as Record<string, unknown>);
        return t;
      } catch {}
    }
    return fileDb.update("testimonials", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.testimonial.delete({ where: { id } });
        fileDb.remove("testimonials", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("testimonials", id));
  },
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────

export const settingStore = {
  get: async (key: string) => {
    if (usePrisma) {
      try { return await prisma.setting.findUnique({ where: { key } }); } catch {}
    }
    return fileDb.findOne("settings", s => s.key === key);
  },
  getGroup: async (group: string) => {
    if (usePrisma) {
      try { return await prisma.setting.findMany({ where: { group } }); } catch {}
    }
    return fileDb.findMany("settings", s => s.group === group);
  },
  set: async (key: string, value: unknown, group = "general") => {
    if (usePrisma) {
      try {
        const s = await prisma.setting.upsert({ where: { key }, update: { value: value as never, group }, create: { key, value: value as never, group } });
        fileDb.update("settings", { key }, { key, value, group });
        return s;
      } catch {}
    }
    return fileDb.update("settings", { key }, { key, value, group });
  },
  getAll: async () => {
    if (usePrisma) {
      try { return await prisma.setting.findMany({ orderBy: { group: "asc" } }); } catch {}
    }
    return fileDb.findMany("settings");
  },
};

// ─── ORDERS (extended) ──────────────────────────────────────────────────────

export const orderStoreExtended = {
  updateStatus: async (id: string, status: string, note?: string) => {
    if (usePrisma) {
      try {
        await prisma.order.update({ where: { id }, data: { status: status as never } });
        if (note) await prisma.orderStatusHistory.create({ data: { orderId: id, status: status as never, note } });
      } catch {}
    }
    fileDb.update("orders", id, { status });
  },
  history: async (orderId: string) => {
    return [];
  },
  byUser: async (userId: string) => {
    return fileDb.findMany("orders", o => o.userId === userId);
  },
  all: async () => {
    return fileDb.findMany("orders");
  },
};

// ─── CUSTOMERS (admin) ──────────────────────────────────────────────────────

export const customerStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.user.findMany({ where: { role: "customer" }, orderBy: { createdAt: "desc" } }); } catch {}
    }
    return fileDb.findMany("users", u => u.role === "customer");
  },
  byId: async (id: string) => {
    if (usePrisma) {
      try { return await prisma.user.findUnique({ where: { id }, include: { addresses: true, orders: true, wishlist: true } }); } catch {}
    }
    return fileDb.findOne("users", u => u.id === id);
  },
  count: async () => {
    return fileDb.findMany("users", u => u.role === "customer").length;
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const u = await prisma.user.update({ where: { id }, data: data as never });
        fileDb.update("users", id, u as unknown as Record<string, unknown>);
        return u;
      } catch {}
    }
    return fileDb.update("users", id, data);
  },
};

// ─── ADDRESSES ───────────────────────────────────────────────────────────────

export const addressStore = {
  list: async (userId: string) => [],
  create: async (userId: string, data: Record<string, unknown>) => ({ ...data, userId }),
  update: async (id: string, data: Record<string, unknown>) => ({ ...data, id }),
  delete: async (id: string) => {},
};

// ─── 3D MODELS ──────────────────────────────────────────────────────────────

export const model3dStore = {
  byProduct: async (productId: string) => {
    if (usePrisma) {
      try { return await prisma.product3DModel.findUnique({ where: { productId } }); } catch {}
    }
    return null;
  },
  upsert: async (productId: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try { return await prisma.product3DModel.upsert({ where: { productId }, update: data as never, create: { productId, ...data } as never }); } catch {}
    }
    return { productId, ...data };
  },
  delete: async (productId: string) => {},
};

// ─── HOMEPAGE SECTIONS ──────────────────────────────────────────────────────

export const homepageStore = {
  list: async () => {
    if (usePrisma) {
      try {
        const rows = await prisma.homepageSection.findMany({ orderBy: { sort: "asc" } });
        if (rows.length > 0) return rows;
      } catch {}
    }
    return fileDb.findMany("homepageSections").sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },
  active: async () => {
    if (usePrisma) {
      try {
        const rows = await prisma.homepageSection.findMany({ where: { active: true, visible: true }, orderBy: { sort: "asc" } });
        if (rows.length > 0) return rows;
      } catch {}
    }
    return fileDb.findMany("homepageSections", s => s.active !== false && s.visible !== false).sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const s = await prisma.homepageSection.create({ data: data as never });
        fileDb.insert("homepageSections", s as unknown as Record<string, unknown>);
        return s;
      } catch {}
    }
    return fileDb.insert("homepageSections", data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const s = await prisma.homepageSection.update({ where: { id }, data: data as never });
        fileDb.update("homepageSections", id, s as unknown as Record<string, unknown>);
        return s;
      } catch {}
    }
    return fileDb.update("homepageSections", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.homepageSection.delete({ where: { id } });
        fileDb.remove("homepageSections", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("homepageSections", id));
  },
};

// ─── OFFERS / PROMOTIONS ────────────────────────────────────────────────────

export const offerStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.offer.findMany({ orderBy: { createdAt: "desc" } }); } catch {}
    }
    return fileDb.findMany("offers");
  },
  active: async () => {
    if (usePrisma) {
      try { return await prisma.offer.findMany({ where: { active: true, visible: true } }); } catch {}
    }
    return fileDb.findMany("offers", o => o.active !== false && o.visible !== false);
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const o = await prisma.offer.create({ data: data as never });
        fileDb.insert("offers", o as unknown as Record<string, unknown>);
        return o;
      } catch {}
    }
    return fileDb.insert("offers", data);
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const o = await prisma.offer.update({ where: { id }, data: data as never });
        fileDb.update("offers", id, o as unknown as Record<string, unknown>);
        return o;
      } catch {}
    }
    return fileDb.update("offers", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.offer.delete({ where: { id } });
        fileDb.remove("offers", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("offers", id));
  },
};

export const promotionStore = {
  list: async () => [],
  create: async (data: Record<string, unknown>) => data,
  update: async (id: string, data: Record<string, unknown>) => data,
  delete: async (id: string) => {},
};

// ─── PRODUCT VARIANTS, SPECS, VIDEOS, FAQS ──────────────────────────────────

export const variantStore = {
  listByProduct: async (productId: string) => [],
  create: async (data: Record<string, unknown>) => data,
  update: async (id: string, data: Record<string, unknown>) => data,
  delete: async (id: string) => {},
};

export const specificationStore = {
  listByProduct: async (productId: string) => [],
  upsert: async (data: Record<string, unknown>) => data,
  delete: async (id: string) => {},
};

export const videoStore = {
  listByProduct: async (productId: string) => [],
  create: async (data: Record<string, unknown>) => data,
  delete: async (id: string) => {},
};

export const aplusStore = {
  listByProduct: async (productId: string) => [],
  upsert: async (data: Record<string, unknown>) => data,
  delete: async (id: string) => {},
};

export const productQAStore = {
  listByProduct: async (productId: string) => [],
  create: async (data: Record<string, unknown>) => data,
  answer: async (id: string, answer: string, answeredBy?: string) => ({ id, answer }),
  delete: async (id: string) => {},
};

export const productRelationStore = {
  getRelated: async (productId: string) => [],
  setRelated: async (productId: string, relatedProductIds: string[]) => {},
  removeRelated: async (productId: string, relatedProductId: string) => {},
};

export const productFAQStore = {
  listByProduct: async (productId: string) => [],
  create: async (data: Record<string, unknown>) => data,
  update: async (id: string, data: Record<string, unknown>) => data,
  delete: async (id: string) => {},
};

export const productTagStore = {
  listByProduct: async (productId: string) => [],
  addTag: async (productId: string, tag: string) => {},
  removeTag: async (productId: string, tag: string) => {},
};

// ─── CATEGORIES ─────────────────────────────────────────────────────────────

export const categoryStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.category.findMany({ orderBy: { sort: "asc" } }); } catch {}
    }
    return fileDb.findMany("categories").sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
  },
  bySlug: async (slug: string) => {
    if (usePrisma) {
      try { return await prisma.category.findUnique({ where: { slug } }); } catch {}
    }
    return fileDb.findOne("categories", c => c.slug === slug);
  },
  byId: async (id: string) => {
    if (usePrisma) {
      try { return await prisma.category.findUnique({ where: { id } }); } catch {}
    }
    return fileDb.findOne("categories", c => c.id === id);
  },
  create: async (data: Record<string, unknown>) => {
    const slug = String(data.slug || data.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (usePrisma) {
      try {
        const c = await prisma.category.create({ data: { ...data, slug } as never });
        fileDb.insert("categories", c as unknown as Record<string, unknown>);
        return c;
      } catch {}
    }
    return fileDb.insert("categories", { ...data, slug, active: data.active !== false, visible: data.visible !== false });
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const c = await prisma.category.update({ where: { id }, data: data as never });
        fileDb.update("categories", id, c as unknown as Record<string, unknown>);
        return c;
      } catch {}
    }
    return fileDb.update("categories", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.category.delete({ where: { id } });
        fileDb.remove("categories", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("categories", id));
  },
};

// ─── EMPLOYEES ──────────────────────────────────────────────────────────────

export const employeeStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.employee.findMany({ orderBy: { createdAt: "desc" } }); } catch {}
    }
    return fileDb.findMany("employees");
  },
  bySlug: async (slug: string) => {
    if (usePrisma) {
      try { return await prisma.employee.findUnique({ where: { slug } }); } catch {}
    }
    return fileDb.findOne("employees", e => e.slug === slug || e.id === slug);
  },
  byId: async (id: string) => {
    if (usePrisma) {
      try { return await prisma.employee.findUnique({ where: { id } }); } catch {}
    }
    return fileDb.findOne("employees", e => e.id === id || e.slug === id);
  },
  create: async (data: Record<string, unknown>) => {
    const slug = String(data.slug || data.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (usePrisma) {
      try {
        const emp = await prisma.employee.create({ data: { ...data, slug } as never });
        fileDb.insert("employees", emp as unknown as Record<string, unknown>);
        return emp;
      } catch {}
    }
    return fileDb.insert("employees", { ...data, slug, active: data.active !== false });
  },
  update: async (id: string, data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const emp = await prisma.employee.update({ where: { id }, data: data as never });
        fileDb.update("employees", id, emp as unknown as Record<string, unknown>);
        return emp;
      } catch {}
    }
    return fileDb.update("employees", id, data);
  },
  delete: async (id: string) => {
    if (usePrisma) {
      try {
        await prisma.employee.delete({ where: { id } });
        fileDb.remove("employees", id);
        return true;
      } catch {}
    }
    return Boolean(fileDb.remove("employees", id));
  },
};

// ─── DOCTORS ─────────────────────────────────────────────────────────────────

export const doctorStore = {
  list: async () => {
    if (usePrisma) {
      try { return await prisma.doctor.findMany({ orderBy: { createdAt: "desc" } }); } catch {}
    }
    return fileDb.findMany("doctors");
  },
  byId: async (id: string) => {
    if (usePrisma) {
      try { return await prisma.doctor.findUnique({ where: { id } }); } catch {}
    }
    return fileDb.findOne("doctors", d => d.id === id);
  },
  create: async (data: Record<string, unknown>) => {
    if (usePrisma) {
      try {
        const doc = await prisma.doctor.create({ data: data as never });
        fileDb.insert("doctors", doc as unknown as Record<string, unknown>);
        return doc;
      } catch {}
    }
    return fileDb.insert("doctors", { ...data, status: "pending" });
  },
  updateStatus: async (id: string, status: string) => {
    if (usePrisma) {
      try {
        const doc = await prisma.doctor.update({ where: { id }, data: { status: status as never } });
        fileDb.update("doctors", id, { status });
        return doc;
      } catch {}
    }
    return fileDb.update("doctors", id, { status });
  },
};
