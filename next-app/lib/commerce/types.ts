export type Role = "customer" | "admin" | "distributor" | "doctor" | "employee" | "affiliate" | "b2b_pending" | "b2b_approved";
export type OrderStatus = "pending" | "paid" | "processing" | "packed" | "shipped" | "delivered" | "cancelled" | "returned" | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "partially_refunded" | "cod_pending";
export type B2BStatus = "pending" | "approved" | "declined" | "suspended";
export type AffiliateStatus = "pending" | "active" | "suspended" | "rejected";
export type WithdrawalStatus = "pending" | "approved" | "rejected" | "paid";
export type MediaType = "image" | "video" | "model_3d" | "document";

export type Product = {
  id: string; slug: string; name: string; brand?: string; description: string;
  shortDescription?: string; category: string; subcategory?: string;
  price: number; mrp?: number; discount?: number; stock: number;
  lowStockThreshold?: number; image: string; thumbnail?: string; video?: string;
  active: boolean; visible?: boolean; featured?: boolean; homepageVisible?: boolean;
  benefits?: string[]; ingredients?: string; usage?: string; safetyInfo?: string;
  tags?: string; searchKeywords?: string; seoTitle?: string; seoDescription?: string;
  seoOgImage?: string; altText?: string;
  rating?: number; reviewCount?: number; createdAt: string; updatedAt?: string;
};

export type CartLine = { productId: string; quantity: number };
export type User = { id: string; email: string; name: string; role: Role; createdAt: string; phone?: string; avatar?: string; };
export type AuthUser = User & { passwordHash: string; };
export type ShippingDetails = { fullName: string; email: string; phone: string; address: string; city: string; state: string; pincode: string };
export type Order = {
  id: string; userId: string; status: OrderStatus; paymentStatus?: PaymentStatus;
  paymentMethod?: string; paymentId?: string; subtotal: number; discount?: number;
  couponCode?: string; shippingFee?: number; tax?: number; total: number;
  trackingCode?: string; shipping?: ShippingDetails | Json; notes?: string;
  lines: CartLine[]; createdAt: string; updatedAt?: string;
};
export type BlogPost = {
  id: string; slug: string; title: string; excerpt: string; body: string;
  content?: string; category?: string; tags?: string; author?: string;
  readTime?: string; image?: string; images?: string; videoUrl?: string;
  videoTitle?: string; featured?: boolean;
  seoTitle?: string; seoDescription?: string; ogImage?: string;
  published: boolean; visible?: boolean;
  createdAt: string; updatedAt?: string;
};
export type SiteContent = { key: string; value: unknown; updatedAt: string };
export type ContactMessage = { id: string; name: string; email: string; subject: string; message: string; createdAt: string; };
export type B2BApplication = {
  id: string; company: string; name: string; email: string; phone?: string;
  type: string; message?: string; status: B2BStatus; reviewedBy?: string;
  reviewedAt?: string; notes?: string; createdAt: string;
};
export type Review = { id: string; productId: string; userId: string; rating: number; title: string; body: string; images?: string; videoUrl?: string; verified?: boolean; visible?: boolean; helpful?: number; createdAt: string; };
export type ProductVariant = { id: string; productId: string; name: string; sku?: string; price: number; mrp?: number; stock: number; image?: string; active: boolean; sort: number; };
export type ProductSpec = { id: string; productId: string; name: string; value: string; sort: number; };
export type ProductVideo = { id: string; productId: string; title?: string; url: string; posterUrl?: string; description?: string; sort: number; active: boolean; };
export type ProductAPlusSection = { id: string; productId: string; type: string; title?: string; heading?: string; body?: string; imageUrl?: string; imageAlt?: string; content?: Record<string, unknown>; sort: number; active: boolean; };
export type ProductQA = { id: string; productId: string; userId?: string; question: string; answer?: string; answeredBy?: string; visible: boolean; createdAt: string; };
export type ProductImage = { id: string; productId: string; url: string; alt?: string; sort: number; };
export type Employee = { id: string; name: string; employeeId?: string; designation?: string; department?: string; photo?: string; phone?: string; email?: string; bio?: string; slug: string; active: boolean; };
export type Doctor = { id: string; name: string; email: string; phone?: string; clinic?: string; specialty?: string; qualification?: string; regNumber?: string; status: string; };
export type Notification = { id: string; userId: string; title: string; body: string; type?: string; read: boolean; createdAt: string; };
export type Address = { id: string; userId: string; label: string; fullName: string; phone: string; address: string; city: string; state: string; pincode: string; isDefault: boolean; };
export type Coupon = {
  id: string; code: string; type: string; discount: number; minOrder: number;
  maxDiscount?: number; startDate?: string; expiryDate?: string;
  usageLimit?: number; usedCount: number; perUserLimit: number; isActive: boolean;
  createdAt: string;
};
export type Affiliate = {
  id: string; userId: string; affiliateCode: string; status: AffiliateStatus;
  commissionRate: number; level: number; totalSales: number;
  totalCommission: number; pendingCommission: number; approvedCommission: number;
  withdrawnCommission: number; wallet: number; customCoupon?: string;
  createdAt: string;
};
export type Distributor = {
  id: string; userId?: string; company: string; contactName: string;
  email: string; phone?: string; address?: string; city?: string; state?: string;
  gstNumber?: string; status: B2BStatus; pricingTier?: string;
  creditLimit: number; createdAt: string;
};
export type Media = {
  id: string; filename: string; type: MediaType; url: string;
  mimeType?: string; size?: number; alt?: string; title?: string;
  usedBy?: string; visible: boolean; createdAt: string;
};
export type Banner = {
  id: string; title: string; subtitle?: string; imageUrl: string;
  linkUrl?: string; position: string; sort: number; active: boolean;
  visible: boolean; startDate?: string; endDate?: string;
};
export type FAQ = { id: string; question: string; answer: string; category?: string; sort: number; visible: boolean; };
export type Testimonial = { id: string; name: string; title?: string; body: string; rating?: number; image?: string; visible: boolean; sort: number; };
export type Setting = { key: string; value: unknown; group: string; };
export type SiteSettings = { siteTitle?: string; siteDescription?: string; ogTitle?: string; ogDescription?: string; ogImage?: string; primaryColor?: string; accentColor?: string; [key: string]: unknown; };
export type Offer = { id: string; title: string; description?: string; type: string; discount?: number; imageUrl?: string; linkUrl?: string; active: boolean; visible: boolean; };
// Keep Json alias for backward compat
type Json = Record<string, unknown>;
