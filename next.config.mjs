/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Everything except /ward-report (and its sub-paths) keeps the
        // strict, non-embeddable posture — this covers the private,
        // authenticated WardOS dashboard. The lookahead requires an exact
        // "ward-report" segment (not just a path that happens to start with
        // that string) so it can't accidentally swallow some future
        // /ward-report-archive route or similar.
        source: "/:path((?!ward-report(?:/|$)).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://unpkg.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https: http://localhost:8000 http://127.0.0.1:8000",
              "font-src 'self' data: https:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
      {
        // /ward-report is a public, unauthenticated page meant to be embedded
        // via iframe on jw4o.com (Squarespace) at jw4o.com/wardreport, so it
        // needs its own, narrower frame-ancestors allowlist instead of the
        // site-wide DENY above. X-Frame-Options is intentionally omitted here
        // (frame-ancestors supersedes it in modern browsers, and the two
        // can't both be scoped to different allowlists at once).
        source: "/ward-report/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://unpkg.com",
              "style-src 'self' 'unsafe-inline' https://unpkg.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https: http://localhost:8000 http://127.0.0.1:8000",
              "font-src 'self' data: https:",
              "frame-ancestors https://jw4o.com https://www.jw4o.com",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async rewrites() {
    const apiUrl = process.env.WARDOS_API_URL;
    if (!apiUrl) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl.replace(/\/$/, "")}/:path*`,
      },
    ];
  },
};

export default nextConfig;
