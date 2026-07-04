import type { Metadata } from "next";
import { StatCard } from "../../components/ward-report/StatCard";
import { ProgressBars } from "../../components/ward-report/ProgressBars";
import { DonutChart } from "../../components/ward-report/DonutChart";
import { SpendingChart } from "../../components/ward-report/SpendingChart";
import { TreesChart } from "../../components/ward-report/TreesChart";
import { SectionHeading } from "../../components/ward-report/SectionHeading";
import { ImagePlaceholder } from "../../components/ward-report/ImagePlaceholder";
import { QRPlaceholder } from "../../components/ward-report/QRPlaceholder";
import { PrintButton } from "../../components/ward-report/PrintButton";
import { CouncilMark } from "../../components/ward-report/CouncilMark";
import { QuotePanel } from "../../components/ward-report/QuotePanel";
import { EmbedAutoHeight } from "../../components/ward-report/EmbedAutoHeight";
import {
  edition,
  quarterlySnapshot,
  agendaProgress,
  legislativeReportCard,
  visionForOrange,
  citywideAlignment,
  citywideAlignmentNote,
  spendingTargets,
  spendingNote,
  treesPlanted,
  eventsSponsored,
  outreachStats,
  communityMeetings,
  closingSpread,
  ctaFooter,
  type LegislationRecord,
} from "../../lib/ward-report-data";

export const metadata: Metadata = {
  title: `Ward Report — ${edition.season} ${edition.year} · ${edition.quarter}`,
};

function statusClasses(status: LegislationRecord["status"]) {
  switch (status) {
    case "Passed":
      return "bg-navy-900 text-cream-50";
    case "In Committee":
      return "border border-gold-500 bg-gold-300/20 text-gold-700";
    case "Introduced":
    default:
      return "bg-cream-200 text-navy-600";
  }
}

export default function WardReportPage() {
  return (
    <main className="min-h-screen bg-cream-100 py-10 print:bg-white print:py-0">
      <EmbedAutoHeight />
      <div className="mx-auto max-w-report px-4 sm:px-8 print:px-0">
        {/* Utility bar (screen only) */}
        <div className="print:hidden mb-4 flex justify-end">
          <PrintButton />
        </div>

        {/* ================= COVER HERO ================= */}
        <section className="break-inside-avoid overflow-hidden rounded-2xl bg-navy-900 text-cream-50 shadow-panel">
          <div className="flex flex-col items-center gap-4 px-6 pb-10 pt-12 text-center sm:px-12">
            <span className="rounded-full bg-gold-500 px-4 py-1 text-xs font-bold uppercase tracking-[0.3em] text-navy-900">
              {edition.season} {edition.year} · {edition.quarter} Edition
            </span>
            <CouncilMark className="h-20 w-20 sm:h-24 sm:w-24" />
            <h1 className="font-sans text-5xl font-extrabold uppercase tracking-wide text-white sm:text-6xl">
              {edition.councilMember}
            </h1>
            <p className="text-sm font-bold uppercase tracking-[0.4em] text-gold-400 sm:text-base">
              City Council
            </p>
            <p className="max-w-md font-serif text-lg italic text-cream-200">
              Building a stronger {edition.wardName}, block by block.
            </p>
            <div className="mt-2 h-px w-24 bg-gold-500" />
            <p className="text-xs uppercase tracking-[0.3em] text-cream-300/80">{edition.tagline}</p>
          </div>
          <div className="grid gap-6 border-t border-navy-700/60 p-8 sm:grid-cols-[1fr_1.2fr] sm:p-10">
            <div className="flex flex-col justify-center gap-1 text-sm text-cream-300/90">
              <p className="font-semibold text-cream-50">{edition.title}</p>
              <p>
                {edition.wardName} · {edition.municipality}
              </p>
              <p className="text-xs text-cream-300/70">{edition.publishedLabel}</p>
            </div>
            <ImagePlaceholder
              label="Cover Photo — Council Member Ward in the Community"
              className="min-h-[10rem] border-gold-400/60 bg-navy-800 text-cream-100"
            />
          </div>
        </section>

        {/* ================= QUARTERLY SNAPSHOT ================= */}
        <section className="mt-12 print:break-before-page">
          <SectionHeading
            kicker="At A Glance"
            title="Quarterly Snapshot"
            description="A summary of constituent service, civic engagement, and program milestones this quarter."
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {quarterlySnapshot.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </section>

        {/* ================= AGENDA PROGRESS ================= */}
        <section className="mt-12 print:break-before-page">
          <SectionHeading
            kicker="Platform Tracker"
            title="Agenda Progress"
            description="Measuring progress against the five pillars of the South Ward platform."
          />
          <div className="break-inside-avoid rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card sm:p-8">
            <ProgressBars items={agendaProgress} />
          </div>
        </section>

        {/* ================= LEGISLATIVE REPORT CARD ================= */}
        <section className="mt-12 print:break-before-page">
          <SectionHeading
            kicker="On The Record"
            title="Legislative Report Card"
            description="Key ordinances and resolutions sponsored, co-sponsored, or voted on this quarter."
          />
          <div className="flex flex-col gap-3">
            {legislativeReportCard.map((item) => (
              <div
                key={item.title}
                className="break-inside-avoid flex flex-col gap-3 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-serif text-base font-bold text-navy-900">{item.title}</p>
                  <p className="mt-1 text-sm text-navy-600">{item.summary}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClasses(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-700">
                    {item.vote}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= VISION FOR ORANGE ================= */}
        <section className="mt-12 print:break-before-page">
          <SectionHeading
            kicker="Looking Ahead"
            title="Vision for Orange"
            description="The priorities guiding our office's work over the next term."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visionForOrange.map((pillar) => (
              <div
                key={pillar.title}
                className="break-inside-avoid rounded-xl border border-navy-800 bg-navy-900 p-5 text-cream-50 shadow-card"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-xl">
                  <span aria-hidden="true">{pillar.icon}</span>
                </div>
                <p className="mt-3 font-serif text-lg font-bold">{pillar.title}</p>
                <p className="mt-1 text-sm text-cream-300/90">{pillar.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ================= CITYWIDE LEGISLATIVE SNAPSHOT ================= */}
        <section className="mt-12 print:break-before-page">
          <SectionHeading
            kicker="Citywide Context"
            title="Citywide Legislative Snapshot"
            description="How often this office's votes aligned with the full council on citywide measures."
          />
          <div className="break-inside-avoid rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card sm:p-8">
            <DonutChart data={citywideAlignment} centerLabel="Council Alignment" centerValue="92%" />
            <p className="mt-6 text-xs text-navy-500">{citywideAlignmentNote}</p>
          </div>
        </section>

        {/* ================= SPENDING TARGETS ================= */}
        <section className="mt-12 print:break-before-page">
          <SectionHeading
            kicker="Budget Priorities"
            title="Spending Targets"
            description="Requested allocation of South Ward capital and discretionary funds for FY2025."
          />
          <div className="break-inside-avoid rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card sm:p-8">
            <SpendingChart data={spendingTargets} />
            <p className="mt-6 text-xs text-navy-500">{spendingNote}</p>
          </div>
        </section>

        {/* ================= TREES PLANTED ================= */}
        <section className="mt-12 print:break-before-page">
          <SectionHeading
            kicker="Green Orange Initiative"
            title="Trees Planted"
            description="Cumulative canopy growth from our office's urban forestry partnership."
          />
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="break-inside-avoid rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card sm:p-8">
              <TreesChart data={treesPlanted} />
            </div>
            <StatCard
              icon="🌳"
              value={`${treesPlanted[treesPlanted.length - 1].trees}`}
              label="Trees Planted This Quarter"
              subtitle={`Since ${treesPlanted[0].period}: +${
                treesPlanted[treesPlanted.length - 1].trees - treesPlanted[0].trees
              } trees`}
              variant="navy"
            />
          </div>
        </section>

        {/* ================= EVENTS SPONSORED ================= */}
        <section className="mt-12 print:break-before-page">
          <SectionHeading
            kicker="In The Community"
            title="Events Sponsored"
            description="Programming this office hosted or supported for South Ward residents."
          />
          <div className="grid gap-5 sm:grid-cols-2">
            {eventsSponsored.map((event) => (
              <div
                key={event.name}
                className="break-inside-avoid flex flex-col gap-3 rounded-xl border border-cream-300 bg-cream-50 p-5 shadow-card"
              >
                <ImagePlaceholder label={`${event.name} — Photo`} />
                <div>
                  <p className="font-serif text-base font-bold text-navy-900">{event.name}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gold-600">
                    {event.date} · {event.attendees}
                  </p>
                  <p className="mt-2 text-sm text-navy-600">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= OUTREACH ================= */}
        <section className="mt-12 print:break-before-page">
          <SectionHeading
            kicker="Listening & Responding"
            title="Outreach"
            description="How our office reached and heard from residents this quarter."
          />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {outreachStats.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </section>

        {/* ================= COMMUNITY MEETING SCHEDULE ================= */}
        <section className="mt-12 print:break-before-page">
          <SectionHeading
            kicker="Save The Date"
            title="Community Meeting Schedule"
            description="Upcoming opportunities to meet with Council Member Ward and neighbors."
          />
          <div className="break-inside-avoid overflow-hidden rounded-xl border border-cream-300 bg-cream-50 shadow-card">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-navy-900 text-cream-50">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Time</th>
                  <th className="px-5 py-3 font-semibold">Meeting</th>
                  <th className="px-5 py-3 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody>
                {communityMeetings.map((meeting, idx) => (
                  <tr
                    key={`${meeting.date}-${meeting.title}`}
                    className={idx % 2 === 0 ? "bg-cream-50" : "bg-cream-100"}
                  >
                    <td className="px-5 py-3 font-semibold text-navy-900">{meeting.date}</td>
                    <td className="px-5 py-3 text-navy-700">{meeting.time}</td>
                    <td className="px-5 py-3 text-navy-700">{meeting.title}</td>
                    <td className="px-5 py-3 text-navy-700">{meeting.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ================= FINAL SPREAD / CLOSING NOTE ================= */}
        <section className="mt-12 print:break-before-page">
          <SectionHeading kicker="Closing Note" title={closingSpread.heading} />
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="break-inside-avoid rounded-xl border border-cream-300 bg-cream-50 p-6 shadow-card sm:p-8">
              <p className="text-sm leading-relaxed text-navy-700">{closingSpread.message}</p>
              <p className="mt-6 whitespace-pre-line font-serif text-base font-semibold text-navy-900">
                {closingSpread.signOff}
              </p>
            </div>
            <QuotePanel quote={closingSpread.quote} attribution={closingSpread.quoteAttribution} />
          </div>
        </section>

        {/* ================= CTA FOOTER ================= */}
        <section className="mt-12 print:break-before-page">
          <div className="break-inside-avoid rounded-2xl bg-navy-900 p-8 text-cream-50 shadow-panel sm:p-12">
            <div className="grid gap-10 md:grid-cols-[1.2fr_1fr]">
              <div>
                <h2 className="font-serif text-2xl font-bold sm:text-3xl">{ctaFooter.heading}</h2>
                <p className="mt-3 max-w-md text-sm text-cream-300/90">{ctaFooter.subtext}</p>
                <div className="mt-6 flex flex-col gap-2 text-sm">
                  <p>
                    <span className="font-semibold text-gold-400">Email:</span> {ctaFooter.email}
                  </p>
                  <p>
                    <span className="font-semibold text-gold-400">Phone:</span> {ctaFooter.phone}
                  </p>
                  <p>
                    <span className="font-semibold text-gold-400">Web:</span> {ctaFooter.website}
                  </p>
                  <p>
                    <span className="font-semibold text-gold-400">Office:</span> {ctaFooter.officeAddress}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 sm:justify-items-center">
                {ctaFooter.qrCodes.map((qr) => (
                  <QRPlaceholder key={qr.label} label={qr.label} variant="navy" />
                ))}
              </div>
            </div>
            <div className="mt-8 border-t border-cream-100/10 pt-6 text-center">
              <p className="text-sm font-bold uppercase tracking-[0.35em] text-gold-400">{edition.tagline}</p>
              <p className="mt-3 text-xs text-cream-300/70">
                Paid for by Friends of James Ward. {edition.season} {edition.year} {edition.quarter} edition —
                distributed to {edition.wardName} households and available online.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
