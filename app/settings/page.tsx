import { AppShell, Panel } from "../../components/app-shell";

export default function SettingsPage() {
  return (
    <AppShell title="Admin Settings" subtitle="Private deployment, password protection, DNS, and staff-only safety controls.">
      <section className="grid two-col">
        <Panel title="Deployment">
          <div className="list">
            <div className="row"><strong>Domain</strong><small className="muted">wardos.jw4o.com</small></div>
            <div className="row"><strong>Host</strong><small className="muted">Vercel</small></div>
            <div className="row"><strong>DNS owner</strong><small className="muted">Squarespace manages jw4o.com DNS; only the wardos subdomain should be changed.</small></div>
          </div>
        </Panel>
        <Panel title="Security">
          <div className="list">
            <div className="row"><strong>Password source</strong><small className="muted">WARDOS_SITE_PASSWORD environment variable</small></div>
            <div className="row"><strong>Cookie</strong><small className="muted">HTTP-only, secure, signed, SameSite=Lax, eight-hour expiration</small></div>
            <div className="row"><strong>Logout</strong><small className="muted">Clears the private WardOS session cookie</small></div>
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
