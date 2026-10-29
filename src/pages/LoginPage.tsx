import React, { useState } from "react";
import { Page } from "../types";
import {
  loginWithPassword,
  sendOtp,
  verifyOtp,
  verifyGoogleToken,
} from "../api";
import {
  AuthDivider,
  AuthError,
  AuthField,
  AuthLayout,
  AuthStatus,
  AuthSubmit,
  GoogleLogin,
  PasswordField,
} from "../components/AuthUI";
import { Collapsible } from "../components/Reveal";
import "../styles/login.css";

interface LoginPageProps {
  navigate: (page: Page) => void;
  onLoginSuccess: (token: string, user: any) => void;
  locationStatus?: string;
  loading?: boolean;
  onRequestLocation?: (callback: () => void) => void;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function LoginPage({ navigate, onLoginSuccess, onRequestLocation }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // Mobile-code fallback (kept as a secondary, collapsed option)
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sentPhone, setSentPhone] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpBusy, setOtpBusy] = useState(false);

  function afterLogin(token: string, user: any) {
    onLoginSuccess(token, user);
    // Reuse an already-granted location without prompting mid-sign-in.
    if (onRequestLocation && typeof navigator !== "undefined" && navigator.permissions) {
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status) => {
          if (status.state === "granted") onRequestLocation(() => {});
        })
        .catch(() => {});
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");

    const nextErrors: typeof fieldErrors = {};
    if (!email.trim()) nextErrors.email = "Enter your email address.";
    else if (!isValidEmail(email)) nextErrors.email = "Enter a valid email address.";
    if (!password) nextErrors.password = "Enter your password.";
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      const res = await loginWithPassword(email.trim().toLowerCase(), password);
      afterLogin(res.token, res.user);
    } catch (err: any) {
      setErrorMsg(err.message || "We could not sign you in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle(idToken: string) {
    setErrorMsg("");
    setBusy(true);
    try {
      const res = await verifyGoogleToken(idToken);
      afterLogin(res.token, res.user);
    } catch (err: any) {
      setErrorMsg(err.message || "Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    setStatusMsg("");
    setDevOtp(null);
    const digits = phoneNumber.replace(/\D/g, "");
    if (digits.length < 7) {
      setErrorMsg("Enter a valid mobile number.");
      return;
    }
    setOtpBusy(true);
    try {
      const res = await sendOtp(countryCode + digits);
      setOtpSent(true);
      setSentPhone(res.phone);
      if (res.devOtp) setDevOtp(res.devOtp);
      setStatusMsg(
        res.delivery === "sms"
          ? `We sent a 6-digit code to ${res.phone}.`
          : "SMS is not configured here, so the code is shown below instead."
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Could not send the code.");
    } finally {
      setOtpBusy(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");
    if (otp.length !== 6) {
      setErrorMsg("Enter the full 6-digit code.");
      return;
    }
    setOtpBusy(true);
    try {
      const res = await verifyOtp(sentPhone, otp);
      afterLogin(res.token, res.user);
    } catch (err: any) {
      setErrorMsg(err.message || "That code is invalid or has expired.");
    } finally {
      setOtpBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Track reports, follow local issues, and pick up where you left off."
      footer={
        <>
          <p>
            New to Eco-DPI?{" "}
            <button type="button" className="link-button" onClick={() => navigate("signup")}>
              Create an account
            </button>
          </p>
          <p>
            <button type="button" className="link-button muted-link" onClick={() => navigate("admin-login")}>
              Administrator sign in
            </button>
          </p>
        </>
      }
    >
      <AuthError>{errorMsg}</AuthError>
      <AuthStatus>{statusMsg}</AuthStatus>

      <GoogleLogin onCredential={handleGoogle} disabled={busy} />
      <AuthDivider />

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        <AuthField
          label="Email address"
          id="login-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined }));
          }}
          error={fieldErrors.email}
        />

        <PasswordField
          id="login-password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
          }}
          error={fieldErrors.password}
          autoComplete="current-password"
        />

        <AuthSubmit loading={busy}>Sign in</AuthSubmit>
      </form>

      <Collapsible title="Sign in with a mobile code" defaultOpen={false} className="auth-secondary">
        {!otpSent ? (
          <form onSubmit={handleSendOtp} noValidate className="auth-form">
            <p className="auth-hint">
              We will send a one-time 6-digit code. No password needed.
            </p>
            <div className="auth-field">
              <label htmlFor="login-phone">Mobile number</label>
              <div className="phone-row">
                <select
                  id="login-country-code"
                  aria-label="Country calling code"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  <option value="+91">India +91</option>
                  <option value="+1">USA +1</option>
                  <option value="+44">UK +44</option>
                  <option value="+61">Australia +61</option>
                  <option value="+971">UAE +971</option>
                  <option value="+65">Singapore +65</option>
                  <option value="+49">Germany +49</option>
                  <option value="+33">France +33</option>
                </select>
                <input
                  id="login-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^\d\s-]/g, ""))}
                />
              </div>
            </div>
            <AuthSubmit loading={otpBusy}>Send code</AuthSubmit>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} noValidate className="auth-form">
            <p className="auth-hint">
              Code sent to <strong>{sentPhone}</strong>.
            </p>
            {devOtp && (
              <div className="dev-code" role="note">
                <span>Development code</span>
                <strong>{devOtp}</strong>
                <button type="button" className="link-button" onClick={() => setOtp(devOtp)}>
                  Use this code
                </button>
              </div>
            )}
            <AuthField
              label="6-digit code"
              id="login-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
            <AuthSubmit loading={otpBusy}>Verify and continue</AuthSubmit>
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setOtpSent(false);
                setOtp("");
                setDevOtp(null);
                setStatusMsg("");
              }}
            >
              Use a different number
            </button>
          </form>
        )}
      </Collapsible>
    </AuthLayout>
  );
}
