import { AppShell, Panel } from "../../components/app-shell";

export default function ConstituentsPage() {
  return (
    <AppShell title="Constituent Cases" subtitle="Private case tracking for resident needs, staff ownership, status, and follow-up drafts.">
      <section className="grid two-col">
        <Panel title="Open Cases">
          <div className="row">
            <strong>Case tracker ready</strong>
            <small className="muted">Replace this shell with live case data from the WardOS API.</small>
          </div>
        </Panel>
        <Panel title="Manual Add Slot">
          <div className="row">
            <strong>New constituent need</strong>
            <small className="muted">Form integration can post to the protected backend once the public/private API boundary is set.</small>
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
