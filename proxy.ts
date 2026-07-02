import { NextRequest, NextResponse } from "next/server";
import { hasValidSession } from "./lib/session";

const PUBLIC_PATHS = ["/login", "/logout", "/api/login", "/api/auth/google", "/api/voter-intel", "/voter-intel"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuthenticated = await hasValidSession(request);
  const responseHeaders = new Headers({
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
    "Cache-Control": pathname.startsWith("/api/auth/session") ? "no-store" : "private, no-store",
  });

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
