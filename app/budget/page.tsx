import { AppShell, Panel } from "../../components/app-shell";

export default function BudgetPage() {
  return (
    <AppShell title="Budget Dashboard" subtitle="Budget watch for line items, departments, historical spending, savings, and local concerns.">
      <section className="grid two-col">
        <Panel title="Budget Watch">
          <div className="row"><strong>Budget dashboard source pending</strong><small className="muted">Ready to connect to OrangeBudgetDashboard and local watch items.</small></div>
        </Panel>
        <Panel title="Manual Watch Item">
          <div className="row"><strong>Add budget concern</strong><small className="muted">Department, line item, fiscal year, notes, and status.</small></div>
        </Panel>
      </section>
    </AppShell>
  );
}
