import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_WORKSPACE_DOMAIN, GOOGLE_OAUTH_STATE_COOKIE } from "../../../../../lib/google-auth";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const workspaceDomain = process.env.GOOGLE_WORKSPACE_DOMAIN?.trim() || DEFAULT_WORKSPACE_DOMAIN;
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const nextPath = safeNextPath(request.nextUrl.searchParams.get("next"));

  if (!clientId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "google_config");
    loginUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const state = crypto.randomUUID();
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("hd", workspaceDomain);
  authUrl.searchParams.set("prompt", "select_account");

  const response = NextResponse.redirect(authUrl);
  response.cookies.set({
    name: GOOGLE_OAUTH_STATE_COOKIE,
    value: `${state}.${encodeURIComponent(nextPath)}`,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 10 * 60,
    path: "/",
  });
  return response;
}
