import { AppShell, Panel } from "../../components/app-shell";

export default function LegislationPage() {
  return (
    <AppShell title="Legislative Tracker" subtitle="Track ordinances, resolutions, meetings, votes, committees, and manual legislation adds.">
      <section className="grid two-col">
        <Panel title="Tracked Items">
          <div className="row"><strong>Legislation source pending</strong><small className="muted">Ready to connect to Legislative_tracker and local manual additions.</small></div>
        </Panel>
        <Panel title="Manual Add Slot">
          <div className="row"><strong>New legislation item</strong><small className="muted">Use for ordinances, resolutions, committee status, and notes.</small></div>
        </Panel>
      </section>
    </AppShell>
  );
}
