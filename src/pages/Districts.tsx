"use client";

import { DistrictDashboard } from "../components/DistrictDashboard";
import { demoAnalytics } from "../lib/analytics";

export default function Districts() {
  return (
    <main className="ovi-app">
      <DistrictDashboard analytics={demoAnalytics()} />
    </main>
  );
}
