import React, { useState } from "react";
import { Page } from "../types";
import { registerWithPassword } from "../api";
import {
  AuthError,
  AuthField,
  AuthLayout,
  AuthSubmit,
  PasswordField,
} from "../components/AuthUI";
import "../styles/login.css";

interface SignupPageProps {
  navigate: (page: Page) => void;
  onLoginSuccess: (token: string, user: any) => void;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

export function SignupPage({ navigate, onLoginSuccess }: SignupPageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const next: Record<string, string | undefined> = {};
    if (name.trim().length < 2) next.name = "Enter your name (at least 2 characters).";
    if (!email.trim()) next.email = "Enter your email address.";
    else if (!isValidEmail(email)) next.email = "Enter a valid email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    if (confirm !== password) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const res = await registerWithPassword(email.trim().toLowerCase(), password, name.trim());
      onLoginSuccess(res.token, res.user);
    } catch (err: any) {
      setErrorMsg(err.message || "We could not create your account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Report local environmental issues and keep track of the response."
      footer={
        <p>
          Already have an account?{" "}
          <button type="button" className="link-button" onClick={() => navigate("login")}>
            Sign in
          </button>
        </p>
      }
    >
      <AuthError>{errorMsg}</AuthError>

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        <AuthField
          label="Full name"
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
          }}
          error={errors.name}
        />

        <AuthField
          label="Email address"
          id="signup-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
          }}
          error={errors.email}
        />

        <PasswordField
          id="signup-password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
          }}
          error={errors.password}
          hint="At least 8 characters."
          autoComplete="new-password"
        />

        <PasswordField
          id="signup-confirm"
          label="Confirm password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            if (errors.confirm) setErrors((p) => ({ ...p, confirm: undefined }));
          }}
          error={errors.confirm}
          autoComplete="new-password"
        />

        <AuthSubmit loading={busy}>Create account</AuthSubmit>
      </form>

      <p className="auth-legal">
        By creating an account you agree to use Eco-DPI responsibly. We do not publish your
        email address or phone number.
      </p>
    </AuthLayout>
  );
}
