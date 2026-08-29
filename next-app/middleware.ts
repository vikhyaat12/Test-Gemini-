import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge-safe perimeter for truly private admin-only routes.
// B2B, doctors, employee, and recommendations pages handle their own
// authentication/authorization internally — they are NOT blocked at the
// middleware level because they may have public-facing sections
// (e.g. B2B info page, doctor info page, employee QR profiles).
const PRIVATE_PREFIXES = ["/admin", "/analytics"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isPublicAdmin = pathname === "/admin/login";

  // If unauthenticated access to private admin routes, redirect specifically to /admin/login
  if (isPrivate && !isPublicAdmin && !request.cookies.get("qc_session")?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?redirect=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();

  // If ?ref= is present in query parameters, capture the affiliate referral code in a 30-day cookie
  const ref = searchParams.get("ref");
  if (ref && ref.trim()) {
    response.cookies.set("qc_affiliate_ref", ref.trim().toUpperCase(), {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
      sameSite: "lax",
      httpOnly: false,
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
