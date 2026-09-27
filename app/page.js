import Link from "next/link";

export default function Home() {
  return (
    <div className="page">
      <div className="card">
        <div className="logo-row">
          <span className="mark">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </span>
          SecureID
        </div>
        <h2 className="title">Get started</h2>
        <p className="subtitle">Create a new account, or sign in if you already have one.</p>
        <Link className="btn" href="/register" style={{ textDecoration: "none", marginBottom: 12, display: "inline-flex" }}>
          Create account
        </Link>
        <Link className="btn btn-ghost" href="/login" style={{ textDecoration: "none", marginTop: 12, display: "inline-flex" }}>
          Sign in
        </Link>
      </div>
    </div>
  );
}
