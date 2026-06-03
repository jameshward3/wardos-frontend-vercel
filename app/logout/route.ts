import { NextResponse } from "next/server";
import { GOOGLE_OAUTH_STATE_COOKIE } from "../../lib/google-auth";
import { SESSION_COOKIE } from "../../lib/session";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  response.cookies.set({
    name: GOOGLE_OAUTH_STATE_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
