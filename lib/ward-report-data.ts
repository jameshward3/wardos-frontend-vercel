/**
 * Ward Report — single source of truth for all copy and numbers.
 *
 * Edit this file to update any quarter's content. Nothing else in
 * components/ward-report or app/ward-report should hardcode text or
 * numbers — everything should flow from here.
 *
 * See app/ward-report/README.md for a section-by-section editing guide.
 */

export type EditionInfo = {
  season: string;
  year: number;
  quarter: string;
  publishedLabel: string;
  councilMember: string;
  title: string;
  municipality: string;
  wardName: string;
  tagline: string;
};

export const edition: EditionInfo = {
  season: "Spring",
  year: 2025,
  quarter: "Q1",
  publishedLabel: "Published April 2025",
  councilMember: "James Ward",
  title: "City Council Member",
  municipality: "City of Orange Township",
  wardName: "South Ward",
  tagline: "Transparency. Accountability. Results.",
};

export type StatDatum = {
  icon: string;
  value: string;
  label: string;
  subtitle?: string;
};

export const quarterlySnapshot: StatDatum[] = [
  { icon: "📋", value: "38", label: "Constituent Cases Resolved", subtitle: "Up 12% from Q4 2024" },
  { icon: "🏛️", value: "6", label: "Council Meetings Attended", subtitle: "100% attendance record" },
  { icon: "🤝", value: "14", label: "Community Events Hosted or Sponsored" },
  { icon: "📣", value: "3,400+", label: "Residents Reached via Outreach", subtitle: "Mail, phone, and in-person" },
  { icon: "🌳", value: "312", label: "Trees Planted To Date", subtitle: "Since program launch" },
  { icon: "⏱️", value: "2.1 days", label: "Average Constituent Response Time" },
];

export type AgendaItem = {
  label: string;
  value: number;
  description: string;
};

export const agendaProgress: AgendaItem[] = [
  { label: "Public Safety", value: 78, description: "Neighborhood policing, street lighting, crossing guards" },
  { label: "Infrastructure", value: 64, description: "Road resurfacing, sidewalk repair, stormwater upgrades" },
  { label: "Quality of Life", value: 71, description: "Parks, sanitation, code enforcement" },
  { label: "Economic Growth", value: 52, description: "Small business support, commercial corridor revitalization" },
  { label: "Youth & Education", value: 60, description: "After-school programs, scholarships, school partnerships" },
];

export type LegislationRecord = {
  title: string;
  summary: string;
  status: "Passed" | "In Committee" | "Introduced";
  vote: "Voted Yes" | "Voted No" | "Sponsored" | "Co-Sponsored";
};

export const legislativeReportCard: LegislationRecord[] = [
  {
    title: "Ordinance 24-31: Complete Streets Update",
    summary: "Mandates pedestrian and cyclist safety review for all repaving projects.",
    status: "Passed",
    vote: "Sponsored",
  },
  {
    title: "Resolution 25-04: Participatory Budgeting Pilot",
    summary: "Allocates $250,000 of capital budget to resident-directed neighborhood projects.",
    status: "Passed",
    vote: "Co-Sponsored",
  },
  {
    title: "Ordinance 25-07: Vacant Property Registry Reform",
    summary: "Strengthens fines and inspection cadence for long-vacant commercial properties.",
    status: "In Committee",
    vote: "Voted Yes",
  },
  {
    title: "Resolution 25-11: Tree Canopy Expansion Agreement",
    summary: "Renews the municipal urban forestry partnership through 2027.",
    status: "Passed",
    vote: "Sponsored",
  },
  {
    title: "Ordinance 25-14: Small Business Façade Grant Program",
    summary: "Creates matching grants for storefront improvements along Main Street.",
    status: "Introduced",
    vote: "Sponsored",
  },
];

export type VisionPillar = {
  icon: string;
  title: string;
  description: string;
};

export const visionForOrange: VisionPillar[] = [
  {
    icon: "🛡️",
    title: "Safe, Connected Neighborhoods",
    description: "Every block deserves reliable lighting, responsive policing, and safe routes to school.",
  },
  {
    icon: "🏗️",
    title: "Infrastructure Built to Last",
    description: "Prioritizing roads, water systems, and sidewalks that reduce long-term repair costs.",
  },
  {
    icon: "🌳",
    title: "A Greener Orange",
    description: "Expanding tree canopy, parks, and stormwater resilience block by block.",
  },
  {
    icon: "💼",
    title: "Local Economic Opportunity",
    description: "Supporting small businesses and bringing family-sustaining jobs to our commercial corridors.",
  },
  {
    icon: "📚",
    title: "Investing in Our Youth",
    description: "Expanding after-school programming, mentorship, and pathways to higher education.",
  },
];

export type AlignmentSlice = {
  name: string;
  value: number;
  color: string;
};

export const citywideAlignment: AlignmentSlice[] = [
  { name: "Aligned", value: 92, color: "#0b1626" },
  { name: "Partially Aligned", value: 6, color: "#c9a227" },
  { name: "Did Not Align", value: 2, color: "#ece0c0" },
];

export const citywideAlignmentNote =
  "Based on 64 recorded council votes this quarter, measured against the South Ward platform priorities.";

export type SpendingSlice = {
  name: string;
  value: number;
  color: string;
};

export const spendingTargets: SpendingSlice[] = [
  { name: "Infrastructure", value: 45, color: "#0b1626" },
  { name: "Public Safety", value: 20, color: "#293f5e" },
  { name: "Quality of Life", value: 15, color: "#c9a227" },
  { name: "Economic Growth", value: 10, color: "#8095b8" },
  { name: "Administration", value: 10, color: "#ece0c0" },
];

export const spendingNote =
  "Reflects the South Ward capital and discretionary allocation requested for FY2025, pending final municipal budget adoption.";

export type TreesDatum = {
  period: string;
  trees: number;
};

export const treesPlanted: TreesDatum[] = [
  { period: "Q2 2024", trees: 180 },
  { period: "Q3 2024", trees: 210 },
  { period: "Q4 2024", trees: 260 },
  { period: "Q1 2025", trees: 312 },
];

export type EventRecord = {
  name: string;
  date: string;
  attendees: string;
  description: string;
};

export const eventsSponsored: EventRecord[] = [
  {
    name: "South Ward Spring Clean-Up",
    date: "March 8, 2025",
    attendees: "120 volunteers",
    description: "Community-wide litter and debris removal across six blocks, in partnership with Public Works.",
  },
  {
    name: "Orange Small Business Expo",
    date: "March 22, 2025",
    attendees: "45 vendors",
    description: "Free vendor tables and marketing workshops for local entrepreneurs on Main Street.",
  },
  {
    name: "Youth Mentorship Kickoff",
    date: "February 14, 2025",
    attendees: "80 students",
    description: "Launch event pairing high school students with local professionals for a semester-long mentorship.",
  },
  {
    name: "Senior Resource Fair",
    date: "January 25, 2025",
    attendees: "150 residents",
    description: "Connected seniors with county health, housing, and transportation benefits in one afternoon.",
  },
];

export type OutreachStat = StatDatum;

export const outreachStats: OutreachStat[] = [
  { icon: "🚪", value: "1,850", label: "Doors Knocked" },
  { icon: "✉️", value: "4", label: "Newsletters Mailed", subtitle: "Quarterly print + digital" },
  { icon: "📱", value: "22,000+", label: "Social Media Impressions" },
  { icon: "☎️", value: "410", label: "Constituent Calls Logged" },
];

export type MeetingRecord = {
  date: string;
  time: string;
  title: string;
  location: string;
};

export const communityMeetings: MeetingRecord[] = [
  { date: "April 16, 2025", time: "6:30 PM", title: "South Ward Community Meeting", location: "Orange Public Library, Main Branch" },
  { date: "May 21, 2025", time: "6:30 PM", title: "South Ward Community Meeting", location: "Cleveland Street Community Center" },
  { date: "June 18, 2025", time: "6:30 PM", title: "South Ward Community Meeting", location: "Orange Public Library, Main Branch" },
  { date: "June 28, 2025", time: "10:00 AM", title: "Neighborhood Walk & Office Hours", location: "Meet at City Hall Plaza" },
];

export type ClosingSpread = {
  heading: string;
  message: string;
  signOff: string;
  quote: string;
  quoteAttribution: string;
};

export const closingSpread: ClosingSpread = {
  heading: "A Ward Built Together",
  message:
    "Every initiative in this report exists because residents showed up — at community meetings, on clean-up days, and in calls and emails to our office. Thank you for trusting this office with your block, your concerns, and your ideas for what Orange can become. There is more work ahead, and I'm grateful to do it alongside you.",
  signOff: "In service,\nJames Ward\nCouncil Member, South Ward",
  quote:
    "Every voice in the South Ward deserves to be heard, and every block deserves the same investment.",
  quoteAttribution: "James Ward, Council Member",
};

export type CtaFooter = {
  heading: string;
  subtext: string;
  email: string;
  phone: string;
  website: string;
  officeAddress: string;
  qrCodes: { label: string }[];
};

export const ctaFooter: CtaFooter = {
  heading: "Stay Connected With Our Office",
  subtext:
    "Have a question, a concern, or an idea for the South Ward? Reach out — every message gets a response.",
  email: "jward@ci.orange.nj.us",
  phone: "(973) 555-0148",
  website: "www.ci.orange.nj.us/ward/south",
  officeAddress: "Orange City Hall, 29 North Day Street, Orange, NJ 07050",
  qrCodes: [
    { label: "Scan to Read the Full Budget Report" },
    { label: "Scan to RSVP for the Next Ward Meeting" },
    { label: "Scan to Contact Our Office" },
  ],
};
