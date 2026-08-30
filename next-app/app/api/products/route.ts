import { json, requireUser, safeText } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET(request: Request) {
  const products = await store.products.all();
  const url = new URL(request.url);
  // Admin requests with ?all=true see everything; public listings filter
  if (url.searchParams.get('all') === 'true') {
    return json({ products });
  }
  const visibleProducts = products.filter((p: Record<string, unknown>) => {
    if (p.active === false) return false;
    if (p.visible === false) return false;
    if (p.status === 'hidden') return false;
    return true;
  });
  return json({ products: visibleProducts });
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);
  const b = await request.json().catch(() => null);
  const name = safeText(b?.name, 120);
  const slug = safeText(b?.slug, 120).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const price = Number(b?.price), stock = Number(b?.stock);
  if (!name || !slug || !Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 0)
    return json({ error: "Invalid product details." }, 422);
  const product = await store.products.save({
    name, slug,
    description: safeText(b?.description, 2000),
    shortDescription: safeText(b?.shortDescription, 500),
    category: safeText(b?.category, 80) || "General",
    brand: safeText(b?.brand, 80) || "Queens Care",
    price, mrp: b?.mrp ? Number(b.mrp) : undefined,
    discount: b?.discount ? Number(b.discount) : undefined,
    stock,
    lowStockThreshold: b?.lowStockThreshold ? Number(b.lowStockThreshold) : 10,
    image: safeText(b?.image, 500),
    thumbnail: safeText(b?.thumbnail, 500),
    video: safeText(b?.video, 500),
    active: b?.active !== false,
    visible: b?.visible !== false,
    featured: !!b?.featured,
    homepageVisible: !!b?.homepageVisible,
    benefits: Array.isArray(b?.benefits) ? b.benefits : undefined,
    ingredients: safeText(b?.ingredients, 2000),
    usage: safeText(b?.usage, 2000),
    safetyInfo: safeText(b?.safetyInfo, 1000),
    tags: safeText(b?.tags, 500),
    searchKeywords: safeText(b?.searchKeywords, 500),
    seoTitle: safeText(b?.seoTitle, 200),
    seoDescription: safeText(b?.seoDescription, 500),
    altText: safeText(b?.altText, 200),
  });
  return json({ product }, 201);
}
