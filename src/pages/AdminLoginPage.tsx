import React, { useState } from "react";
import { Page } from "../types";
import { loginAsAdmin } from "../api";
import {
  AuthError,
  AuthField,
  AuthLayout,
  AuthSubmit,
  PasswordField,
} from "../components/AuthUI";
import { ShieldIcon } from "../components/Icons";
import "../styles/login.css";

interface AdminLoginPageProps {
  navigate: (page: Page) => void;
  onLoginSuccess: (token: string, user: any) => void;
}

export function AdminLoginPage({ navigate, onLoginSuccess }: AdminLoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [errorMsg, setErrorMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    const next: typeof errors = {};
    if (!email.trim()) next.email = "Enter your administrator email.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setBusy(true);
    try {
      const res = await loginAsAdmin(email.trim().toLowerCase(), password);
      onLoginSuccess(res.token, res.user);
    } catch (err: any) {
      setErrorMsg(err.message || "Administrator sign-in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout
      title="Administrator sign in"
      subtitle="Restricted access. Administrator accounts are created by an existing administrator — there is no public admin sign-up."
      footer={
        <p>
          Not an administrator?{" "}
          <button type="button" className="link-button" onClick={() => navigate("login")}>
            Go to citizen sign in
          </button>
        </p>
      }
    >
      <div className="admin-auth-note" role="note">
        <ShieldIcon size={20} />
        <span>Your role is verified on the server for every administrator action.</span>
      </div>

      <AuthError>{errorMsg}</AuthError>

      <form onSubmit={handleSubmit} noValidate className="auth-form">
        <AuthField
          label="Administrator email"
          id="admin-email"
          type="email"
          inputMode="email"
          autoComplete="username"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
          }}
          error={errors.email}
        />

        <PasswordField
          id="admin-password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
          }}
          error={errors.password}
          autoComplete="current-password"
        />

        <AuthSubmit loading={busy}>Sign in to admin</AuthSubmit>
      </form>
    </AuthLayout>
  );
}
