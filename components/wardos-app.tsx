import Script from "next/script";

const pageMap: Record<string, string> = {
  home: "home",
  dashboard: "dashboard",
  briefing: "briefing",
  constituents: "constituents",
  media: "media",
  publicSafety: "publicSafety",
  legislation: "legislation",
  budget: "budget",
  development: "development",
  settings: "settings",
};

export function WardOSApp({ page = "dashboard" }: { page?: string }) {
  const initialPage = pageMap[page] || "dashboard";

  return (
    <>
      <Script id="wardos-initial-page" strategy="beforeInteractive">
        {`window.WARDOS_INITIAL_PAGE = ${JSON.stringify(initialPage)};`}
      </Script>
      <aside className="sidebar">
        <div className="brand">
          <img src="/assets/ward-circle-mark.svg" alt="WardOS mark" />
          <div>
            <strong>
              Ward<span>OS</span>
            </strong>
            <small>South Ward Operations System</small>
          </div>
        </div>

        <nav id="nav" />

        <section className="assistant-card">
          <div className="avatar-ring">
            <img src="/assets/ward-circle-mark.svg" alt="" />
          </div>
          <div>
            <strong>WardOS AI</strong>
            <small>All systems active</small>
          </div>
          <span className="pulse" />
        </section>

        <button className="quick-add" data-open-modal="quick">
          <span>Quick Add</span>
          <b>+</b>
        </button>
      </aside>

      <main className="shell">
        <header className="topbar">
          <div className="crumbs" id="crumbs">
            Home
          </div>
          <div className="top-actions">
            <span id="lastSyncLabel">Last Sync: Loading</span>
            <label className="search">
              <span>⌕</span>
              <input id="globalSearch" type="search" placeholder="Search WardOS..." />
            </label>
            <button className="icon-button" title="Notifications">
              ⌁<b>3</b>
            </button>
            <div className="profile">
              <img src="/assets/ward-circle-mark.svg" alt="" />
              <div>
                <strong>Councilman Ward</strong>
                <small>South Ward, Orange NJ</small>
              </div>
            </div>
          </div>
        </header>

        <section id="page" />
      </main>

      <div className="modal-backdrop" id="modalBackdrop" aria-hidden="true">
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
          <header>
            <div>
              <p className="eyebrow" id="modalEyebrow">
                Manual Add
              </p>
              <h2 id="modalTitle">Add Item</h2>
            </div>
            <button className="ghost" id="closeModal">
              ×
            </button>
          </header>
          <div id="modalBody" />
        </section>
      </div>

      <Script src="/app.js" strategy="afterInteractive" />
    </>
  );
}
