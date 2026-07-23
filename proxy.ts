import { NextRequest, NextResponse } from "next/server";
import { hasValidSession } from "./lib/session";

const PUBLIC_PATHS = [
  "/login",
  "/logout",
  "/app.js",
  "/assets",
  "/api/auth/google",
  "/api/voter-intel",
  "/voter-intel",
  "/ward-report",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLocalPasswordLogin = process.env.NODE_ENV !== "production" && pathname === "/api/login";
  const isPublicPath =
    isLocalPasswordLogin || PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuthenticated = await hasValidSession(request);
  // /ward-report is a public newsletter meant to be iframe-embedded on
  // jw4o.com (Squarespace); next.config.mjs already scopes its
  // frame-ancestors CSP to that use, but this proxy unconditionally set
  // X-Frame-Options: DENY on every response, which would silently override
  // that and keep blocking the embed. It also gets a cacheable Cache-Control
  // instead of "private, no-store" since it's public, non-personalized
  // content that may see real traffic via the embed.
  const isWardReport = pathname === "/ward-report" || pathname.startsWith("/ward-report/");
  const responseHeaders = new Headers({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
    "Cache-Control": pathname.startsWith("/api/auth/session")
      ? "no-store"
      : isWardReport
        ? "public, max-age=60, stale-while-revalidate=300"
        : "private, no-store",
  });
  if (!isWardReport) {
    responseHeaders.set("X-Frame-Options", "DENY");
  }

  if (pathname === "/login" && isAuthenticated) {
    const response = NextResponse.redirect(new URL("/dashboard", request.url));
    responseHeaders.forEach((value, key) => response.headers.set(key, value));
    return response;
  }

  if (!isPublicPath && !isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ detail: "Authentication required" }, { status: 401, headers: responseHeaders });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    responseHeaders.forEach((value, key) => response.headers.set(key, value));
    return response;
  }

  const response = NextResponse.next();
  responseHeaders.forEach((value, key) => response.headers.set(key, value));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
