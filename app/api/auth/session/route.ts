import { NextRequest, NextResponse } from "next/server";
import { getSessionSecret, SESSION_COOKIE } from "../../../../lib/session";

type WorkspaceSession = {
  authenticated: boolean;
  provider?: "google";
  email?: string;
  role?: string;
  expiresAt?: number;
};

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

async function readWorkspaceSession(value: string | undefined, secret: string | undefined): Promise<WorkspaceSession> {
  if (!value || !secret || !value.startsWith("google:")) return { authenticated: false };
  const [provider, email, role, expiresAt, signature] = value.split(":");
  if (provider !== "google" || !email || !role || !expiresAt || !signature) return { authenticated: false };

  const expires = Number(expiresAt);
  if (!Number.isFinite(expires) || expires < Date.now()) return { authenticated: false };

  const expected = await sign(`${provider}:${email}:${role}:${expiresAt}`, secret);
  if (!constantTimeEqual(signature, expected)) return { authenticated: false };

  return {
    authenticated: true,
    provider: "google",
    email,
    role,
    expiresAt: expires,
  };
}

export async function GET(request: NextRequest) {
  const session = await readWorkspaceSession(request.cookies.get(SESSION_COOKIE)?.value, getSessionSecret());
  return NextResponse.json(session, {
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
