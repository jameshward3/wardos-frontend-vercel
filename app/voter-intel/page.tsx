import type { Metadata } from "next";
import Dashboard from "../../src/voter-intel-pages/Dashboard";

export const metadata: Metadata = {
  title: "Orange Voter Intelligence Platform",
  description: "Civic voter analytics dashboard for Orange Township, New Jersey",
};

export default function VoterIntelPage() {
  return <Dashboard />;
}
