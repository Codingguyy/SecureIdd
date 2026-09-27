"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OtpBoxes from "@/components/OtpBoxes";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


function ShieldLockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <rect x="9" y="11.5" width="6" height="5" rx="1" />
      <path d="M10 11.5V9.5a2 2 0 1 1 4 0v2" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10.5" width="16" height="9.5" rx="2" /><path d="M7.5 10.5V7a4.5 4.5 0 1 1 9 0v3.5" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a19.4 19.4 0 0 1 4.22-5.56M9.9 4.24A10.6 10.6 0 0 1 12 4c7 0 11 8 11 8a19.5 19.5 0 0 1-2.16 3.19m-6.18-1.23a3 3 0 1 1-4.24-4.24" />
      <path d="M1 1l22 22" />
    </svg>
  );
}
function AlertCircleIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v5" /><path d="M12 16h.01" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" />
    </svg>
  );
}
function SmsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function AuthenticatorIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}
function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.7-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 16.1 3 9.3 7.5 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2c-2 1.5-4.6 2.4-7.2 2.4-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.2 40.5 16 45 24 45z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.1 5.6l6.2 5.2C39.9 37 44 31.4 44 24c0-1.4-.1-2.7-.4-3.5z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState("password");
  const [ticket, setTicket] = useState(null);

  
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [credentialError, setCredentialError] = useState(false);
  const [loginAlert, setLoginAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);

  
  const [method, setMethod] = useState("email");
  const [methodAlert, setMethodAlert] = useState("");
  const [hasAuthenticator, setHasAuthenticator] = useState(true);

  
  const [otpCode, setOtpCode] = useState("");
  const [otpErrorLines, setOtpErrorLines] = useState(null); // [line1, line2?]
  const [wrongIndex, setWrongIndex] = useState(null);
  const [devHint, setDevHint] = useState("");
  const [expirySeconds, setExpirySeconds] = useState(300);
  const [resendSeconds, setResendSeconds] = useState(30);
  const [expired, setExpired] = useState(false);
  const [expiredCountdown, setExpiredCountdown] = useState(20);
  const [locked, setLocked] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (step !== "otp" || expired || locked) return;
    if (expirySeconds <= 0) { setExpired(true); return; }
    const id = setInterval(() => setExpirySeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [step, expirySeconds, expired, locked]);

  useEffect(() => {
    if (step !== "otp" || resendSeconds <= 0) return;
    const id = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [step, resendSeconds]);

  useEffect(() => {
    if (!expired) return;
    if (expiredCountdown <= 0) return;
    const id = setInterval(() => setExpiredCountdown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [expired, expiredCountdown]);

  function splitMessage(message) {
    // "Incorrect code. Please try again. You have 2 attempts left." -> two centered lines
    const idx = message.indexOf(". You have");
    if (idx === -1) return [message, null];
    return [message.slice(0, idx + 1), message.slice(idx + 2)];
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setLoginAlert("");
    setCredentialError(false);
    if (!identifier || !password) { setCredentialError(true); setLoginAlert("Enter your email and password."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCredentialError(true);
        setLoginAlert(data.message || "Invalid email or password. Please try again.");
        return;
      }
      setTicket(data.ticket);
      setHasAuthenticator(Boolean(data.hasAuthenticator ?? true));
      setStep("method");
    } catch {
      setCredentialError(true);
      setLoginAlert("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetOtpScreen(devOtp) {
    setOtpCode("");
    setOtpErrorLines(null);
    setWrongIndex(null);
    setDevHint(devOtp ? `Dev preview — code: ${devOtp}` : "");
    setExpirySeconds(300);
    setResendSeconds(30);
    setExpired(false);
    setExpiredCountdown(20);
    setLocked(false);
  }

  async function handleMethodSubmit(e) {
    e.preventDefault();
    setMethodAlert("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/login-send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, method }),
      });
      const data = await res.json();
      if (!res.ok) { setMethodAlert(data.message || "Could not continue."); return; }
      setTicket(data.ticket);
      resetOtpScreen(data.devOtp);
      setStep("otp");
    } catch {
      setMethodAlert("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleOtpChange(next) {
    if (otpErrorLines) setOtpErrorLines(null);
    if (wrongIndex !== null) setWrongIndex(null);
    setOtpCode(next);
  }

  async function handleResend() {
    setOtpErrorLines(null);
    try {
      const res = await fetch("/api/login-send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, method }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpErrorLines([data.message || "Could not resend the code."]); return; }
      setTicket(data.ticket);
      resetOtpScreen(data.devOtp);
    } catch {
      setOtpErrorLines(["Could not reach the server. Please try again."]);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    if (otpCode.length !== 6 || otpCode.includes(" ")) { setOtpErrorLines(["Enter all 6 digits."]); return; }
    setVerifying(true);
    try {
      const res = await fetch("/api/login-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.ticket) setTicket(data.ticket);
        if (data.code === "max_attempts") { setLocked(true); setOtpErrorLines([data.message]); return; }
        setOtpErrorLines(splitMessage(data.message || "That code is incorrect."));
        setWrongIndex(5);
        return;
      }
      router.push("/dashboard");
    } catch {
      setOtpErrorLines(["Could not reach the server. Please try again."]);
    } finally {
      setVerifying(false);
    }
  }

  const otpTitle = method === "sms" ? "Mobile Verification" : method === "authenticator" ? "Authenticator Verification" : "Email Verification";
  const OtpIcon = method === "sms" ? SmsIcon : method === "authenticator" ? AuthenticatorIcon : MailIcon;

  function goBack() {
    setLoginAlert("");
    setCredentialError(false);
    if (step === "method") { setMethodAlert(""); setStep("password"); }
    else if (step === "otp") { setMethodAlert(""); setStep("method"); }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <aside className="login-brand">
          <div className="brand-icon"><ShieldLockIcon /></div>
          <div className="brand-name">SecureID</div>
          <div className="brand-tagline">Secure access, verified every time.</div>
        </aside>

        <main className="login-form-panel">
          <div className="card">

            {step === "password" && (
              <section className="step-section active center">
                <div className={"step-icon login-icon " + (credentialError ? "tone-danger" : "tone-primary")}>
                  <ShieldLockIcon />
                </div>
                <h1 className="title">Welcome back!</h1>
                <p className="subtitle">Login to your account</p>

                <form onSubmit={handlePasswordSubmit} noValidate>
                  <div className={"field" + (credentialError ? " error" : "")}>
                    <div className={"input-wrap has-icon" + (credentialError ? " has-suffix" : "")}>
                      <span className="f-icon"><UserIcon /></span>
                      <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Email or Username" required />
                      {credentialError && <span className="status-icon"><AlertCircleIcon /></span>}
                    </div>
                  </div>
                  <div className={"field" + (credentialError ? " error" : "")}>
                    <div className="input-wrap has-icon has-suffix">
                      <span className="f-icon"><LockIcon /></span>
                      <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
                      <button type="button" className="password-toggle" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {loginAlert && <p className="field-error-text">{loginAlert}</p>}

                  <div className="remember-row">
                    <label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me</label>
                    <a href="#" title="Not implemented in this demo">Forgot password?</a>
                  </div>

                  <button type="submit" className="btn" disabled={submitting}>{submitting ? "Signing in…" : "Login"}</button>
                  <div className="divider">or</div>
                  <button type="button" className="btn-google" onClick={() => alert("Google sign-in isn't wired up in this demo.")}>
                    <GoogleIcon /> Continue with Google
                  </button>
                  <p className="foot-link">New here? <a href="/register">Create an account</a></p>
                </form>
              </section>
            )}

            {step === "method" && (
              <section className="step-section active center">
                <button type="button" className="back-btn" onClick={goBack} aria-label="Go back"><ChevronLeftIcon /></button>
                <div className="step-icon login-icon tone-primary">
                  <ShieldLockIcon />
                </div>
                <h2 className="title">Verify your identity</h2>
                <p className="subtitle">Choose a method to continue</p>

                <form onSubmit={handleMethodSubmit}>
                  <div className="method-list">
                    {[
                      { value: "email", title: "Email OTP", sub: "Receive a code on your email", Icon: MailIcon, tone: "tone-email" },
                      { value: "sms", title: "SMS OTP", sub: "Receive a code on your mobile", Icon: SmsIcon, tone: "tone-sms" },
                      { value: "authenticator", title: "Authenticator App", sub: hasAuthenticator ? "Use code from authenticator app" : "Not set up for this account", Icon: AuthenticatorIcon, tone: "tone-auth" },
                    ].map((m) => (
                      <label key={m.value} className={"method-item" + (method === m.value ? " selected" : "")} onClick={() => setMethod(m.value)}>
                        <span className={"m-icon " + m.tone}><m.Icon /></span>
                        <span className="m-text">
                          <span className="m-title">{m.title}</span>
                          <span className="m-sub">{m.sub}</span>
                        </span>
                        <input type="radio" name="loginMethod" checked={method === m.value} onChange={() => setMethod(m.value)} />
                        <span className="m-radio" />
                      </label>
                    ))}
                  </div>
                  {methodAlert && <p className="field-error-text">{methodAlert}</p>}
                  <button type="submit" className="btn" disabled={submitting}>{submitting ? "Sending…" : "Continue"}</button>
                </form>
              </section>
            )}

            {step === "otp" && (
              <section className="step-section active center">
                <button type="button" className="back-btn" onClick={goBack} aria-label="Go back"><ChevronLeftIcon /></button>
                <div className="step-icon login-icon tone-primary">
                  <OtpIcon />
                </div>
                <h2 className="title">{otpTitle}</h2>
                <p className="subtitle">
                  {method === "authenticator" ? "Enter the 6-digit code from your authenticator app" : (
                    <>Enter the 6-digit code sent to<br /><strong>{identifier}</strong></>
                  )}
                </p>

                <form onSubmit={handleOtpSubmit}>
                  {expired || locked ? (
                    <div className="otp-group disabled">
                      {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="otp-digit" />)}
                    </div>
                  ) : (
                    <OtpBoxes value={otpCode} onChange={handleOtpChange} wrongIndex={wrongIndex} autoFocus />
                  )}

                  {expired && <p className="code-expired-text">Code expired</p>}
                  {!expired && otpErrorLines && (
                    <p className="field-error-text">
                      {otpErrorLines[0]}{otpErrorLines[1] ? <><br />{otpErrorLines[1]}</> : null}
                    </p>
                  )}
                  {locked && otpErrorLines && <p className="field-error-text">{otpErrorLines[0]}</p>}
                  {devHint && !locked && !expired && <p className="dev-hint">{devHint}</p>}

                  {!locked && !expired && (
                    <div className="meta-row">Code expires in <span className="accent">{formatTime(expirySeconds)}</span></div>
                  )}

                  {!locked && !expired && (
                    <div className="resend-line">
                      <button type="button" className="btn-link" disabled={resendSeconds > 0} onClick={handleResend}>
                        {resendSeconds > 0 ? `Resend code (${formatTime(resendSeconds)})` : "Resend code"}
                      </button>
                    </div>
                  )}

                  {expired && (
                    <>
                      <div className="resend-line">
                        <button type="button" className="btn-link" disabled={expiredCountdown > 0} onClick={handleResend}>Resend code</button>
                      </div>
                      {expiredCountdown > 0 && (
                        <p className="meta-row">You can request a new code in <span className="accent">{formatTime(expiredCountdown)}</span></p>
                      )}
                    </>
                  )}

                  {!expired && !locked && (
                    <div className="link-row" style={{ marginTop: 14 }}>
                      <button type="submit" className="btn" disabled={verifying}>{verifying ? "Verifying…" : "Verify"}</button>
                    </div>
                  )}
                  {locked && (
                    <div className="link-row" style={{ marginTop: 14 }}>
                      <button type="button" className="btn" onClick={handleResend}>Resend New Code</button>
                    </div>
                  )}

                  <p className="foot-link">
                    <button type="button" className="btn-link" onClick={() => setOtpErrorLines(["Check your spam folder, or use \u201CResend code\u201D above."])}>
                      Didn&apos;t receive the code?
                    </button>
                  </p>
                </form>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
