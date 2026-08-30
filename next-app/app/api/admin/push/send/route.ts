import { json, requireUser } from "@/lib/http";
import { pushSubscriptionStore, pushHistoryStore } from "@/lib/commerce/store-extensions";
import crypto from "crypto";

const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@queenscare.in";

/**
 * Encrypt a payload for Web Push using VAPID authentication.
 * Uses the Web Push encryption protocol (RFC 8291).
 */
function encryptPayload(
  userPublicKey: string,
  userAuth: string,
  payload: Buffer
): { encrypted: Buffer; salt: Buffer; localPublicKey: Buffer; dhSecret: Buffer } {
  // Decode base64url keys
  const pubKeyBuf = Buffer.from(userPublicKey, "base64url");
  const authBuf = Buffer.from(userAuth, "base64url");

  // Generate local ECDH key pair
  const localECDH = crypto.createECDH("prime256v1");
  const localPrivateKey = localECDH.generateKeys();
  const localPublicKey = localECDH.getPublicKey();

  // Derive shared secret
  const sharedSecret = localECDH.computeSecret(pubKeyBuf);

  // Generate random salt
  const salt = crypto.randomBytes(16);

  // Derive encryption key using HKDF
  const prk = crypto
    .createHmac("sha256", authBuf)
    .update(sharedSecret)
    .digest();

  const info = Buffer.alloc(0);
  const ikm = hkdfExpand(prk, "WebPush: info", Buffer.concat([localPublicKey, pubKeyBuf]), 32);

  const aesKey = hkdfExpand(prk, "aes128gcm", salt, 16);
  const iv = hkdfExpand(prk, "iv", salt, 12);

  // Encrypt with AES-128-GCM
  const cipher = crypto.createCipheriv("aes-128-gcm", aesKey, iv);
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Build the encrypted payload: salt(16) + rs(4) + idlen(1) + keyid(65) + encrypted + tag(16)
  const record = Buffer.concat([
    salt,
    Buffer.from([0, 0, 0, 0]), // rs = 0 (no record size limit for single record)
    Buffer.from([65]), // keyid length = 65 (uncompressed public key)
    localPublicKey,
    encrypted,
    authTag,
  ]);

  return { encrypted: record, salt, localPublicKey, dhSecret: ikm };
}

function hkdfExtract(salt: Buffer, ikm: Buffer): Buffer {
  return crypto.createHmac("sha256", salt).update(ikm).digest();
}

function hkdfExpand(prk: Buffer, info: string, outputBuffer: Buffer, length: number): Buffer {
  const infoBuffer = Buffer.from(info, "utf8");
  const infoWithLabel = Buffer.concat([infoBuffer, Buffer.from([0])]);
  
  let result = Buffer.alloc(0);
  let previous = Buffer.alloc(0);
  const iterations = Math.ceil(length / 32);
  
  for (let i = 0; i < iterations; i++) {
    const hmac = crypto.createHmac("sha256", prk);
    hmac.update(previous);
    hmac.update(infoWithLabel);
    hmac.update(Buffer.from([i + 1]));
    previous = hmac.digest();
    result = Buffer.concat([result, previous]);
  }
  
  return result.subarray(0, length);
}

async function sendWebPush(
  subscription: Record<string, unknown>,
  payload: string
): Promise<{ success: boolean; status?: number; error?: string }> {
  const endpoint = String(subscription.endpoint);
  const keys = subscription.keys as Record<string, string> | undefined;

  if (!keys?.p256dh || !keys?.auth) {
    return { success: false, error: "Missing subscription keys" };
  }

  if (!VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
    return { success: false, error: "VAPID keys not configured" };
  }

  try {
    const payloadBuffer = Buffer.from(payload, "utf8");
    const { encrypted } = encryptPayload(keys.p256dh, keys.auth, payloadBuffer);

    // Create VAPID JWT for authorization
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ typ: "JWT", alg: "ES256" })).toString("base64url");
    const claims = Buffer.from(JSON.stringify({
      aud: new URL(endpoint).origin,
      exp: now + 43200, // 12 hours
      sub: VAPID_SUBJECT,
    })).toString("base64url");

    const signingInput = `${header}.${claims}`;
    const ecdh = crypto.createECDH("prime256v1");
    
    // Decode the private key
    const privKeyRaw = Buffer.from(VAPID_PRIVATE_KEY, "base64url");
    ecdh.setPrivateKey(privKeyRaw);
    
    const sig = crypto.sign("sha256", Buffer.from(signingInput), {
      key: ecdh.getPrivateKey(),
      format: "der",
      type: "pkcs8",
    }).toString("base64url");
    
    const jwt = `${signingInput}.${sig}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "Content-Length": String(encrypted.length),
        "Authorization": `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`,
      },
      body: new Uint8Array(encrypted),
    });

    if (response.status === 410 || response.status === 404) {
      // Subscription expired
      await pushSubscriptionStore.deactivate(endpoint);
      return { success: false, status: response.status, error: "Subscription expired" };
    }

    return { success: response.ok || response.status === 201, status: response.status };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function POST(request: Request) {
  const user = await requireUser(["admin"]);
  if (!user) return json({ error: "Unauthorized" }, 401);

  if (!VAPID_PRIVATE_KEY) {
    return json({
      error: "Push notifications are not configured. Set VAPID_PRIVATE_KEY in .env.local.",
      setup: {
        step1: "Add VAPID keys to .env.local (already done for dev)",
        step2: "Restart the dev server",
        step3: "Open the website and allow notifications",
      }
    }, 503);
  }

  try {
    const body = await request.json();
    const { title, message, url, icon, image, tag, sendTest, testEndpoint } = body;

    if (!title || !message) {
      return json({ error: "Title and message are required" }, 400);
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url: url || "/",
      icon: icon || undefined,
      image: image || undefined,
      tag: tag || "queens-care-notification",
    });

    // Create notification history record
    const historyRecord = await pushHistoryStore.create({
      title,
      message,
      url: url || "/",
      icon,
      image,
      tag,
      status: "sending",
      sentCount: 0,
      failedCount: 0,
      expiredCount: 0,
      sentBy: user.id || user.email,
      createdAt: new Date().toISOString(),
    });

    let subscriptions = await pushSubscriptionStore.active();

    // Test mode: only send to the specific endpoint
    if (sendTest && testEndpoint) {
      subscriptions = subscriptions.filter((s) => s.endpoint === testEndpoint);
    }

    let sentCount = 0;
    let failedCount = 0;
    let expiredCount = 0;

    for (const sub of subscriptions) {
      const result = await sendWebPush(sub, payload);
      if (result.success) {
        sentCount++;
      } else if (result.status === 410) {
        expiredCount++;
      } else {
        failedCount++;
      }
    }

    // Update history record
    await pushHistoryStore.update(historyRecord.id as string, {
      status: failedCount === 0 ? "sent" : expiredCount === subscriptions.length ? "failed" : "partially_sent",
      sentCount,
      failedCount,
      expiredCount,
      totalSubscribers: subscriptions.length,
      sentAt: new Date().toISOString(),
    });

    return json({
      ok: true,
      historyId: historyRecord.id,
      sentCount,
      failedCount,
      expiredCount,
      totalSubscribers: subscriptions.length,
    });
  } catch (err) {
    console.error("Push send error:", err);
    return json({ error: "Failed to send notification" }, 500);
  }
}
