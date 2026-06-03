import { AppShell, Panel } from "../../components/app-shell";

export default function BriefingPage() {
  return (
    <AppShell title="Daily Briefing" subtitle="Daily review queue for documents, meetings, resident needs, budget concerns, and media pulse.">
      <section className="grid two-col">
        <Panel title="Briefing Queue">
          <div className="list">
            <div className="row"><strong>Inbox intake</strong><small className="muted">Connect to the local WardOS briefing endpoint when remote access is ready.</small></div>
            <div className="row"><strong>Recommended actions</strong><small className="muted">Draft-only until staff approves external action.</small></div>
          </div>
        </Panel>
        <Panel title="Publishing Safety">
          <span className="badge">No auto-sending</span>
        </Panel>
      </section>
    </AppShell>
  );
}
