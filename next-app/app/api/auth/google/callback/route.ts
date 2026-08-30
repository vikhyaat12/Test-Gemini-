import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signSession, hashPassword } from "@/lib/auth";
import { fileDb } from "@/lib/commerce/file-db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!code || !clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/account?error=google_not_configured", siteUrl));
  }

  try {
    // Exchange authorization code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
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

    // Find or create user with Prisma + fileDb fallback
    let user: Record<string, unknown> | null = null;
    try {
      user = await prisma.user.findFirst({ where: { googleId: googleUser.id } }) as Record<string, unknown> | null;
      if (!user) {
        user = await prisma.user.findUnique({ where: { email: googleUser.email } }) as Record<string, unknown> | null;
        if (user) {
          user = await prisma.user.update({
            where: { id: String(user.id) },
            data: { googleId: googleUser.id, emailVerified: true, avatar: googleUser.picture || null },
          }) as Record<string, unknown>;
        } else {
          user = await prisma.user.create({
            data: {
              email: googleUser.email,
              name: googleUser.name || googleUser.email.split("@")[0],
              role: "customer",
              googleId: googleUser.id,
              emailVerified: true,
              avatar: googleUser.picture || null,
              passwordHash: await hashPassword("google-oauth-" + Date.now()),
            },
          }) as Record<string, unknown>;
        }
      }
    } catch {
      // fileDb fallback
      user = fileDb.findOne("users", (u) => u.googleId === googleUser.id || u.email === googleUser.email);
      if (user) {
        user = fileDb.update("users", String(user.id), {
          googleId: googleUser.id,
          name: googleUser.name || user.name,
          avatar: googleUser.picture || user.avatar,
        });
      } else {
        user = fileDb.insert("users", {
          id: `usr-${Date.now().toString(36)}`,
          email: googleUser.email,
          name: googleUser.name || googleUser.email.split("@")[0],
          role: "customer",
          googleId: googleUser.id,
          avatar: googleUser.picture || null,
          passwordHash: await hashPassword("google-oauth-" + Date.now()),
        });
      }
    }

    if (!user) {
      return NextResponse.redirect(new URL("/account?error=google_user_failed", siteUrl));
    }

    // Create session
    const response = NextResponse.redirect(new URL("/account", siteUrl));
    response.cookies.set("qc_session", signSession({
      id: String(user.id),
      name: String(user.name || "Customer"),
      email: String(user.email),
      role: String(user.role || "customer"),
      createdAt: String(user.createdAt || new Date().toISOString()),
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 604800,
    });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/account?error=google_auth_failed", siteUrl));
  }
}

