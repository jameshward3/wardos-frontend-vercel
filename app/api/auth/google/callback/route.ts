import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_WORKSPACE_DOMAIN, GOOGLE_OAUTH_STATE_COOKIE } from "../../../../../lib/google-auth";
import { createWorkspaceSessionValue, getSessionSecret, SESSION_COOKIE, SESSION_TTL_SECONDS } from "../../../../../lib/session";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  id_token?: string;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  hd?: string;
  error?: string;
  error_description?: string;
};

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}

function loginRedirect(request: NextRequest, error: string, nextPath = "/dashboard") {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", error);
  loginUrl.searchParams.set("next", safeNextPath(nextPath));
  return NextResponse.redirect(loginUrl, { status: 303 });
}

function parseStateCookie(value: string | undefined) {
  if (!value) return null;
  const dotIndex = value.indexOf(".");
  if (dotIndex < 1) return null;
  return {
    state: value.slice(0, dotIndex),
    nextPath: safeNextPath(decodeURIComponent(value.slice(dotIndex + 1))),
  };
}

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const workspaceDomain = process.env.GOOGLE_WORKSPACE_DOMAIN?.trim() || DEFAULT_WORKSPACE_DOMAIN;
  const sessionSecret = getSessionSecret();
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const stateCookie = parseStateCookie(request.cookies.get(GOOGLE_OAUTH_STATE_COOKIE)?.value);
  const nextPath = stateCookie?.nextPath || "/dashboard";

  if (!clientId || !clientSecret || !sessionSecret) {
    return loginRedirect(request, "google_config", nextPath);
  }

  if (!code || !returnedState || !stateCookie || returnedState !== stateCookie.state) {
    return loginRedirect(request, "google_state", nextPath);
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: `${request.nextUrl.origin}/api/auth/google/callback`,
    }),
  });
  const tokenJson = (await tokenResponse.json()) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokenJson.id_token) {
    return loginRedirect(request, "google_token", nextPath);
  }

  const tokenInfoResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenJson.id_token)}`);
  const tokenInfo = (await tokenInfoResponse.json()) as GoogleTokenInfo;
  const email = tokenInfo.email?.toLowerCase() || "";
  const verified = tokenInfo.email_verified === true || tokenInfo.email_verified === "true";
  const hostedDomain = tokenInfo.hd?.toLowerCase();
  const allowedDomain = workspaceDomain.toLowerCase();
  const domainMatches = hostedDomain === allowedDomain || email.endsWith(`@${allowedDomain}`);

  if (!tokenInfoResponse.ok || tokenInfo.aud !== clientId || !verified || !domainMatches) {
    return loginRedirect(request, "workspace", nextPath);
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url), { status: 303 });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: await createWorkspaceSessionValue(email, sessionSecret),
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_TTL_SECONDS,
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
