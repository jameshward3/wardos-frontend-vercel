export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <main className="login-wrap">
      <section className="login-card">
        <span className="brand-mark">JW</span>
        <h1>WardOS</h1>
        <p className="muted">Private South Ward operations dashboard.</p>
        {searchParams.error ? <p className="danger">Password not recognized.</p> : null}
        <form className="form" action={`/api/login${searchParams.next ? `?next=${encodeURIComponent(searchParams.next)}` : ""}`} method="post">
          <label>
            Site Password
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <button className="primary" type="submit">
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}
