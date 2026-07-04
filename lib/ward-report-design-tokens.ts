/**
 * Ward Report — Design System tokens.
 *
 * The visual language for the "Ward Report" civic newsletter brand
 * (City of Orange Township · James Ward, South Ward). This file is the
 * DOCUMENTED source of truth: the raw values here mirror the Tailwind theme
 * in `tailwind.config.ts` (which is what actually generates the utility
 * classes). If you change a brand color, change it in BOTH places.
 *
 * The living style guide at `/ward-report/design-system` is rendered
 * directly from these tokens, so anything you add here shows up there.
 */

export type ColorToken = {
  /** Tailwind token name, e.g. "navy-900". */
  token: string;
  hex: string;
  /** True when this swatch needs light text to stay legible. */
  dark?: boolean;
  /** Where this step is meant to be used. */
  usage?: string;
};

export type ColorScale = {
  name: string;
  description: string;
  steps: ColorToken[];
};

export const colorScales: ColorScale[] = [
  {
    name: "Navy",
    description:
      "The authority color — panels, cover, section headers, primary text. Deep and institutional.",
    steps: [
      { token: "navy-50", hex: "#eef1f6" },
      { token: "navy-100", hex: "#d7deea", usage: "Vote/status pill fills" },
      { token: "navy-200", hex: "#aebdd4" },
      { token: "navy-300", hex: "#8095b8", usage: "Chart accent, placeholder borders" },
      { token: "navy-400", hex: "#546f98" },
      { token: "navy-500", hex: "#385174", dark: true },
      { token: "navy-600", hex: "#293f5e", dark: true, usage: "Body / supporting text" },
      { token: "navy-700", hex: "#1d2e47", dark: true, usage: "Secondary text, borders" },
      { token: "navy-800", hex: "#141f33", dark: true },
      { token: "navy-900", hex: "#0b1626", dark: true, usage: "Panels, headlines, primary" },
      { token: "navy-950", hex: "#070f1a", dark: true },
    ],
  },
  {
    name: "Cream",
    description:
      "The paper. Warm off-white backgrounds and light text on navy. Keeps the report from feeling clinical.",
    steps: [
      { token: "cream-50", hex: "#fefdfb", usage: "Card surfaces" },
      { token: "cream-100", hex: "#faf6ea", usage: "Page background" },
      { token: "cream-200", hex: "#f4ecd6", usage: "Track fills, table stripe" },
      { token: "cream-300", hex: "#ece0c0", usage: "Card borders, chart tail slice" },
      { token: "cream-400", hex: "#e2d1a3" },
    ],
  },
  {
    name: "Gold",
    description:
      "The accent — the council mark, kickers, accent bars, key numbers. Use sparingly; it earns attention.",
    steps: [
      { token: "gold-300", hex: "#e8cd85" },
      { token: "gold-400", hex: "#dcb95f", usage: "Accent on navy (seal, links)" },
      { token: "gold-500", hex: "#c9a227", usage: "Primary accent — bars, bullets, seal" },
      { token: "gold-600", hex: "#a8841e", dark: true, usage: "Kickers / accent text on cream" },
      { token: "gold-700", hex: "#87681a", dark: true, usage: "Status text on light gold" },
    ],
  },
];

export type ChartColor = { label: string; hex: string; token: string };

/** Ordered palette used by the donut/bar charts. Navy-forward, gold highlight, cream tail. */
export const chartPalette: ChartColor[] = [
  { label: "Primary", hex: "#0b1626", token: "navy-900" },
  { label: "Secondary", hex: "#293f5e", token: "navy-600" },
  { label: "Accent", hex: "#c9a227", token: "gold-500" },
  { label: "Muted", hex: "#8095b8", token: "navy-300" },
  { label: "Tail", hex: "#ece0c0", token: "cream-300" },
];

export type TypeSpecimen = {
  role: string;
  sample: string;
  /** Tailwind classes that produce this style (also applied to the specimen). */
  classes: string;
  spec: string;
  usage: string;
};

export const fontFamilies = {
  display:
    'Georgia, Cambria, "Times New Roman", Times, serif — used for the masthead name, card titles, stat values, and pull quotes.',
  body:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif — used for section headers (all-caps), body copy, and UI.',
  note: "No paid or externally hosted fonts — system stacks only, so print/PDF/offline all render identically.",
};

export const typeScale: TypeSpecimen[] = [
  {
    role: "Masthead name",
    sample: "JAMES WARD",
    classes: "font-sans text-5xl font-extrabold uppercase tracking-wide text-navy-900",
    spec: "Sans · 48px · 800 · uppercase",
    usage: "Cover only — the single largest element on the page.",
  },
  {
    role: "Section header",
    sample: "QUARTERLY SNAPSHOT",
    classes: "font-sans text-3xl font-extrabold uppercase tracking-wide text-navy-900",
    spec: "Sans · 30px · 800 · uppercase",
    usage: "Every section title. Always paired with a gold kicker + bar.",
  },
  {
    role: "Kicker / eyebrow",
    sample: "AT A GLANCE",
    classes: "text-xs font-bold uppercase tracking-[0.25em] text-gold-600",
    spec: "Sans · 12px · 700 · 0.25em tracking",
    usage: "Sits above a section header, next to a gold square bullet.",
  },
  {
    role: "Card title",
    sample: "Complete Streets Update",
    classes: "font-serif text-lg font-bold text-navy-900",
    spec: "Serif · 18px · 700",
    usage: "Titles inside cards (events, legislation, vision).",
  },
  {
    role: "Stat value",
    sample: "3,400+",
    classes: "font-serif text-3xl font-bold text-navy-900",
    spec: "Serif · 30px · 700",
    usage: "The headline number on a StatCard.",
  },
  {
    role: "Body",
    sample: "A summary of constituent service and civic engagement this quarter.",
    classes: "text-sm text-navy-600",
    spec: "Sans · 14px · 400",
    usage: "Descriptions, supporting copy, table cells.",
  },
  {
    role: "Pull quote",
    sample: "“Every voice in the South Ward deserves to be heard.”",
    classes: "font-serif text-2xl italic text-navy-900",
    spec: "Serif · 24px · italic",
    usage: "The closing-spread QuotePanel.",
  },
  {
    role: "Caption / footnote",
    sample: "Based on 64 recorded council votes this quarter.",
    classes: "text-xs text-navy-500",
    spec: "Sans · 12px · 400",
    usage: "Chart notes, fine print, methodology.",
  },
];

export type ShadowToken = { token: string; value: string; usage: string };

export const shadows: ShadowToken[] = [
  {
    token: "shadow-card",
    value: "0 10px 30px -12px rgba(11, 22, 38, 0.25)",
    usage: "Standard cards, tables, chart panels.",
  },
  {
    token: "shadow-panel",
    value: "0 20px 45px -18px rgba(11, 22, 38, 0.45)",
    usage: "Hero cover and CTA/closing navy panels — the deepest elevation.",
  },
];

export type RadiusToken = { token: string; px: string; usage: string };

export const radii: RadiusToken[] = [
  { token: "rounded-lg", px: "8px", usage: "Placeholders, inner elements" },
  { token: "rounded-xl", px: "12px", usage: "Cards, tables, chart panels" },
  { token: "rounded-2xl", px: "16px", usage: "Hero cover & full-width panels" },
  { token: "rounded-full", px: "9999px", usage: "Icon badges, pills, accent bars" },
];

export const layoutTokens = {
  maxWidth: "1180px (max-w-report) — the magazine column width for the whole report.",
  sectionRhythm: "mt-12 (48px) between major sections; gap-4 (16px) within card grids.",
  print:
    "Each section gets print:break-before-page; cards use break-inside-avoid so nothing splits across a page. Colors are forced with print-color-adjust: exact.",
};

export type Principle = { title: string; body: string };

export const principles: Principle[] = [
  {
    title: "Official, not corporate",
    body: "This reads like a civic record, not a startup landing page. Serif display type, a seal, and restrained color signal public-sector credibility.",
  },
  {
    title: "Navy leads, gold accents",
    body: "Navy carries structure and authority; gold is reserved for what matters — the seal, section kickers, and headline numbers. Cream keeps it warm and readable.",
  },
  {
    title: "Data you can trust at a glance",
    body: "Every number is framed with a label and, where useful, a footnote on methodology. Charts stay in the brand palette and never rely on color alone.",
  },
  {
    title: "Built to be printed",
    body: "The whole system is designed to survive a trip through Cmd/Ctrl+P — page breaks, exact color, and no interactive-only content in the flow.",
  },
];
