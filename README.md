# WardOS Vercel Frontend

Private Next.js frontend for WardOS, intended to run at:

```text
https://wardos.jw4o.com
```

The public `https://jw4o.com` site stays on Squarespace. Do not migrate, replace, or change the root domain website. Only configure the `wardos` subdomain.

## What This Includes

- Next.js app router frontend
- `/login` page with password field
- Google Workspace login restricted to `jameswardfororange.com`
- Protected WardOS routes
- Signed secure HTTP-only session cookie
- Logout route
- Eight-hour session expiration
- Vercel deployment setup
- Squarespace DNS instructions
- `.env.example` with auth variables

## Protected Pages

The middleware protects these routes:

```text
/
/dashboard
/briefing
/constituents
/media-monitor
/legislation
/budget
/development
/public-safety
/settings
```

`/login`, `/logout`, and the Google OAuth callback routes remain public so users can sign in and out.

## Environment Variable

Create these variables in Vercel:

```env
WARDOS_SITE_PASSWORD=
WARDOS_AUTH_SECRET=
WARDOS_API_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_WORKSPACE_DOMAIN=jameswardfororange.com
WARDOS_GOOGLE_ROLE_MAP={"james@jameswardfororange.com":"admin","manager@jameswardfororange.com":"strategy_advisor"}
WARDOS_CASE_LOG_REPO=
WARDOS_CASE_LOG_TOKEN=
WARDOS_CASE_LOG_BRANCH=main
WARDOS_CASE_LOG_PATH=data/constituent_cases.csv
WARDOS_EVENT_LOG_REPO=
WARDOS_EVENT_LOG_TOKEN=
WARDOS_EVENT_LOG_BRANCH=main
WARDOS_EVENT_LOG_PATH=data/events.csv
```

Do not hardcode passwords or OAuth secrets in the repo.

`WARDOS_SITE_PASSWORD` remains as an emergency fallback. `WARDOS_AUTH_SECRET` signs Google Workspace sessions; use a long random value.

`WARDOS_API_URL` is required if the Vercel site should save and read shared dashboard data. Point it to the reachable WardOS FastAPI base URL, without a trailing slash. If this is blank, the Vercel frontend can still render, but dashboard data calls to `/api` will not reach the Mac mini backend.

## Persistent Constituent Cases

WardOS supports two persistent paths for constituent cases:

- Local Mac mini server: cases live in Postgres and an Excel-readable CSV is generated at `/app/data/exports/constituent_cases.csv`.
- Hosted Vercel fallback: cases can live in a private GitHub CSV file so rebuilds, refreshes, and server restarts do not erase them.

For hosted persistence, create a private GitHub repository or use an existing private data repository, then add these Vercel environment variables:

```env
WARDOS_CASE_LOG_REPO=jameshward3/your-private-data-repo
WARDOS_CASE_LOG_TOKEN=github-token-with-contents-read-write
WARDOS_CASE_LOG_BRANCH=main
WARDOS_CASE_LOG_PATH=data/constituent_cases.csv
```

The token only needs repository contents read/write access for the private case-log repository. Do not commit the token or case CSV into this frontend repo.

After those variables are set, new constituent needs submitted through WardOS are written to the GitHub CSV log and remain available between Vercel builds. If these variables are missing, the hosted fallback uses temporary storage and case entries may disappear after a rebuild.

Download the Excel-readable hosted case log while signed in:

```text
https://wardos.jw4o.com/api/cases/export.csv
```

Manual events can use the same private data repository. If `WARDOS_EVENT_LOG_REPO` and `WARDOS_EVENT_LOG_TOKEN` are blank, WardOS falls back to `WARDOS_CASE_LOG_REPO` and `WARDOS_CASE_LOG_TOKEN`, writing events to:

```env
WARDOS_EVENT_LOG_PATH=data/events.csv
```

Set separate `WARDOS_EVENT_LOG_*` values only if you want events stored in a different private repository or path.

## Google Workspace Login

Create an OAuth client in Google Cloud for the `jameswardfororange.com` Workspace:

1. Open Google Cloud Console.
2. Create or select a project for WardOS.
3. Configure the OAuth consent screen for internal Workspace use where available.
4. Create an OAuth 2.0 Client ID for a Web application.
5. Add this authorized redirect URI:

```text
https://wardos.jw4o.com/api/auth/google/callback
```

6. Copy the Client ID and Client Secret into Vercel as:

```text
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

7. Set:

```text
GOOGLE_WORKSPACE_DOMAIN=jameswardfororange.com
```

WardOS verifies the Google ID token server-side, requires a verified `jameswardfororange.com` email, and then checks that email against the WardOS role map.

Production Google Cloud settings:

```text
Application type: Web application
Authorized JavaScript origin: https://wardos.jw4o.com
Authorized redirect URI: https://wardos.jw4o.com/api/auth/google/callback
Allowed Workspace domain: jameswardfororange.com
Scopes: openid, email, profile
```

Production role map:

```text
james@jameswardfororange.com -> admin
manager@jameswardfororange.com -> strategy_advisor
```

Set the same map in Vercel as:

```env
WARDOS_GOOGLE_ROLE_MAP={"james@jameswardfororange.com":"admin","manager@jameswardfororange.com":"strategy_advisor"}
```

If `WARDOS_GOOGLE_ROLE_MAP` is blank, WardOS uses the same two-user default map above. Any other Google Workspace account in the domain is rejected until it is added to the role map.

## Local Development

```bash
cd wardos-frontend-vercel
cp .env.example .env.local
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Because the session cookie is marked `secure`, production testing should be done over HTTPS on Vercel.

## Deploying To Vercel

1. Push this repo to GitHub.
2. In Vercel, choose **Add New Project**.
3. Import the repository.
4. Set the project root directory to:

```text
wardos-frontend-vercel
```

5. Keep Framework Preset as **Next.js**.
6. Add these environment variables:

```text
WARDOS_SITE_PASSWORD=your-private-password
WARDOS_AUTH_SECRET=long-random-session-secret
WARDOS_API_URL=https://your-reachable-wardos-api.example.com
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_WORKSPACE_DOMAIN=jameswardfororange.com
WARDOS_GOOGLE_ROLE_MAP={"james@jameswardfororange.com":"admin","manager@jameswardfororange.com":"strategy_advisor"}
WARDOS_CASE_LOG_REPO=jameshward3/your-private-data-repo
WARDOS_CASE_LOG_TOKEN=github-token-with-contents-read-write
WARDOS_CASE_LOG_BRANCH=main
WARDOS_CASE_LOG_PATH=data/constituent_cases.csv
WARDOS_EVENT_LOG_PATH=data/events.csv
```

7. Deploy the project.

## Add `wardos.jw4o.com` In Vercel

1. Open the Vercel project.
2. Go to **Settings** -> **Domains**.
3. Add:

```text
wardos.jw4o.com
```

4. Vercel will show the DNS record it expects.
5. If Vercel gives a specific CNAME target, use Vercel's exact value.

Default Vercel CNAME target:

```text
cname.vercel-dns.com
```

## Squarespace DNS Setup

Squarespace manages DNS for `jw4o.com`, and the main website must remain on Squarespace.

Only add or edit the subdomain record for `wardos`.

In Squarespace:

1. Open the domain settings for `jw4o.com`.
2. Go to DNS settings.
3. Add this record:

```text
Type: CNAME
Host: wardos
Value: cname.vercel-dns.com
```

If Vercel provides a different CNAME target for `wardos.jw4o.com`, use Vercel's exact value instead of `cname.vercel-dns.com`.

Do not change these records unless Squarespace or your current website setup requires it:

- root `@`
- `www`
- Squarespace verification records
- existing email records
- MX records

## Testing The Protected Site

After DNS propagation:

1. Visit:

```text
https://wardos.jw4o.com
```

2. You should be redirected to:

```text
https://wardos.jw4o.com/login
```

3. Click **Continue with Google Workspace** and sign in with a `jameswardfororange.com` Google account.
4. Confirm you land on:

```text
https://wardos.jw4o.com/dashboard
```

5. Confirm the signed-in role endpoint returns your Workspace identity while signed in:

```text
https://wardos.jw4o.com/api/auth/session
```

Expected roles:

```text
james@jameswardfororange.com -> admin
manager@jameswardfororange.com -> strategy_advisor
```

Password fallback:

1. Visit `/login`.
2. Enter the password stored in Vercel as `WARDOS_SITE_PASSWORD`.
4. Confirm you land on:

```text
https://wardos.jw4o.com/dashboard
```

5. Open a protected page directly, such as:

```text
https://wardos.jw4o.com/media-monitor
```

It should load only while signed in.

6. Click **Log out**.
7. Confirm protected pages redirect back to `/login`.

## Media Monitor External Links

Full-story links use:

```html
target="_blank" rel="noopener noreferrer"
```

This keeps WardOS open while external stories open in a separate tab or window.

## Safety Notes

- WardOS is private and password protected.
- Google Workspace login is restricted to `jameswardfororange.com`.
- The fallback password is read from `WARDOS_SITE_PASSWORD`.
- Sessions use signed HTTP-only cookies.
- Sessions expire after eight hours.
- The frontend does not auto-send emails or publish posts.
- The Squarespace root site at `jw4o.com` remains untouched.
