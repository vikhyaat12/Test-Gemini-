import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, hashPassword } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/account?error=google_auth_failed", siteUrl));
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: `${siteUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.redirect(new URL("/account?error=google_token_failed", siteUrl));

    // Get user info from Google
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userRes.json();
    if (!googleUser.email) return NextResponse.redirect(new URL("/account?error=google_user_failed", siteUrl));

    // Find or create user
    let user = await prisma.user.findFirst({ where: { googleId: googleUser.id } });
    if (!user) {
      user = await prisma.user.findUnique({ where: { email: googleUser.email } });
      if (user) {
        // Link Google account to existing user
        user = await prisma.user.update({ where: { id: user.id }, data: { googleId: googleUser.id, emailVerified: true, avatar: googleUser.picture || null } });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: googleUser.email, name: googleUser.name || googleUser.email.split("@")[0],
            role: "customer", googleId: googleUser.id, emailVerified: true,
            avatar: googleUser.picture || null, passwordHash: await hashPassword("google-oauth-" + Date.now()),
          },
        });
      }
    }

    // Create session
    const response = NextResponse.redirect(new URL("/account", siteUrl));
    response.cookies.set("qc_session", signSession({ id: user.id, name: user.name, email: user.email, role: user.role, createdAt: "" }), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 604800,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/account?error=google_auth_failed", siteUrl));
  }
}
