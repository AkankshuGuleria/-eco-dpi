import React, { useState } from "react";
import { registerWithPassword, loginWithPassword, sendOtp, verifyOtp, loginWithGoogleDirect } from "../api";
import "../styles/login.css";

interface LoginPageProps {
  onLoginSuccess: (token: string, user: any) => void;
  locationStatus: string;
  loading: boolean;
  onRequestLocation: (callback: () => void) => void;
}

type AuthMethod = "email" | "otp" | "google";

export function LoginPage({ onLoginSuccess, locationStatus, loading, onRequestLocation }: LoginPageProps) {
  const [method, setMethod] = useState<AuthMethod>("email");
  const [isRegister, setIsRegister] = useState(false);

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // OTP state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Error/Message state
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const clearMessages = () => {
    setErrorMsg("");
    setStatusMsg("");
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    clearMessages();
    setActionLoading(true);

    try {
      onRequestLocation(async () => {
        try {
          let res;
          if (isRegister) {
            res = await registerWithPassword(email, password);
            setStatusMsg("Account registered successfully! Logging you in...");
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
    } catch (err: any) {
      setErrorMsg("Location access is required to login.");
      setActionLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setErrorMsg("Please enter your mobile number.");
      return;
    }
    clearMessages();
    setActionLoading(true);
    try {
      await sendOtp(phone);
      setOtpSent(true);
      setStatusMsg("OTP sent successfully! Check your server console (dev simulation).");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to send OTP.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setErrorMsg("Please enter the OTP.");
      return;
    }
    clearMessages();
    setActionLoading(true);
    try {
      onRequestLocation(async () => {
        try {
          const res = await verifyOtp(phone, otp);
          onLoginSuccess(res.token, res.user);
        } catch (err: any) {
          setErrorMsg(err.message || "OTP verification failed.");
        } finally {
          setActionLoading(false);
        }
      });
    } catch (err) {
      setErrorMsg("Location access is required to login.");
      setActionLoading(false);
    }
  };

  const handleGoogleMockLogin = async () => {
    clearMessages();
    // Simulate interactive OAuth popup/input for demo
    const gmail = prompt("Enter your Gmail address to sign in via Google direct login:", "akankshuguleria2000@gmail.com");
    if (!gmail) return;
    if (!gmail.includes("@")) {
      alert("Invalid email");
      return;
    }

    setActionLoading(true);
    const googleId = "google_" + Math.random().toString(36).substring(2, 11);

    try {
      onRequestLocation(async () => {
        try {
          const res = await loginWithGoogleDirect(gmail, googleId, gmail.split("@")[0]);
          onLoginSuccess(res.token, res.user);
        } catch (err: any) {
          setErrorMsg(err.message || "Google Authentication failed.");
        } finally {
          setActionLoading(false);
        }
      });
    } catch (err) {
      setErrorMsg("Location access is required to login.");
      setActionLoading(false);
    }
  };

  return (
    <section className="auth-page shell" aria-labelledby="login-title">
      <div className="auth-copy">
        <p className="signal">Location required</p>
        <h1 id="login-title">Login opens the map around you.</h1>
        <p>
          Eco-DPI needs your device location so nearby reports, clusters,
          and add-to-report actions are shown for the area around Chandigarh.
          Authenticate securely using Email/Password, Mobile OTP or Google Sign-In.
        </p>
      </div>

      <div className="auth-card clay-card">
        <div className="auth-tabs" style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button
            className={`choice button-tab ${method === "email" ? "active" : ""}`}
            type="button"
            style={{ flex: 1, padding: "0.5rem", borderRadius: "8px", background: method === "email" ? "var(--accent)" : "rgba(255,255,255,0.05)", border: "none", color: "#fff", cursor: "pointer" }}
            onClick={() => { setMethod("email"); clearMessages(); }}
          >
            Email
          </button>
          <button
            className={`choice button-tab ${method === "otp" ? "active" : ""}`}
            type="button"
            style={{ flex: 1, padding: "0.5rem", borderRadius: "8px", background: method === "otp" ? "var(--accent)" : "rgba(255,255,255,0.05)", border: "none", color: "#fff", cursor: "pointer" }}
            onClick={() => { setMethod("otp"); clearMessages(); }}
          >
            Mobile OTP
          </button>
          <button
            className={`choice button-tab ${method === "google" ? "active" : ""}`}
            type="button"
            style={{ flex: 1, padding: "0.5rem", borderRadius: "8px", background: method === "google" ? "var(--accent)" : "rgba(255,255,255,0.05)", border: "none", color: "#fff", cursor: "pointer" }}
            onClick={() => { setMethod("google"); clearMessages(); }}
          >
            Google
          </button>
        </div>

        {errorMsg && (
          <div className="error-banner" style={{ background: "rgba(240, 80, 80, 0.2)", borderLeft: "4px solid red", padding: "0.8rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {statusMsg && (
          <div className="status-banner" style={{ background: "rgba(80, 220, 100, 0.2)", borderLeft: "4px solid var(--accent)", padding: "0.8rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem" }}>
            ℹ️ {statusMsg}
          </div>
        )}

        {method === "email" && (
          <form onSubmit={handleEmailAuth} noValidate>
            <div style={{ marginBottom: "1rem" }}>
              <label htmlFor="email-input" style={{ display: "block", marginBottom: "0.3rem" }}>Email address</label>
              <input
                id="email-input"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
              />
            </div>
            <div style={{ marginBottom: "1.5rem" }}>
              <label htmlFor="password-input" style={{ display: "block", marginBottom: "0.3rem" }}>Password</label>
              <input
                id="password-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
              />
            </div>

            <div className="location-badge" role="status" style={{ marginBottom: "1rem" }}>
              <div className="location-badge-icon" aria-hidden="true">📍</div>
              <p>{locationStatus}</p>
            </div>

            <button className="button primary wide" type="submit" disabled={loading || actionLoading}>
              {loading || actionLoading ? "Please wait…" : isRegister ? "Register & Verify Location" : "Sign In & Verify Location"}
            </button>

            <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
              <span
                style={{ color: "var(--accent)", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => { setIsRegister(!isRegister); clearMessages(); }}
              >
                {isRegister ? "Already have an account? Sign In" : "Need an account? Register here"}
              </span>
            </p>
          </form>
        )}

        {method === "otp" && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="phone-input" style={{ display: "block", marginBottom: "0.3rem" }}>Mobile Number</label>
                  <input
                    id="phone-input"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff" }}
                  />
                </div>
                <button className="button primary wide" type="submit" disabled={actionLoading}>
                  {actionLoading ? "Sending OTP..." : "Request OTP Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ marginBottom: "1.5rem" }}>
                  <label htmlFor="otp-input" style={{ display: "block", marginBottom: "0.3rem" }}>Enter 6-Digit OTP</label>
                  <input
                    id="otp-input"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    style={{ width: "100%", padding: "0.8rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "#fff", letterSpacing: "4px", textAlign: "center", fontSize: "1.2rem" }}
                  />
                </div>

                <div className="location-badge" role="status" style={{ marginBottom: "1rem" }}>
                  <div className="location-badge-icon" aria-hidden="true">📍</div>
                  <p>{locationStatus}</p>
                </div>

                <button className="button primary wide" type="submit" disabled={loading || actionLoading}>
                  {loading || actionLoading ? "Verifying..." : "Verify & Continue"}
                </button>
                <p style={{ textAlign: "center", marginTop: "1rem" }}>
                  <span
                    style={{ color: "var(--accent)", cursor: "pointer", fontSize: "0.9rem" }}
                    onClick={() => { setOtpSent(false); clearMessages(); }}
                  >
                    Change phone number
                  </span>
                </p>
              </form>
            )}
          </div>
        )}

        {method === "google" && (
          <div style={{ textAlign: "center", padding: "1rem 0" }}>
            <p style={{ marginBottom: "1.5rem", color: "var(--quiet)" }}>
              One-click secure verification using Google account.
            </p>
            <button
              onClick={handleGoogleMockLogin}
              className="button secondary wide"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", padding: "1rem", borderRadius: "8px" }}
              type="button"
              disabled={loading || actionLoading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.8H9v3.4h4.8c-.2 1.1-.8 2-1.8 2.6v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.4z"/>
                <path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.8-3.1.8-2.4 0-4.4-1.6-5.1-3.8H.9v2.3C2.4 15.9 5.5 18 9 18z"/>
                <path fill="#FBBC05" d="M3.9 10.6c-.2-.5-.3-1.1-.3-1.6s.1-1.1.3-1.6V5.1H.9C.3 6.3 0 7.6 0 9s.3 2.7.9 3.9l3-2.3z"/>
                <path fill="#EA4335" d="M9 3.6c1.3 0 2.5.4 3.4 1.3l2.6-2.6C13.4 1 11.4 0 9 0 5.5 0 2.4 2.1.9 5.1l3 2.3c.7-2.2 2.7-3.8 5.1-3.8z"/>
              </svg>
              Sign in with Google Direct
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
