import { NextResponse } from "next/server";
import { affiliateStore } from "@/lib/commerce/store-extensions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
  const userAgent = request.headers.get("user-agent") || undefined;
  const referer = request.headers.get("referer") || undefined;

  const resolved = await affiliateStore.byRef(code);

  let destination = "/";

  if (resolved?.link?.url) {
    destination = String(resolved.link.url);
  }

  const redirectUrl = new URL(destination, request.url);

  const response = NextResponse.redirect(redirectUrl);

  if (resolved?.affiliate) {
    // Record click event
    await affiliateStore.recordClick(
      resolved.link ? String(resolved.link.id) : null,
      String(resolved.affiliate.id),
      ip,
      userAgent,
      referer
    ).catch(() => {});

    // Set affiliate attribution cookies (30 days)
    const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
    response.cookies.set("qc_affiliate_ref", String(resolved.affiliate.affiliateCode), {
      maxAge,
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });

    if (resolved.link) {
      response.cookies.set("qc_affiliate_link_id", String(resolved.link.id), {
        maxAge,
        path: "/",
        sameSite: "lax",
        httpOnly: false,
      });
    }
  }

  return response;
}
