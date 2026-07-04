# Ward Report

A print-ready quarterly newsletter page for Council Member James Ward
(South Ward, City of Orange Township). Built with Next.js App Router,
TypeScript, Tailwind CSS, and Recharts.

Live route: **`/ward-report`** (served from this app, e.g.
`https://wardos.jw4o.com/ward-report`).

Design system / living style guide: **`/ward-report/design-system`** — see
[Design system](#design-system) below.

**Public URL is `jw4o.com/wardreport`, not this app's domain.** The root
`jw4o.com` domain runs on Squarespace and stays there — this Next.js route is
embedded into a Squarespace page via iframe rather than the domain being
repointed. See [Publishing to jw4o.com/wardreport](#publishing-to-jw4ocomwardreport) below.

## Running it

This page lives inside the existing `wardos-frontend-vercel` app, so it
shares that app's install/dev commands. From `wardos-frontend-vercel/`:

```bash
pnpm install     # installs recharts, tailwindcss, postcss, autoprefixer
                 # (added to package.json for this feature)
pnpm dev
```

Then open `http://localhost:3000/ward-report`.

For a production build:

```bash
pnpm build
pnpm start
```

### Exporting to PDF

Click the **"Print / Save as PDF"** button in the top-right of the page
(hidden automatically in print output), or use your browser's native
Print dialog (`Cmd/Ctrl+P`) and choose "Save as PDF". The stylesheet
already:

- Switches to a plain white background and letter-size pages (`@page` in
  `ward-report.css`).
- Forces navy/gold panel backgrounds to actually print
  (`print-color-adjust: exact`).
- Inserts a page break before each major section
  (`print:break-before-page`) and keeps cards/tables from splitting
  across a page break (`break-inside-avoid`).
- Hides the on-screen-only print button (`print:hidden`).

No print plugin or headless-browser step is required — it's designed to
look correct straight out of `Cmd/Ctrl+P`.

## Folder structure

```
app/ward-report/
  page.tsx           # assembles every section of the report
  layout.tsx          # route-scoped metadata + imports ward-report.css
  ward-report.css      # Tailwind entrypoint + print rules (scoped to this route)
  README.md            # this file

components/ward-report/
  StatCard.tsx          # icon + value + label (+ optional subtitle) stat tile
  ProgressBars.tsx       # horizontal progress bars for Agenda Progress
  DonutChart.tsx          # Recharts donut for citywide legislative alignment
  SpendingChart.tsx        # Recharts donut for the budget/spending breakdown
  TreesChart.tsx             # Recharts bar chart for trees planted per quarter
  SectionHeading.tsx          # navy all-caps section header + gold kicker/bar
  ImagePlaceholder.tsx         # dashed placeholder box for photos
  QRPlaceholder.tsx             # boxed/cornered mock QR block for the CTA footer
  PrintButton.tsx                 # "Print / Save as PDF" button (client component)
  CouncilMark.tsx                   # gold circular seal used on the cover masthead
  QuotePanel.tsx                     # navy pull-quote panel for the closing spread

lib/ward-report-data.ts   # all copy + numbers for the report, in one file
```

## Where to update things

Everything editable lives in **`lib/ward-report-data.ts`** — no component
files should need to change for a routine quarterly update:

| To change...                          | Edit this export in `ward-report-data.ts` |
| -------------------------------------- | ------------------------------------------ |
| Edition label ("Spring 2025 · Q1"), council member name/title, footer/cover tagline | `edition` |
| Cover + "At A Glance" stat tiles       | `quarterlySnapshot` |
| Agenda Progress bars & percentages    | `agendaProgress` |
| Legislative Report Card entries       | `legislativeReportCard` |
| "Vision for Orange" pillars           | `visionForOrange` |
| Citywide alignment donut (92/6/2)     | `citywideAlignment`, `citywideAlignmentNote` |
| Spending Targets donut                | `spendingTargets`, `spendingNote` |
| Trees Planted bar chart                | `treesPlanted` |
| Events Sponsored cards                | `eventsSponsored` |
| Outreach stat tiles                   | `outreachStats` |
| Community Meeting Schedule table      | `communityMeetings` |
| Closing spread message, sign-off, and pull quote | `closingSpread` |
| CTA footer contact info + QR labels   | `ctaFooter` |

Notes:

- **Photos**: replace `<ImagePlaceholder label="..." />` usages in
  `page.tsx` with a real `next/image` (or `<img>`) once photography is
  ready — the dashed placeholder is intentionally a drop-in target.
- **QR codes**: `QRPlaceholder` renders a mock grid, not a real QR code.
  Generate real codes (e.g. with a `qrcode` npm package or an external
  generator) pointing at the URLs in `ctaFooter.qrCodes`, export them as
  images, and swap them in where `<QRPlaceholder />` is used in the CTA
  footer section of `page.tsx`.
- **Dates**: `edition.publishedLabel` and every date field in
  `eventsSponsored` / `communityMeetings` are plain strings — update them
  each quarter along with the edition label.
- **Colors/fonts**: the navy/cream/gold palette and system-font stack are
  defined once in `tailwind.config.ts` (`theme.extend.colors`, `theme.extend.fontFamily`).
  Adjust the palette there and it propagates everywhere.

## Design notes

- Tailwind is scoped to this route only (`tailwind.config.ts` `content`
  globs only include `app/ward-report`, `components/ward-report`, and
  `lib/ward-report-*.{ts,tsx}`), so the rest of the WardOS dashboard — which
  uses its own hand-written dark theme in `app/globals.css` — is
  unaffected.
- No external font files or paid font services are used; headings use a
  system serif stack (Georgia/Cambria/Times) and body text uses the
  system sans-serif stack, satisfying the CSP (`style-src`/`font-src`)
  already configured in `next.config.mjs`.
- All charts (`DonutChart`, `SpendingChart`, `TreesChart`) are client
  components (`"use client"`) since Recharts needs the browser; `page.tsx`
  itself stays a server component.

## Design system

The Ward Report's visual language is packaged as a small, self-documenting
design system so it can be reused for future civic pages, not just this
report.

- **Tokens** live in [`lib/ward-report-design-tokens.ts`](../../lib/ward-report-design-tokens.ts):
  the navy / cream / gold color scales, the chart palette, the type scale,
  shadow + radius tokens, layout rules, and the brand principles — all as
  plain exported data.
- **The living style guide** is a page at **`/ward-report/design-system`**
  ([`app/ward-report/design-system/page.tsx`](design-system/page.tsx)). It
  renders directly from those tokens and shows every component **live** (the
  same `StatCard`, `ProgressBars`, `DonutChart`, etc. the report uses), so
  the guide can never drift from the real UI. Open it in the browser or print
  it like any other page.

Source-of-truth note: the actual Tailwind utility classes are generated from
the theme in [`tailwind.config.ts`](../../tailwind.config.ts). The token file
**mirrors** those values for documentation and for driving the style guide —
if you change a brand color, update it in **both** places (there's a comment
in the token file saying so). The color scale, spacing, and font stacks are
the knobs; everything else is composed from them.

To extend the system: add or edit a token in `ward-report-design-tokens.ts`
(and the matching `tailwind.config.ts` value if it's a new color/scale step),
then the `/ward-report/design-system` page picks it up automatically for the
token tables. New shared components go in `components/ward-report/` and can be
dropped into the "Components" gallery in the style-guide page.

## Publishing to jw4o.com/wardreport

`jw4o.com` is a Squarespace site and stays that way — this route does not
move or replace it. Instead, this page is deployed as part of this Next.js
app (Vercel) and **embedded into a Squarespace page via iframe** at the
`/wardreport` slug. `/ward-report` has no authentication, so it's safe to
expose publicly this way; the rest of the app (the private WardOS dashboard)
is unaffected and keeps its strict `X-Frame-Options: DENY` / `frame-ancestors
'none'` headers — see the two-block `headers()` config in `next.config.mjs`,
which carves out a narrower, `jw4o.com`-only `frame-ancestors` allowlist for
`/ward-report/:path*` only.

Steps, in Squarespace:

1. Add a new page, set its URL to `/wardreport`.
2. Add a **Code Block** (not a Markdown block) to that page with:

   ```html
   <iframe
     id="ward-report-frame"
     src="https://wardos.jw4o.com/ward-report"
     title="Ward Report — James Ward, South Ward Council Member"
     style="width: 100%; border: 0; display: block;"
     height="4000"
     scrolling="no"
   ></iframe>
   <script>
     window.addEventListener("message", function (event) {
       if (event.data && event.data.type === "ward-report:height") {
         var frame = document.getElementById("ward-report-frame");
         if (frame) frame.style.height = event.data.height + "px";
       }
     });
   </script>
   ```

   The `height="4000"` is just a fallback shown before the page finishes
   loading — [`EmbedAutoHeight.tsx`](../../components/ward-report/EmbedAutoHeight.tsx)
   posts the real content height from inside the report, and the script
   above resizes the iframe to match, so visitors never see a clipped
   report or a nested scrollbar.
3. Publish. `jw4o.com/wardreport` will now show the report; the address bar
   stays on `jw4o.com` even though the content is loaded from
   `wardos.jw4o.com`.

If this report is ever moved to a different host/domain than
`wardos.jw4o.com`, update both the `src` above and the `frame-ancestors`
value in `next.config.mjs` — they have to stay in sync or the embed will
either fail to load (CSP blocks it) or silently keep allowing an old,
possibly-wrong iframe source.
