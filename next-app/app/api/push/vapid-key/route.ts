import { json } from "@/lib/http";

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return json({ error: "Push notifications not configured" }, 503);
  }
  return json({ publicKey });
}
