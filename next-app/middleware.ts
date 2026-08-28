import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge-safe perimeter for truly private admin-only routes.
// B2B, doctors, employee, and recommendations pages handle their own
// authentication/authorization internally — they are NOT blocked at the
// middleware level because they may have public-facing sections
// (e.g. B2B info page, doctor info page, employee QR profiles).
const PRIVATE_PREFIXES = ["/admin", "/analytics"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivate = PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!isPrivate) return NextResponse.next();

  if (request.cookies.get("qc_session")?.value) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/account";
  url.search = `?redirect=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/analytics/:path*"],
};
