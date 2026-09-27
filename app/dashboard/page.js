"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [status, setStatus] = useState("loading"); // loading | ok | denied
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/me")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) { setStatus("denied"); return; }
        setUser(data);
        setStatus("ok");
      })
      .catch(() => setStatus("denied"));
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="page">
      <div className="card">
        <div className="logo-row">
          <span className="mark">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          SecureID
        </div>

        {status === "loading" && <p className="subtitle">Checking your session…</p>}

        {status === "ok" && user && (
          <>
            <h2 className="title">Account</h2>
            <p className="subtitle">Details returned by /api/me using your session cookie.</p>
            <div className="field"><label>Name</label><input type="text" value={user.fullName || ""} disabled /></div>
            <div className="field"><label>Email</label><input type="text" value={user.email || ""} disabled /></div>
            <div className="field"><label>Phone</label><input type="text" value={user.phone || ""} disabled /></div>
            <button className="btn btn-ghost" onClick={handleLogout}>Sign out</button>
          </>
        )}

        {status === "denied" && (
          <>
            <div className="alert warning">You&apos;re not signed in.</div>
            <a className="btn" href="/login" style={{ textDecoration: "none" }}>Go to sign in</a>
          </>
        )}
      </div>
    </div>
  );
}
