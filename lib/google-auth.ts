export const GOOGLE_OAUTH_STATE_COOKIE = "wardos_google_state";
export const DEFAULT_WORKSPACE_DOMAIN = "jameswardfororange.com";

export type WardOSRole = "admin" | "strategy_advisor";

export const DEFAULT_GOOGLE_ROLE_MAP: Record<string, WardOSRole> = {
  "james@jameswardfororange.com": "admin",
  "manager@jameswardfororange.com": "strategy_advisor",
};

export function getGoogleRoleMap() {
  const configuredMap = process.env.WARDOS_GOOGLE_ROLE_MAP?.trim();
  if (!configuredMap) return DEFAULT_GOOGLE_ROLE_MAP;

  try {
    const parsed = JSON.parse(configuredMap) as Record<string, string>;
    return Object.fromEntries(
      Object.entries(parsed)
        .filter(([, role]) => role === "admin" || role === "strategy_advisor")
        .map(([email, role]) => [email.toLowerCase(), role as WardOSRole]),
    );
  } catch {
    return DEFAULT_GOOGLE_ROLE_MAP;
  }
}

export function roleForGoogleEmail(email: string) {
  return getGoogleRoleMap()[email.toLowerCase()];
}
