import React, { useEffect, useRef, useState } from "react";
import { AlertIcon, CheckCircleIcon, EyeIcon, EyeOffIcon, GoogleIcon, Spinner } from "./Icons";

/* ── Page shell ────────────────────────────────────────────────────────────── */

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="auth-page shell" aria-labelledby="auth-title">
      <div className="auth-card">
        <div className="auth-card-head">
          <span className="brand-mark" aria-hidden="true" />
          <h1 id="auth-title">{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
        </div>
        {children}
        {footer && <div className="auth-footer">{footer}</div>}
      </div>
    </section>
  );
}

/* ── Messages ──────────────────────────────────────────────────────────────── */

export function AuthError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="form-error auth-message" role="alert">
      <AlertIcon size={18} />
      <span>{children}</span>
    </div>
  );
}

export function AuthStatus({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="form-success auth-message" role="status">
      <CheckCircleIcon size={18} />
      <span>{children}</span>
    </div>
  );
}

/* ── Fields ────────────────────────────────────────────────────────────────── */

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export function AuthField({ label, error, hint, id, ...props }: FieldProps) {
  const inputId = id || `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const errorId = `${inputId}-error`;
  return (
    <div className="auth-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {hint && !error && <p className="auth-hint">{hint}</p>}
      {error && (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField({
  label = "Password",
  value,
  onChange,
  error,
  autoComplete,
  hint,
  id = "password",
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  autoComplete?: string;
  hint?: string;
  id?: string;
}) {
  const [visible, setVisible] = useState(false);
  const errorId = `${id}-error`;

  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrap">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
        </button>
      </div>
      {hint && !error && <p className="auth-hint">{hint}</p>}
      {error && (
        <p className="field-error" id={errorId}>
          {error}
        </p>
      )}
    </div>
  );
}

/* ── Submit button with spinner ────────────────────────────────────────────── */

export function AuthSubmit({
  children,
  loading,
  disabled,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button className="button primary wide auth-submit" type="submit" disabled={disabled || loading}>
      {loading ? (
        <>
          <Spinner />
          Please wait…
        </>
      ) : (
        children
      )}
    </button>
  );
}

/* ── Google sign-in ────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    __ecoDpiGoogleInitializedFor?: string;
    __ecoDpiGoogleResponseHandler?: (credential?: string) => void;
    google?: {
      accounts?: {
        id?: {
          initialize: (configuration: {
            client_id: string;
            auto_select: boolean;
            cancel_on_tap_outside: boolean;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme: "outline";
              size: "large";
              type: "standard";
              shape: "rectangular";
              text: "continue_with";
              width: number;
              logo_alignment: "left";
            }
          ) => void;
        };
      };
    };
  }
}

const googleClientId =
  (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) || "";

export function GoogleLogin({
  onCredential,
  disabled,
}: {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const [unavailable, setUnavailable] = useState(!googleClientId);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const handleGoogleResponse = (credential?: string) => {
      if (credential) {
        setLoadError("");
        onCredentialRef.current(credential);
      } else {
        setLoadError("Google did not return a sign-in credential. Please try again.");
      }
    };
    window.__ecoDpiGoogleResponseHandler = handleGoogleResponse;

    return () => {
      if (window.__ecoDpiGoogleResponseHandler === handleGoogleResponse) {
        delete window.__ecoDpiGoogleResponseHandler;
      }
    };
  }, []);

  useEffect(() => {
    if (!googleClientId) {
      setUnavailable(true);
      setLoadError("Google sign-in is not configured for this app. Set VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID.");
      return;
    }
    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id || !holderRef.current) {
        setUnavailable(true);
        setLoadError("Google sign-in could not initialize. Check the client ID and authorized site origin.");
        return;
      }
      try {
        if (window.__ecoDpiGoogleInitializedFor !== googleClientId) {
          window.google.accounts.id.initialize({
            client_id: googleClientId,
            auto_select: false,
            cancel_on_tap_outside: true,
            callback: (response) => window.__ecoDpiGoogleResponseHandler?.(response.credential),
          });
          window.__ecoDpiGoogleInitializedFor = googleClientId;
        }
        holderRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(holderRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "rectangular",
          text: "continue_with",
          width: 280,
          logo_alignment: "left",
        });
        setUnavailable(false);
        setLoadError("");
      } catch {
        setUnavailable(true);
        setLoadError("Google sign-in could not initialize. Check the client ID and authorized site origin.");
      }
    };

    const handleError = () => {
      if (cancelled) return;
      setUnavailable(true);
      setLoadError("Google sign-in could not load. Check your connection and try again.");
    };

    const existing = document.getElementById("google-gsi-script") as HTMLScriptElement | null;
    if (window.google?.accounts?.id) {
      init();
    } else if (existing) {
      if (existing.dataset.loaded === "true") {
        handleError();
      } else {
        existing.addEventListener("load", init, { once: true });
        existing.addEventListener("error", handleError, { once: true });
      }
    } else {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        script.dataset.loaded = "true";
        init();
      };
      script.onerror = handleError;
      document.body.appendChild(script);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (unavailable) {
    return (
      <>
        <button
          type="button"
          className="button secondary wide google-button"
          disabled
          title="Google sign-in is not configured on this deployment"
        >
          <GoogleIcon size={20} />
          Continue with Google
        </button>
        {loadError && <p className="auth-hint" role="status">{loadError}</p>}
      </>
    );
  }

  return (
    <>
      <div
        ref={holderRef}
        className="google-button-holder"
        aria-busy={disabled || undefined}
        style={disabled ? { pointerEvents: "none", opacity: 0.6 } : undefined}
      />
      {loadError && <p className="auth-hint" role="status">{loadError}</p>}
    </>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="auth-divider" role="separator" aria-label={label}>
      <span>{label}</span>
    </div>
  );
}
