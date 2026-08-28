import { createHmac, timingSafeEqual } from "crypto";

export async function createRazorpayOrder(receipt:string, amount:number) {
  const keyId=process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, secret=process.env.RAZORPAY_KEY_SECRET;
  if(!keyId||!secret) return { mode:"local" as const, id:`order_local_${receipt}`, amount, currency:"INR" };
  const authorization=Buffer.from(`${keyId}:${secret}`).toString("base64");
  const response=await fetch("https://api.razorpay.com/v1/orders",{method:"POST",headers:{Authorization:`Basic ${authorization}`,"Content-Type":"application/json"},body:JSON.stringify({amount,currency:"INR",receipt,payment_capture:1,notes:{orderId:receipt}})});
  if(!response.ok) throw new Error("Payment provider could not create an order.");
  const order=await response.json() as {id:string;amount:number;currency:string}; return { mode:"razorpay" as const, ...order, key:keyId };
}
export function verifyWebhook(raw:string, signature:string|null) { const secret=process.env.RAZORPAY_WEBHOOK_SECRET; if(!secret||!signature)return false; const expected=createHmac("sha256",secret).update(raw).digest("hex"); return expected.length===signature.length&&timingSafeEqual(Buffer.from(expected),Buffer.from(signature)); }
