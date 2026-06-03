import { AppShell, Panel } from "../../components/app-shell";

export default function DevelopmentPage() {
  return (
    <AppShell title="Development Watchdog" subtitle="Planning, zoning, redevelopment, parking, traffic, PILOT agreements, and public-comment awareness.">
      <section className="grid two-col">
        <Panel title="Watchlist">
          <div className="row"><strong>Development projects pending</strong><small className="muted">Ready for planning board, zoning board, and manual project intake.</small></div>
        </Panel>
        <Panel title="Follow-up Actions">
          <div className="row"><strong>Prepare questions</strong><small className="muted">Draft-only staff work area for board follow-up and resident communications.</small></div>
        </Panel>
      </section>
    </AppShell>
  );
}
