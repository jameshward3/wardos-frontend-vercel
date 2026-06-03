import { AppShell, MetricCard, Panel } from "../../components/app-shell";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard" subtitle="Executive view of open requests, meetings, legislation, budget, media, and development watch items.">
      <section className="grid metrics">
        <MetricCard value="--" label="Open Requests" detail="Connect WardOS API" />
        <MetricCard value="--" label="Pending Legislation" detail="Manual adds enabled later" />
        <MetricCard value="--" label="Budget Items" detail="Budget dashboard source" />
        <MetricCard value="--" label="Media Mentions" detail="Monitor feed" />
      </section>
      <section className="grid two-col" style={{ marginTop: 16 }}>
        <Panel title="Priority Issues">
          <div className="list">
            <div className="row">
              <strong>Awaiting live WardOS data</strong>
              <small className="muted">No demo data is shown on this private deployment shell.</small>
            </div>
          </div>
        </Panel>
        <Panel title="External Interaction Slots">
          <div className="list">
            <div className="row"><strong>Draft follow-ups</strong><small className="muted">Staff review before any message leaves WardOS.</small></div>
            <div className="row"><strong>Manual adds</strong><small className="muted">Legislation, constituent needs, media clips, and development items.</small></div>
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
