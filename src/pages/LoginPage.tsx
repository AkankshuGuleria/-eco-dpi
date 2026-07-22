import React, { useState, useRef, useEffect } from "react";
import { registerWithPassword, loginWithPassword, sendOtp, verifyOtp, loginWithGoogleDirect } from "../api";
import "../styles/login.css";

interface LoginPageProps {
  onLoginSuccess: (token: string, user: any) => void;
  locationStatus: string;
  loading: boolean;
  onRequestLocation: (callback: () => void) => void;
}

type AuthMethod = "email" | "otp" | "google";
const googleDirectEnabled = import.meta.env.DEV || import.meta.env.VITE_ALLOW_INSECURE_GOOGLE_DIRECT === "true";
const authMethods: AuthMethod[] = googleDirectEnabled ? ["email", "otp", "google"] : ["email", "otp"];

export function LoginPage({ onLoginSuccess, locationStatus, loading, onRequestLocation }: LoginPageProps) {
  const [method, setMethod] = useState<AuthMethod>("email");
  const [isRegister, setIsRegister] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 3-D card tilt effect
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const card = el;
    function onMove(e: MouseEvent) {
      const { left, top, width, height } = card.getBoundingClientRect();
      const rx = ((e.clientY - top) / height - 0.5) * 10;
      const ry = ((e.clientX - left) / width - 0.5) * -10;
      card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.005,1.005,1.005)`;
    }
    function onLeave() {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)";
    }
    card.addEventListener("mousemove", onMove);
    card.addEventListener("mouseleave", onLeave);
    return () => {
      card.removeEventListener("mousemove", onMove);
      card.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // ── Email/Password state ──────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── Phone OTP state ───────────────────────────────────────────────────────
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sentPhone, setSentPhone] = useState(""); // normalised phone returned by server
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpDelivery, setOtpDelivery] = useState<"sms" | "console" | null>(null);

  // ── Google state ──────────────────────────────────────────────────────────
  const [googleEmail, setGoogleEmail] = useState("");

  // ── Messages ──────────────────────────────────────────────────────────────
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const clearMessages = () => { setErrorMsg(""); setStatusMsg(""); };

  // ── Email/Password auth ───────────────────────────────────────────────────
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setErrorMsg("Please fill in all fields."); return; }
    clearMessages();
    setActionLoading(true);
    try {
      onRequestLocation(async () => {
        try {
          let res;
          if (isRegister) {
            res = await registerWithPassword(email, password);
            setStatusMsg("Account registered! Logging you in…");
          } else {
            res = await loginWithPassword(email, password);
          }
          onLoginSuccess(res.token, res.user);
        } catch (err: any) {
          setErrorMsg(err.message || "Email authentication failed.");
        } finally {
          setActionLoading(false);
        }
      });
    } catch {
      setErrorMsg("Location access required.");
      setActionLoading(false);
    }
  };

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawDigits = phoneNumber.replace(/\D/g, "");
    if (!rawDigits || rawDigits.length < 7) {
      setErrorMsg("Please enter a valid phone number.");
      return;
    }
    clearMessages();
    setActionLoading(true);
    setDevOtp(null);
    try {
      const fullPhone = countryCode + rawDigits;
      const res = await sendOtp(fullPhone);
      setOtpSent(true);
      setSentPhone(res.phone || fullPhone);
      setOtpDelivery(res.delivery);

      if (res.delivery === "sms") {
        setStatusMsg(`OTP sent to ${res.phone} via SMS. Enter the 6-digit code below.`);
      } else {
        setStatusMsg("Twilio not configured — check the server console for the OTP code.");
      }
      if (res.devOtp) setDevOtp(res.devOtp);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send OTP.");
    } finally {
      setActionLoading(false);
    }
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) { setErrorMsg("Please enter the full 6-digit OTP."); return; }
    clearMessages();
    setActionLoading(true);
    try {
      onRequestLocation(async () => {
        try {
          const res = await verifyOtp(sentPhone, otp);
          onLoginSuccess(res.token, res.user);
        } catch (err: any) {
          setErrorMsg(err.message || "OTP verification failed.");
        } finally {
          setActionLoading(false);
        }
      });
    } catch {
      setErrorMsg("Location access required.");
      setActionLoading(false);
    }
  };

  // ── Google Direct Login ───────────────────────────────────────────────────
  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes("@")) {
      setErrorMsg("Please enter a valid Gmail address.");
      return;
    }
    clearMessages();
    setActionLoading(true);
    const googleId = "google_direct_" + btoa(googleEmail.toLowerCase()).replace(/[^a-z0-9]/gi, "").substring(0, 16);
    try {
      onRequestLocation(async () => {
        try {
          const res = await loginWithGoogleDirect(googleEmail.trim(), googleId, googleEmail.split("@")[0]);
          onLoginSuccess(res.token, res.user);
        } catch (err: any) {
          setErrorMsg(err.message || "Google authentication failed.");
        } finally {
          setActionLoading(false);
        }
      });
    } catch {
      setErrorMsg("Location access required.");
      setActionLoading(false);
    }
  };

  // ── Shared UI helpers ─────────────────────────────────────────────────────
  const locationBadge = (
    <div className="location-badge" role="status" style={{ marginBottom: "1rem" }}>
      <div className="location-badge-icon" aria-hidden="true">📍</div>
      <p>{locationStatus}</p>
    </div>
  );

  return (
    <section className="auth-page shell" aria-labelledby="login-title">
      <div className="auth-copy">
        <p className="signal">Location required</p>
        <h1 id="login-title">Login opens the map around you.</h1>
        <p>
          Eco-DPI needs your device location so nearby reports, clusters,
          and add-to-report actions are shown around you or the demo area.
          Authenticate using Email/Password or Mobile OTP.
        </p>
      </div>

      <div ref={cardRef} className="auth-card clay-card">
        {/* ── Tab switcher ─────────────────────────────────────────────── */}
        <div className="auth-tabs">
          {authMethods.map((m) => (
            <button
              key={m}
              className={`choice button-tab ${method === m ? "active" : ""}`}
              type="button"
              onClick={() => { setMethod(m); clearMessages(); }}
            >
              {m === "email" ? "Email" : m === "otp" ? "Mobile OTP" : "Google"}
            </button>
          ))}
        </div>

        {/* ── Error ────────────────────────────────────────────────────── */}
        {errorMsg && (
          <div role="alert" style={{ background: "rgba(240,80,80,0.15)", borderLeft: "4px solid #f55", padding: "0.8rem 1rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem", color: "#fcc" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* ── Status ───────────────────────────────────────────────────── */}
        {statusMsg && (
          <div role="status" style={{ background: "rgba(80,220,100,0.12)", borderLeft: "4px solid var(--accent)", padding: "0.8rem 1rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem", color: "#9f9" }}>
            ✅ {statusMsg}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB: Email / Password                                         */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {method === "email" && (
          <form onSubmit={handleEmailAuth} noValidate>
            <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <input
                id="admin-login-check"
                type="checkbox"
                checked={isAdminLogin}
                onChange={(e) => setIsAdminLogin(e.target.checked)}
                style={{ width: "auto", minHeight: "auto" }}
              />
              <label htmlFor="admin-login-check" style={{ marginBottom: 0, cursor: "pointer" }}>
                Login as administrator
              </label>
            </div>
            {isAdminLogin && (
              <p style={{ fontSize: "0.82rem", color: "var(--quiet)", marginBottom: "1rem" }}>
                Use the authorised administrator email. Only admin credentials grant access to the admin panel.
              </p>
            )}

            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="email-input" style={{ display: "block", marginBottom: "0.3rem" }}>Email address</label>
              <input id="email-input" type="email" placeholder="example@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)}
                autoComplete="email" required />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="password-input" style={{ display: "block", marginBottom: "0.3rem" }}>Password</label>
              <input id="password-input" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? "new-password" : "current-password"} required />
            </div>

            {locationBadge}

            <button className="button primary wide" type="submit" disabled={loading || actionLoading}>
              {loading || actionLoading ? "Please wait…" : isRegister ? "Register & Verify Location" : "Sign In & Verify Location"}
            </button>

            <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
              <span style={{ color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => { setIsRegister(!isRegister); clearMessages(); }}>
                {isRegister ? "Already have an account? Sign In" : "Need an account? Register here"}
              </span>
            </p>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB: Mobile OTP                                               */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {method === "otp" && (
          <div>
            {!otpSent ? (
              /* ── Step 1: Enter phone number ─── */
              <form onSubmit={handleSendOtp} noValidate>
                <p style={{ fontSize: "0.85rem", color: "var(--quiet)", marginBottom: "1.2rem", lineHeight: 1.5 }}>
                  Enter your mobile number and we'll send a 6-digit OTP to log you in — no password needed.
                </p>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="phone-input" style={{ display: "block", marginBottom: "0.4rem" }}>
                    Mobile number
                  </label>
                  {/* Country code + number row */}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <select
                      id="country-code"
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      style={{
                        width: "90px", flexShrink: 0,
                        background: "var(--glass, rgba(255,255,255,0.06))",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: "8px", color: "inherit",
                        padding: "0.7rem 0.4rem", fontSize: "0.9rem",
                        cursor: "pointer"
                      }}
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+971">🇦🇪 +971</option>
                      <option value="+65">🇸🇬 +65</option>
                      <option value="+49">🇩🇪 +49</option>
                      <option value="+33">🇫🇷 +33</option>
                      <option value="+86">🇨🇳 +86</option>
                      <option value="+81">🇯🇵 +81</option>
                    </select>
                    <input
                      id="phone-input"
                      type="tel"
                      inputMode="tel"
                      placeholder="98765 43210"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s\-]/g, ""))}
                      autoComplete="tel-national"
                      required
                      style={{ flex: 1 }}
                    />
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--quiet)", marginTop: "0.3rem", opacity: 0.7 }}>
                    Enter digits only — country code is selected above.
                  </p>
                </div>

                <button className="button primary wide" type="submit" disabled={actionLoading}>
                  {actionLoading ? "Sending OTP…" : "Send OTP Code"}
                </button>
              </form>
            ) : (
              /* ── Step 2: Enter OTP ────────────── */
              <form onSubmit={handleVerifyOtp} noValidate>
                <p style={{ fontSize: "0.85rem", color: "var(--quiet)", marginBottom: "1rem", lineHeight: 1.5 }}>
                  OTP sent to <strong style={{ color: "var(--accent)" }}>{sentPhone}</strong>
                  {otpDelivery === "console" && (
                    <span style={{ color: "#fc0", fontSize: "0.78rem" }}> (Twilio not configured — check server console)</span>
                  )}
                </p>

                {/* ── Dev OTP display box ───────────────────────────── */}
                {devOtp && (
                  <div
                    role="note"
                    style={{
                      background: "rgba(255,200,0,0.08)",
                      border: "1px dashed rgba(255,200,0,0.45)",
                      borderRadius: "10px",
                      padding: "1rem",
                      marginBottom: "1rem",
                      textAlign: "center"
                    }}
                  >
                    <p style={{ margin: "0 0 6px", fontSize: "0.72rem", color: "#fc0", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      🛠 Dev Mode — Twilio not configured
                    </p>
                    <p style={{ margin: "0 0 2px", fontSize: "0.78rem", color: "#aaa" }}>Your OTP is:</p>
                    <p style={{ margin: "0 0 8px", fontSize: "2.4rem", fontWeight: 800, letterSpacing: "0.35em", color: "#fff", fontVariantNumeric: "tabular-nums" }}>
                      {devOtp}
                    </p>
                    <button
                      type="button"
                      onClick={() => setOtp(devOtp)}
                      style={{
                        fontSize: "0.78rem", color: "var(--accent)", background: "rgba(74,222,128,0.1)",
                        border: "1px solid rgba(74,222,128,0.25)", borderRadius: "4px",
                        cursor: "pointer", padding: "3px 10px"
                      }}
                    >
                      Auto-fill ↓
                    </button>
                  </div>
                )}

                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="otp-input" style={{ display: "block", marginBottom: "0.4rem" }}>
                    6-Digit OTP
                  </label>
                  <input
                    id="otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="1 2 3 4 5 6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").substring(0, 6))}
                    required
                    className="otp-input"
                    style={{ letterSpacing: "0.4em", fontSize: "1.4rem", textAlign: "center" }}
                  />
                </div>

                {locationBadge}

                <button className="button primary wide" type="submit" disabled={loading || actionLoading}>
                  {loading || actionLoading ? "Verifying…" : "Verify & Continue"}
                </button>

                <p style={{ textAlign: "center", marginTop: "1rem" }}>
                  <span
                    style={{ color: "var(--accent)", cursor: "pointer", fontSize: "0.9rem", textDecoration: "underline" }}
                    onClick={() => { setOtpSent(false); setDevOtp(null); setOtp(""); clearMessages(); }}
                  >
                    ← Change phone number
                  </span>
                </p>
              </form>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* TAB: Google Sign-In                                           */}
        {/* ══════════════════════════════════════════════════════════════ */}
        {method === "google" && (
          <form onSubmit={handleGoogleLogin} noValidate>
            <p style={{ fontSize: "0.85rem", color: "var(--quiet)", marginBottom: "0.6rem", lineHeight: 1.5 }}>
              Sign in using your Google account. Enter your Gmail address to authenticate.
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--quiet)", marginBottom: "1.4rem", lineHeight: 1.4, opacity: 0.65 }}>
              Note: This uses direct server-side Google verification. For the real OAuth popup, configure <code>GOOGLE_CLIENT_ID</code> in your environment (see TODO.md).
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="google-email-input" style={{ display: "block", marginBottom: "0.3rem" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <svg width="15" height="15" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.4z"/>
                    <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.8-3.1.8-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 15.9 5.5 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.9 10.6c-.2-.5-.3-1.1-.3-1.6s.1-1.1.3-1.6V5.1H.9C.3 6.3 0 7.6 0 9s.3 2.7.9 3.9l3-2.3z"/>
                    <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.4 3.4 1.3l2.6-2.6C13.4 1 11.4 0 9 0 5.5 0 2.4 2.1.9 5.1l3 2.3c.7-2.2 2.7-3.8 5.1-3.8z"/>
                  </svg>
                  Gmail address
                </span>
              </label>
              <input
                id="google-email-input"
                type="email"
                placeholder="yourname@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {locationBadge}

            <button
              className="button secondary wide"
              type="submit"
              disabled={loading || actionLoading}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.6rem", padding: "0.9rem 1rem" }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.4z"/>
                <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.8-3.1.8-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 15.9 5.5 18 9 18z"/>
                <path fill="#FBBC05" d="M3.9 10.6c-.2-.5-.3-1.1-.3-1.6s.1-1.1.3-1.6V5.1H.9C.3 6.3 0 7.6 0 9s.3 2.7.9 3.9l3-2.3z"/>
                <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.4 3.4 1.3l2.6-2.6C13.4 1 11.4 0 9 0 5.5 0 2.4 2.1.9 5.1l3 2.3c.7-2.2 2.7-3.8 5.1-3.8z"/>
              </svg>
              {loading || actionLoading ? "Please wait…" : "Sign in with Google"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
