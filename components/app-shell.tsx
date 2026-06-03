import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  ["/dashboard", "Dashboard"],
  ["/briefing", "Briefing"],
  ["/constituents", "Constituents"],
  ["/media-monitor", "Media Monitor"],
  ["/legislation", "Legislation"],
  ["/budget", "Budget"],
  ["/development", "Development"],
  ["/settings", "Settings"],
];

export function AppShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">JW</span>
          <strong>WardOS</strong>
          <small>South Ward Operations System</small>
        </Link>
        <nav>
          {navItems.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
        <a className="logout" href="/logout">
          Log out
        </a>
      </aside>
      <main className="content">
        <header className="page-header">
          <div>
            <p className="eyebrow">Private WardOS</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="sync-card">
            <small>Session</small>
            <strong>Protected</strong>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="metric-card">
      <strong>{value}</strong>
      <span>{label}</span>
      <small>{detail}</small>
    </article>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>{title}</h2>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}
