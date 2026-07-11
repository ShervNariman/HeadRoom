import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-shell">
      <section className="landing-card">
        <div className="brand landing-brand">
          <span className="brand-symbol">H</span>
          <span>Headroom</span>
        </div>
        <div className="eyebrow">Public code · private data</div>
        <h1>One clear view of the usage-based services powering your product.</h1>
        <p>
          Headroom turns fragmented provider usage, spend, limits, and velocity into one answer:
          what will become a constraint next?
        </p>
        <div className="landing-actions">
          <Link className="primary-button" href="/dashboard">Open dashboard</Link>
          <Link className="secondary-button" href="/guide">Copy the blueprint</Link>
        </div>
        <div className="landing-note">
          The demo is public and deterministic. Credentials and live account data remain private.
        </div>
      </section>
    </main>
  );
}
