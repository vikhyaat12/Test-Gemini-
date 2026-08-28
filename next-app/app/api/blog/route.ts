import { json, requireUser, safeText } from "@/lib/http";
import { store } from "@/lib/commerce/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const featured = searchParams.get("featured");
  const user = await requireUser();
  const posts = await store.posts.list(user?.role === "admin");

  let filtered = posts;
  if (category && category !== "all") {
    filtered = filtered.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.tags?.toLowerCase().includes(q)
    );
  }
  if (featured === "true") {
    filtered = filtered.filter((p) => p.featured);
  }
  return json({ posts: filtered });
}

export async function POST(request: Request) {
  if (!await requireUser(["admin"])) return json({ error: "Unauthorized" }, 401);
  const b = await request.json().catch(() => null);
  const title = safeText(b?.title, 180);
  const slug = safeText(b?.slug, 160).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  if (!title || !slug) return json({ error: "Title and slug are required." }, 422);

  const post = await store.posts.save({
    title,
    slug,
    excerpt: safeText(b?.excerpt, 320),
    body: safeText(b?.body, 50000),
    content: b?.content,
    category: b?.category || undefined,
    tags: b?.tags || undefined,
    author: b?.author || undefined,
    readTime: b?.readTime || undefined,
    image: b?.image || undefined,
    images: b?.images || undefined,
    videoUrl: b?.videoUrl || undefined,
    videoTitle: b?.videoTitle || undefined,
    featured: Boolean(b?.featured),
    seoTitle: b?.seoTitle || undefined,
    seoDescription: b?.seoDescription || undefined,
    ogImage: b?.ogImage || undefined,
    published: Boolean(b?.published),
  });
  return json({ post }, 201);
}
