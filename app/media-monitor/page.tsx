import { AppShell, Panel } from "../../components/app-shell";

const stories = [
  {
    source: "Media Source",
    headline: "Story feed connection pending",
    summary: "WardOS will show local news, social media, government updates, and community organization mentions here.",
    url: "https://orangenj.gov",
    sentiment: "Neutral",
  },
];

export default function MediaMonitorPage() {
  return (
    <AppShell title="Media Monitor" subtitle="Private media intelligence view for resident conversations, momentum, alerts, and follow-up actions.">
      <section className="grid two-col">
        <Panel title="Media Feed">
          <div className="list">
            {stories.map((story) => (
              <article className="row" key={story.headline}>
                <span className="badge">{story.sentiment}</span>
                <strong>{story.headline}</strong>
                <small className="muted">{story.source}</small>
                <p>{story.summary}</p>
                <a className="story-link" href={story.url} target="_blank" rel="noopener noreferrer">
                  Open Full Story
                </a>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Orange Pulse">
          <div className="row">
            <strong>Map layer slot</strong>
            <small className="muted">Geocoded stories, posts, complaints, and development applications can be layered here.</small>
          </div>
        </Panel>
      </section>
    </AppShell>
  );
}
