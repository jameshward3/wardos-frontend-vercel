import { NextRequest, NextResponse } from "next/server";
import { createSessionValue, SESSION_COOKIE, SESSION_TTL_SECONDS } from "../../../lib/session";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function POST(request: NextRequest) {
  const password = process.env.WARDOS_SITE_PASSWORD;
  const formData = await request.formData();
  const submittedPassword = String(formData.get("password") || "");
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));

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
  return response;
}
