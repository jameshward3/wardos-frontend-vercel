import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "../../../lib/rate-limit";
import { createSessionValue, SESSION_COOKIE, SESSION_TTL_SECONDS } from "../../../lib/session";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function POST(request: NextRequest) {
  const password = process.env.WARDOS_SITE_PASSWORD?.trim();
  const formData = await request.formData();
  const submittedPassword = String(formData.get("password") || "").trim();
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));
  const forwardedFor = request.headers.get("x-forwarded-for") || "";
  const clientIp = forwardedFor.split(",")[0]?.trim() || "unknown";
  const rateLimit = checkRateLimit(`login:${clientIp}`, Number(process.env.WARDOS_LOGIN_RATE_LIMIT || 10), 60_000);
  if (!rateLimit.allowed) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "1");
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl, { status: 303, headers: { "Retry-After": "60" } });
  }

  if (!password || submittedPassword !== password) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "1");
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), { status: 303 });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: await createSessionValue(password),
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
    path: "/",
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
