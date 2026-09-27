"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import OtpBoxes from "@/components/OtpBoxes";

const STEP_NUMBER = { details: 1, email: 2, mobile: 3, "mfa-select": 4, "mfa-qr": 4, "mfa-verify": 4 };

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState("details");
  const [ticket, setTicket] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [detailsAlert, setDetailsAlert] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [channel, setChannel] = useState(null);
  const [targetLabel, setTargetLabel] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [wrongIndex, setWrongIndex] = useState(null);
  const [devHint, setDevHint] = useState("");
  const [expirySeconds, setExpirySeconds] = useState(300);
  const [resendSeconds, setResendSeconds] = useState(30);
  const [locked, setLocked] = useState(false);
  const [expired, setExpired] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [mfaMethod, setMfaMethod] = useState("authenticator");
  const [otpauthUri, setOtpauthUri] = useState("");
  const [secret, setSecret] = useState("");
  const [showSetupKey, setShowSetupKey] = useState(false);
  const [totpSeconds, setTotpSeconds] = useState(30);
  const qrCanvasRef = useRef(null);
  const [showPassword, setshowPassword] = useState(false);
  const passwordStrength = getpasswordStrength(password);
  const currentStepNumber = STEP_NUMBER[step] ?? null;
  useEffect(() => {
    const isTotpVerify = step === "mfa-verify" && mfaMethod === "authenticator";
    if (!["email", "mobile", "mfa-verify"].includes(step) || isTotpVerify || locked || expired) return;
    if (expirySeconds <= 0) { setExpired(true); return; }
    const id = setInterval(() => setExpirySeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [step, expirySeconds, locked, expired, mfaMethod]);

  useEffect(() => {
    if (!["email", "mobile", "mfa-verify"].includes(step)) return;
    if (resendSeconds <= 0) return;
    const id = setInterval(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [step, resendSeconds]);

  
  useEffect(() => {
    if (!(step === "mfa-verify" && mfaMethod === "authenticator")) return;
    const tick = () => setTotpSeconds(30 - (Math.floor(Date.now() / 1000) % 30));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [step, mfaMethod]);

  
  useEffect(() => {
    if (step !== "mfa-qr" || !otpauthUri || !qrCanvasRef.current) return;
    import("qrcode").then((QRCode) => {
      QRCode.toCanvas(qrCanvasRef.current, otpauthUri, { width: 176, margin: 1 });
    });
  }, [step, otpauthUri]);

  function resetOtpScreen({ nextChannel, label, devOtp, expiry = 300 }) {
    setChannel(nextChannel);
    setTargetLabel(label);
    setOtpCode("");
    setOtpError("");
    setWrongIndex(null);
    setDevHint(devOtp ? `Dev preview — code: ${devOtp}` : "");
    setLocked(false);
    setExpired(false);
    setExpirySeconds(expiry);
    setResendSeconds(30);
  }

  // ---- Password strength (fixed) ----
  // Bugs fixed here: "levl" -> "level", "String" -> "Strong".
  function getpasswordStrength(pwd) {
    if (!pwd) return { level: "", label: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: "weak", label: "Weak" };
    if (score <= 3) return { level: "medium", label: "Medium" };
    return { level: "strong", label: "Strong" };
  }

  function handleOtpChange(next) {
    
    if (otpError) setOtpError("");
    if (wrongIndex !== null) setWrongIndex(null);
    setOtpCode(next);
  }

  function setFieldError(name, hasError) {
    setFieldErrors((prev) => ({ ...prev, [name]: hasError }));
  }

  
  async function handleDetailsSubmit(e) {
    e.preventDefault();
    setDetailsAlert("");

    let valid = true;
    const nameOk = fullName.trim().length >= 2;
    setFieldError("name", !nameOk); if (!nameOk) valid = false;
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setFieldError("email", !emailOk); if (!emailOk) valid = false;
    const phoneOk = /^[\d\s-]{7,15}$/.test(phone);
    setFieldError("phone", !phoneOk); if (!phoneOk) valid = false;
    const passwordOk = password.length >= 8 && passwordStrength.level !== "weak";
    setFieldError("password", !passwordOk); if (!passwordOk) valid = false;

    if (!agree) { setDetailsAlert("Please accept the Terms & Conditions and Privacy Policy."); valid = false; }
    if (!valid) { if (!detailsAlert) setDetailsAlert("Please fix the highlighted fields."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) { setDetailsAlert(data.message || "Something went wrong."); return; }

      setTicket(data.ticket);
      resetOtpScreen({ nextChannel: "email", label: email, devOtp: data.devOtp });
      setStep("email");
    } catch {
      setDetailsAlert("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  
  async function submitOtp(onAdvance) {
    if (otpCode.length !== 6 || otpCode.includes(" ")) { setOtpError("Enter all 6 digits."); return; }
    setVerifying(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, channel, code: otpCode }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.ticket) setTicket(data.ticket);
        if (data.code === "max_attempts") { setLocked(true); setOtpError(data.message); return; }
        setOtpError(data.message || "That code is incorrect.");
        setWrongIndex(5);
        return;
      }

      setTicket(data.ticket);
      onAdvance(data);
    } catch {
      setOtpError("Could not reach the server. Please try again.");
    } finally {
      setVerifying(false);
    }
  }

  function handleEmailOtpSubmit(e) {
    e.preventDefault();
    submitOtp((data) => {
      resetOtpScreen({ nextChannel: "mobile", label: `+91 ${phone}`, devOtp: data.devOtp });
      setStep("mobile");
    });
  }

  function handleMobileOtpSubmit(e) {
    e.preventDefault();
    submitOtp(() => setStep("mfa-select"));
  }

  
  async function handleResend() {
    setOtpError("");
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, channel }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.message || "Could not resend the code."); return; }
      setTicket(data.ticket);
      resetOtpScreen({ nextChannel: channel, label: targetLabel, devOtp: data.devOtp });
    } catch {
      setOtpError("Could not reach the server. Please try again.");
    }
  }

  
  async function handleMethodSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/mfa-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket, method: mfaMethod }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.message || "Could not set up MFA."); return; }
      setTicket(data.ticket);

      if (mfaMethod === "authenticator") {
        setOtpauthUri(data.otpauthUri);
        setSecret(data.secret);
        setStep("mfa-qr");
      } else {
        resetOtpScreen({ nextChannel: "mfa", label: mfaMethod === "sms" ? "your mobile" : email, devOtp: data.devOtp });
        setStep("mfa-verify");
      }
    } catch {
      alert("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleQrContinue() {
    setChannel("mfa");
    setOtpCode("");
    setOtpError("");
    setWrongIndex(null);
    setLocked(false);
    setExpired(false);
    setStep("mfa-verify");
  }

  function handleMfaVerifySubmit(e) {
    e.preventDefault();
    submitOtp(() => setStep("success"));
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

        {currentStepNumber && (
          <div className="stepper">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} style={{ display: "contents" }}>
                <div className={"dot" + (n === currentStepNumber ? " active" : n < currentStepNumber ? " done" : "")}>{n}</div>
                {n < 5 && <div className={"line" + (n < currentStepNumber ? " done" : "")}></div>}
              </span>
            ))}
          </div>
        )}

        {step === "details" && (
          <section className="step-section active">
            <form onSubmit={handleDetailsSubmit} noValidate>
              <h1 className="title">Create your account</h1>
              <p className="subtitle">Let&apos;s get you started</p>

              <div className={"field" + (fieldErrors.name ? " error" : "")}>
                <label>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Priya Sharma" required />
                <div className="error-text">Enter your full name.</div>
              </div>
              <div className={"field" + (fieldErrors.email ? " error" : "")}>
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="priya.sharma@email.com" required />
                <div className="error-text">Enter a valid email address.</div>
              </div>
              <div className={"field" + (fieldErrors.phone ? " error" : "")}>
                <label>Mobile Number</label>
                <div className="phone-row">
                  <input type="text" className="cc" value="+91" readOnly />
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98765 43210" required />
                </div>
                <div className="error-text">Enter a valid mobile number.</div>
              </div>

              <div className={"field" + (fieldErrors.password ? " error" : "")}>
                <label>Password</label>
                <div className="input-wrap has-suffix">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setshowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {password && (
                  <>
                    <div className="strength-meter">
                      <div className={"strength-bar " + passwordStrength.level}></div>
                    </div>
                    <div className={"strength-label " + passwordStrength.level}>{passwordStrength.label}</div>
                  </>
                )}
                <div className="error-text">Password must be at least 8 characters.</div>
              </div>

              <div className="requirements-box">
                <div className="r-title">Password must contain:</div>
                <div className="requirement" data-rule="length">
                  <span className="r-dot"></span>At least 8 characters
                </div>
                <div className="requirement" data-rule="uppercase">
                  <span className="r-dot"></span>1 uppercase letter
                </div>
                <div className="requirement" data-rule="number">
                  <span className="r-dot"></span>1 number
                </div>
                <div className="requirement" data-rule="special">
                  <span className="r-dot"></span>1 special character
                </div>
              </div>

              <label className="checkbox-row">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span>I agree to the <a href="#">Terms &amp; Conditions</a> and <a href="#">Privacy Policy</a></span>
              </label>

              {detailsAlert && <div className="alert danger">{detailsAlert}</div>}

              <button type="submit" className="btn" disabled={submitting}>{submitting ? "Creating…" : "Create Account"}</button>
              <p className="foot-link">Already have an account? <a href="/login">Login</a></p>
            </form>
          </section>
        )}

        {(step === "email" || step === "mobile" || step === "mfa-verify") && (
          <section className="step-section active center">
            <div className={"step-icon " + (locked || expired || otpError ? "tone-danger" : "tone-primary")}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {channel === "mobile" ? (
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                ) : channel === "mfa" ? (
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                ) : (
                  <>
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-10 5L2 7" />
                  </>
                )}
              </svg>
            </div>

            <h2 className="title">
              {channel === "mobile" ? "Verify your mobile" : channel === "mfa" ? "Enter the 6-digit code" : "Verify your email"}
            </h2>
            <p className="subtitle">
              {channel === "mfa"
                ? mfaMethod === "authenticator" ? "Enter the code from your authenticator app" : `Enter the code sent to ${targetLabel}`
                : <>We have sent a 6-digit code to<br /><strong>{targetLabel}</strong></>}
            </p>

            <form onSubmit={channel === "email" ? handleEmailOtpSubmit : channel === "mobile" ? handleMobileOtpSubmit : handleMfaVerifySubmit}>
              {!locked && !expired && (
                <OtpBoxes value={otpCode} onChange={handleOtpChange} wrongIndex={wrongIndex} autoFocus />
              )}
              {otpError && <div className="alert danger">{otpError}</div>}
              {devHint && !locked && !expired && <p className="dev-hint">{devHint}</p>}

              {!(step === "mfa-verify" && mfaMethod === "authenticator") && !locked && !expired && (
                <div className="meta-row">Code expires in <span className="accent">{formatTime(expirySeconds)}</span></div>
              )}
              {step === "mfa-verify" && mfaMethod === "authenticator" && (
                <div className="meta-row">Code refreshes in <span className="accent">{formatTime(totpSeconds)}</span></div>
              )}

              {!(step === "mfa-verify" && mfaMethod === "authenticator") && !locked && !expired && (
                <div className="link-row">
                  <button type="button" className="btn-link" disabled={resendSeconds > 0} onClick={handleResend}>
                    {resendSeconds > 0 ? `Resend code (${formatTime(resendSeconds)})` : "Resend code"}
                  </button>
                </div>
              )}

              <div className="link-row" style={{ marginTop: 14 }}>
                {!locked && !expired ? (
                  <button type="submit" className="btn" disabled={verifying}>{verifying ? "Verifying…" : "Verify"}</button>
                ) : (
                  <button type="button" className="btn" onClick={handleResend}>Resend New Code</button>
                )}
              </div>

              {step === "mfa-verify" && mfaMethod === "authenticator" ? (
                <p className="foot-link"><button type="button" className="btn-link" onClick={() => setStep("mfa-select")}>Can&apos;t access your app?</button></p>
              ) : (
                <p className="foot-link"><button type="button" className="btn-link" onClick={() => setOtpError("Check your spam folder, or use \u201CResend code\u201D above.")}>Didn&apos;t receive the code?</button></p>
              )}
            </form>
          </section>
        )}

        {step === "mfa-select" && (
          <section className="step-section active center">
            <div className="step-icon tone-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h2 className="title">Set up Multi-Factor Auth</h2>
            <p className="subtitle">Add an extra layer of security to protect your account.</p>

            <form onSubmit={handleMethodSubmit}>
              <div className="method-list">
                {[
                  { value: "authenticator", title: "Authenticator App", sub: "Google Authenticator / Authy" },
                  { value: "sms", title: "SMS Authentication", sub: "Receive codes on your mobile" },
                  { value: "email", title: "Email Authentication", sub: "Receive codes on your email" },
                ].map((m) => (
                  <label key={m.value} className={"method-item" + (mfaMethod === m.value ? " selected" : "")} onClick={() => setMfaMethod(m.value)}>
                    <span className="m-icon" />
                    <span className="m-text">
                      <span className="m-title">{m.title}</span>
                      <span className="m-sub">{m.sub}</span>
                    </span>
                    <input type="radio" name="mfaMethod" checked={mfaMethod === m.value} onChange={() => setMfaMethod(m.value)} />
                  </label>
                ))}
              </div>
              <button type="submit" className="btn" disabled={submitting}>{submitting ? "Setting up…" : "Continue"}</button>
            </form>
          </section>
        )}

        {step === "mfa-qr" && (
          <section className="step-section active center">
            <h2 className="title">Scan QR Code</h2>
            <p className="subtitle">Open your authenticator app and<br />scan this QR code</p>
            <div className="qr-box"><canvas ref={qrCanvasRef} /></div>
            <p className="setup-key">
              <button type="button" className="btn-link" onClick={() => setShowSetupKey((v) => !v)}>Can&apos;t scan? Enter setup key</button>
            </p>
            {showSetupKey && <p className="setup-key"><code>{secret}</code></p>}
            <div className="btn-row">
              <button type="button" className="btn btn-ghost" onClick={() => setStep("mfa-select")}>Back</button>
              <button type="button" className="btn" onClick={handleQrContinue}>Continue</button>
            </div>
          </section>
        )}

        {step === "success" && (
          <section className="step-section active center">
            <div className="step-icon tone-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2 className="title">Account created!</h2>
            <p className="subtitle">Your account has been created successfully and MFA is enabled.</p>
            <ul className="checklist">
              <li>✓ Email verified</li>
              <li>✓ Mobile verified</li>
              <li>✓ MFA enabled</li>
            </ul>
            <button className="btn" onClick={() => router.push("/login")}>Continue to Login</button>
          </section>
        )}
      </div>
    </div>
  );
}
