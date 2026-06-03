export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const nextQuery = searchParams.next ? `?next=${encodeURIComponent(searchParams.next)}` : "";
  const errorMessages: Record<string, string> = {
    "1": "Password not recognized.",
    google_config: "Google Workspace login is not configured yet.",
    google_state: "Google sign-in expired. Try again.",
    google_token: "Google sign-in could not be verified. Try again.",
    workspace: "Use a jameswardfororange.com Google Workspace account.",
  };
  const errorMessage = searchParams.error ? errorMessages[searchParams.error] || "Sign-in failed. Try again." : "";

  return (
    <main className="login-wrap">
      <section className="login-card">
        <span className="brand-mark">JW</span>
        <h1>WardOS</h1>
        <p className="muted">Private South Ward operations dashboard.</p>
        {errorMessage ? <p className="danger">{errorMessage}</p> : null}
        <a className="google-login" href={`/api/auth/google/start${nextQuery}`}>
          <span>G</span>
          Continue with Google Workspace
        </a>
        <div className="login-divider">
          <span>Password fallback</span>
        </div>
        <form className="form" action={`/api/login${nextQuery}`} method="post">
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
