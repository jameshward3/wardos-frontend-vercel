# WardOS Vercel Frontend

Private Next.js frontend for WardOS, intended to run at:

```text
https://wardos.jw4o.com
```

The public `https://jw4o.com` site stays on Squarespace. Do not migrate, replace, or change the root domain website. Only configure the `wardos` subdomain.

## What This Includes

- Next.js app router frontend
- `/login` page with password field
- Protected WardOS routes
- Signed secure HTTP-only session cookie
- Logout route
- Eight-hour session expiration
- Vercel deployment setup
- Squarespace DNS instructions
- `.env.example` with `WARDOS_SITE_PASSWORD`

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
/settings
```

`/login` and `/logout` remain public so users can sign in and out.

## Environment Variable

Create a site password in Vercel:

```env
WARDOS_SITE_PASSWORD=
```

Do not hardcode this password in the repo.

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
6. Add this environment variable:

```text
WARDOS_SITE_PASSWORD=your-private-password
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

3. Enter the password stored in Vercel as `WARDOS_SITE_PASSWORD`.
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
- The password is read from `WARDOS_SITE_PASSWORD`.
- Sessions use signed HTTP-only cookies.
- Sessions expire after eight hours.
- The frontend does not auto-send emails or publish posts.
- The Squarespace root site at `jw4o.com` remains untouched.
