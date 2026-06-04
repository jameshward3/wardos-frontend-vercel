"use client";

import { WardDashboard } from "../components/WardDashboard";
import { demoAnalytics } from "../lib/analytics";

export default function Wards() {
  return (
    <main className="ovi-app">
      <WardDashboard analytics={demoAnalytics()} />
    </main>
  );
}
