import type { Metadata } from "next";
import { SectionHeading } from "../../../components/ward-report/SectionHeading";
import { StatCard } from "../../../components/ward-report/StatCard";
import { ProgressBars } from "../../../components/ward-report/ProgressBars";
import { DonutChart } from "../../../components/ward-report/DonutChart";
import { SpendingChart } from "../../../components/ward-report/SpendingChart";
import { TreesChart } from "../../../components/ward-report/TreesChart";
import { QRPlaceholder } from "../../../components/ward-report/QRPlaceholder";
import { ImagePlaceholder } from "../../../components/ward-report/ImagePlaceholder";
import { QuotePanel } from "../../../components/ward-report/QuotePanel";
import { CouncilMark } from "../../../components/ward-report/CouncilMark";
import { PrintButton } from "../../../components/ward-report/PrintButton";
import {
  colorScales,
  chartPalette,
  fontFamilies,
  typeScale,
  shadows,
  radii,
  layoutTokens,
  principles,
  type ColorScale,
} from "../../../lib/ward-report-design-tokens";
import {
  agendaProgress,
  citywideAlignment,
  spendingTargets,
  treesPlanted,
} from "../../../lib/ward-report-data";

export const metadata: Metadata = {
  title: "Ward Report — Design System",
  description: "The civic newsletter design language: tokens, type, and components.",
};

/** A titled block within the guide; reuses the report's own SectionHeading. */
function Block({
  kicker,
  title,
  description,
  children,
}: {
  kicker: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <SectionHeading kicker={kicker} title={title} description={description} />
      {children}
    </section>
  );
}

/** A labeled example cell so every component demo is self-describing. */
function Demo({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="break-inside-avoid rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
      <div className="mb-4 flex flex-col gap-0.5">
        <span className="font-mono text-xs font-bold text-navy-900">{label}</span>
        {note ? <span className="text-xs text-navy-500">{note}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Swatch({ token, hex, dark, usage }: ColorScale["steps"][number]) {
  return (
    <div className="overflow-hidden rounded-lg border border-cream-300 bg-cream-50 shadow-card">
      <div
        className="flex h-16 items-end justify-end p-2"
        style={{ backgroundColor: hex }}
      >
        <span className={`font-mono text-[10px] ${dark ? "text-cream-100/80" : "text-navy-700/80"}`}>{hex}</span>
      </div>
      <div className="px-2.5 py-2">
        <div className="font-mono text-xs font-bold text-navy-900">{token}</div>
        {usage ? <div className="mt-0.5 text-[11px] leading-snug text-navy-500">{usage}</div> : null}
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-cream-100 py-10 print:bg-white print:py-0">
      <div className="mx-auto max-w-report px-4 sm:px-8 print:px-0">
        <div className="print:hidden mb-4 flex justify-end">
          <PrintButton />
        </div>

        {/* ===== Masthead ===== */}
        <header className="break-inside-avoid overflow-hidden rounded-2xl bg-navy-900 text-cream-50 shadow-panel">
          <div className="flex flex-col items-center gap-4 px-6 pb-10 pt-12 text-center sm:px-12">
            <span className="rounded-full bg-gold-500 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-navy-900">
              Design System
            </span>
            <CouncilMark className="h-16 w-16" />
            <h1 className="font-sans text-4xl font-extrabold uppercase tracking-wide text-white sm:text-5xl">
              The Ward Report
            </h1>
            <p className="text-sm font-bold uppercase tracking-[0.35em] text-gold-400">Civic Brand Language</p>
            <p className="max-w-lg font-serif text-lg italic text-cream-200">
              One navy-cream-gold system for an official, print-ready public-sector publication.
            </p>
          </div>
        </header>

        {/* ===== Principles ===== */}
        <Block
          kicker="Foundations"
          title="Design Principles"
          description="The decisions every part of this system is built to serve."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map((p) => (
              <div
                key={p.title}
                className="break-inside-avoid rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card"
              >
                <p className="font-serif text-lg font-bold text-navy-900">{p.title}</p>
                <p className="mt-1 text-sm text-navy-600">{p.body}</p>
              </div>
            ))}
          </div>
        </Block>

        {/* ===== Color ===== */}
        <Block
          kicker="Tokens"
          title="Color"
          description="Three families. Navy for structure, cream for paper, gold for accent — each a full Tailwind scale."
        >
          <div className="flex flex-col gap-8">
            {colorScales.map((scale) => (
              <div key={scale.name} className="break-inside-avoid">
                <h3 className="font-sans text-lg font-extrabold uppercase tracking-wide text-navy-900">
                  {scale.name}
                </h3>
                <p className="mb-3 max-w-2xl text-sm text-navy-600">{scale.description}</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                  {scale.steps.map((step) => (
                    <Swatch key={step.token} {...step} />
                  ))}
                </div>
              </div>
            ))}

            {/* Chart palette */}
            <div className="break-inside-avoid">
              <h3 className="font-sans text-lg font-extrabold uppercase tracking-wide text-navy-900">
                Chart Palette
              </h3>
              <p className="mb-3 max-w-2xl text-sm text-navy-600">
                The ordered sequence charts draw from — navy-forward, one gold highlight, cream tail.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {chartPalette.map((c) => (
                  <div key={c.token} className="overflow-hidden rounded-lg border border-cream-300 shadow-card">
                    <div className="h-12" style={{ backgroundColor: c.hex }} />
                    <div className="bg-cream-50 px-2.5 py-2">
                      <div className="text-xs font-bold text-navy-900">{c.label}</div>
                      <div className="font-mono text-[11px] text-navy-500">{c.token}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Block>

        {/* ===== Typography ===== */}
        <Block
          kicker="Tokens"
          title="Typography"
          description="System-font stacks only — no paid or hosted fonts, so print and offline render identically."
        >
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-cream-300 bg-cream-50 p-4 shadow-card">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">Display · Serif</div>
              <p className="mt-1 text-sm text-navy-600">{fontFamilies.display}</p>
            </div>
            <div className="rounded-xl border border-cream-300 bg-cream-50 p-4 shadow-card">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">Body / UI · Sans</div>
              <p className="mt-1 text-sm text-navy-600">{fontFamilies.body}</p>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-cream-300 overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card">
            {typeScale.map((t) => (
              <div key={t.role} className="grid gap-3 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <div className={`${t.classes} truncate`}>{t.sample}</div>
                  <div className="mt-1 text-xs text-navy-500">{t.usage}</div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-sm font-bold text-navy-900">{t.role}</div>
                  <div className="font-mono text-xs text-navy-500">{t.spec}</div>
                </div>
              </div>
            ))}
          </div>
        </Block>

        {/* ===== Elevation & Shape ===== */}
        <Block
          kicker="Tokens"
          title="Elevation & Shape"
          description="Soft, low shadows and generous radii keep the report feeling like printed stock, not glossy UI."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 font-sans text-sm font-extrabold uppercase tracking-wide text-navy-700">
                Shadows
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {shadows.map((s) => (
                  <div key={s.token} className="rounded-xl bg-cream-50 p-5" style={{ boxShadow: s.value }}>
                    <div className="font-mono text-xs font-bold text-navy-900">{s.token}</div>
                    <div className="mt-1 text-xs text-navy-500">{s.usage}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-3 font-sans text-sm font-extrabold uppercase tracking-wide text-navy-700">
                Corner Radii
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {radii.map((r) => (
                  <div key={r.token} className="flex flex-col items-center gap-2 text-center">
                    <div className={`h-16 w-full border-2 border-navy-900 bg-navy-100 ${r.token}`} />
                    <div>
                      <div className="font-mono text-xs font-bold text-navy-900">{r.token}</div>
                      <div className="text-[11px] text-navy-500">
                        {r.px} · {r.usage}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Block>

        {/* ===== Iconography & Badges ===== */}
        <Block
          kicker="Elements"
          title="Marks & Badges"
          description="A small kit of repeating civic marks that tie the pages together."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Demo label="<CouncilMark />" note="Gold seal — cover only">
              <div className="flex justify-center rounded-lg bg-navy-900 py-6">
                <CouncilMark className="h-20 w-20" />
              </div>
            </Demo>
            <Demo label="Icon badge" note="Circular, gold or navy">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900 text-lg text-cream-50">
                  🏛️
                </span>
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-lg text-navy-900">
                  🌳
                </span>
              </div>
            </Demo>
            <Demo label="Kicker + bullet" note="Above every heading">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 bg-gold-500" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-gold-600">On The Record</span>
              </div>
              <div className="mt-2 h-1 w-16 rounded-full bg-gold-500" />
            </Demo>
            <Demo label="Pills" note="Status & vote tags">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-navy-900 px-3 py-1 text-xs font-bold text-cream-50">Passed</span>
                <span className="rounded-full border border-gold-500 bg-gold-300/20 px-3 py-1 text-xs font-bold text-gold-700">
                  In Committee
                </span>
                <span className="rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-700">
                  Sponsored
                </span>
              </div>
            </Demo>
          </div>
        </Block>

        {/* ===== Components ===== */}
        <Block
          kicker="Library"
          title="Components"
          description="Every building block of the report, shown live. These are the exact components the report renders."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <Demo label="<StatCard variant='cream' />" note="Dashboard stat tile">
              <StatCard icon="📋" value="38" label="Constituent Cases Resolved" subtitle="Up 12% from Q4 2024" />
            </Demo>
            <Demo label="<StatCard variant='navy' />" note="Inverted emphasis tile">
              <StatCard icon="🌳" value="312" label="Trees Planted This Quarter" subtitle="Since Q2 2024: +132" variant="navy" />
            </Demo>

            <Demo label="<ProgressBars />" note="Agenda progress">
              <ProgressBars items={agendaProgress.slice(0, 3)} />
            </Demo>
            <Demo label="<QuotePanel />" note="Closing-spread pull quote">
              <QuotePanel
                quote="Every block deserves the same investment."
                attribution="James Ward, Council Member"
              />
            </Demo>

            <Demo label="<DonutChart />" note="Alignment donut w/ center label">
              <DonutChart data={citywideAlignment} centerLabel="Council Alignment" centerValue="92%" />
            </Demo>
            <Demo label="<SpendingChart />" note="Budget breakdown donut">
              <SpendingChart data={spendingTargets} />
            </Demo>

            <Demo label="<TreesChart />" note="Quarterly bar chart">
              <TreesChart data={treesPlanted} />
            </Demo>
            <Demo label="Placeholders" note="Swap for real assets later">
              <div className="flex flex-col gap-4">
                <ImagePlaceholder label="Event Photo" />
                <div className="flex gap-4">
                  <QRPlaceholder label="Scan to RSVP" />
                  <div className="rounded-lg bg-navy-900 p-4">
                    <QRPlaceholder label="On navy" variant="navy" />
                  </div>
                </div>
              </div>
            </Demo>
          </div>
        </Block>

        {/* ===== Layout & Print ===== */}
        <Block
          kicker="Rules"
          title="Layout & Print"
          description="How the pieces sit on the page — and how they survive a trip to PDF."
        >
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { k: "Column width", v: layoutTokens.maxWidth },
              { k: "Spacing rhythm", v: layoutTokens.sectionRhythm },
              { k: "Print behavior", v: layoutTokens.print },
            ].map((row) => (
              <div key={row.k} className="rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-gold-600">{row.k}</div>
                <p className="mt-2 text-sm text-navy-600">{row.v}</p>
              </div>
            ))}
          </div>
        </Block>

        <footer className="mt-14 break-inside-avoid rounded-2xl bg-navy-900 p-8 text-center text-cream-50 shadow-panel">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-gold-400">
            Transparency. Accountability. Results.
          </p>
          <p className="mt-3 text-xs text-cream-300/70">
            Ward Report Design System · tokens in <span className="font-mono">lib/ward-report-design-tokens.ts</span> ·
            components in <span className="font-mono">components/ward-report/</span>
          </p>
        </footer>
      </div>
    </main>
  );
}
