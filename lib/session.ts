import type { NextRequest } from "next/server";

export const SESSION_COOKIE = "wardos_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

function textToBytes(value: string) {
  return new TextEncoder().encode(value);
}

function bytesToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(value: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    textToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, textToBytes(value));
  return bytesToHex(signature);
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}

export async function createSessionValue(secret: string) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const signature = await sign(String(expiresAt), secret);
  return `${expiresAt}.${signature}`;
}

export async function createWorkspaceSessionValue(email: string, secret: string, role = "staff") {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const subject = email.toLowerCase();
  const normalizedRole = role.toLowerCase();
  const unsignedValue = `google:${subject}:${normalizedRole}:${expiresAt}`;
  const signature = await sign(unsignedValue, secret);
  return `${unsignedValue}:${signature}`;
}

function sessionSecret() {
  const dedicatedSecret = process.env.WARDOS_AUTH_SECRET?.trim();
  if (process.env.NODE_ENV === "production") return dedicatedSecret;
  return dedicatedSecret || process.env.WARDOS_SITE_PASSWORD?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();
}

export async function isValidSessionValue(value: string | undefined, secret: string | undefined) {
  if (!value || !secret) return false;

  if (value.startsWith("google:")) {
    const parts = value.split(":");
    if (parts.length === 4) {
      const [provider, email, expiresAt, signature] = parts;
      if (provider !== "google" || !email || !expiresAt || !signature) return false;
      const expires = Number(expiresAt);
      if (!Number.isFinite(expires) || expires < Date.now()) return false;
      const expected = await sign(`${provider}:${email}:${expiresAt}`, secret);
      return constantTimeEqual(signature, expected);
    }

    const [provider, email, role, expiresAt, signature] = parts;
    if (provider !== "google" || !email || !role || !expiresAt || !signature) return false;
    const expires = Number(expiresAt);
    if (!Number.isFinite(expires) || expires < Date.now()) return false;
    const expected = await sign(`${provider}:${email}:${role}:${expiresAt}`, secret);
    return constantTimeEqual(signature, expected);
  }

  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature) return false;
  const expires = Number(expiresAt);
  if (!Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = await sign(expiresAt, secret);
  return constantTimeEqual(signature, expected);
}

export async function hasValidSession(request: NextRequest) {
  const value = request.cookies.get(SESSION_COOKIE)?.value;
  const primarySecret = sessionSecret();
  if (await isValidSessionValue(value, primarySecret)) return true;
  if (process.env.NODE_ENV === "production") return false;
  return isValidSessionValue(value, process.env.WARDOS_SITE_PASSWORD?.trim());
}

export function getSessionSecret() {
  return sessionSecret();
}
