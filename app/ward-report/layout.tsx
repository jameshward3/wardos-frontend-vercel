import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./ward-report.css";

export const metadata: Metadata = {
  title: "Ward Report — Spring 2025 | South Ward, City of Orange Township",
  description: "Quarterly newsletter from Council Member James Ward, South Ward, City of Orange Township.",
};

export default function WardReportLayout({ children }: { children: ReactNode }) {
  return <div id="ward-report-root">{children}</div>;
}
