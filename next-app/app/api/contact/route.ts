import { json, safeText } from "@/lib/http";
import { store } from "@/lib/commerce/store";
export async function POST(request: Request) {
  const b = await request.json().catch(() => null);
  const name = safeText(b?.name, 80), email = safeText(b?.email, 120), subject = safeText(b?.subject, 160), message = safeText(b?.message, 4000);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) return json({ error: "Please complete the required fields." }, 422);
  return json({ message: await store.contacts.create({ name, email, subject, message }) }, 201);
}

