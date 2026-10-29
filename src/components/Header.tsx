import React, { useEffect, useRef, useState } from "react";
import { Page, AppUser } from "../types";
import { CloseIcon, LogOutIcon, MenuIcon, ShieldIcon } from "./Icons";
import "../styles/globals.css";

interface HeaderProps {
  page: Page;
  navigate: (page: Page) => void;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
  user?: AppUser | null;
  onLogout?: () => void;
}

function displayName(user?: AppUser | null): string {
  if (!user) return "Account";
  if (user.name && user.name.trim()) return user.name.trim();
  if (user.email) return user.email.split("@")[0];
  if (user.phone) return user.phone;
  return "Account";
}

export function Header({
  page,
  navigate,
  isAdmin = false,
  isLoggedIn = false,
  user = null,
  onLogout,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  // Close the mobile panel on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [page]);

  // Escape closes the panel; lock background scrolling while it is open.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.classList.add("no-scroll");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.classList.remove("no-scroll");
    };
  }, [menuOpen]);

  function nav(p: Page) {
    navigate(p);
    setMenuOpen(false);
  }

  function handleLogout() {
    onLogout?.();
    setMenuOpen(false);
  }

  const name = displayName(user);
  const initial = name.charAt(0).toUpperCase();

  const primaryLinks: { page: Page; label: string }[] = [
    { page: "home", label: "Home" },
    { page: "eco-learn", label: "Eco-Learn" },
    { page: "take-action", label: "Take Action" },
    { page: "citizen", label: "Report an Issue" },
  ];

  return (
    <header className="nav shell" aria-label="Primary navigation">
      <button
        className="brand reset-button"
        type="button"
        onClick={() => nav("home")}
        aria-label="Eco-DPI home"
      >
        <span className="brand-mark" aria-hidden="true" />
        <span>Eco-DPI</span>
      </button>

      <nav className="nav-actions" aria-label="Site pages">
        {primaryLinks.map((link) => (
          <button
            key={link.page}
            className={`nav-link${page === link.page ? " active" : ""}`}
            type="button"
            aria-current={page === link.page ? "page" : undefined}
            onClick={() => nav(link.page)}
          >
            {link.label}
          </button>
        ))}

        {isAdmin && (
          <button
            className={`nav-link${page === "admin" ? " active" : ""}`}
            type="button"
            aria-current={page === "admin" ? "page" : undefined}
            onClick={() => nav("admin")}
          >
            Admin
          </button>
        )}

        {isLoggedIn ? (
          <>
            <span className="nav-user" title={user?.email || name}>
              <span className="nav-avatar" aria-hidden="true">{initial}</span>
              <span className="nav-user-name">{name}</span>
            </span>
            <button
              className="button ghost small"
              type="button"
              onClick={handleLogout}
            >
              <LogOutIcon size={18} />
              Sign out
            </button>
          </>
        ) : (
          <>
            <button className="button ghost small" type="button" onClick={() => nav("login")}>
              Sign in
            </button>
            <button className="button primary small" type="button" onClick={() => nav("signup")}>
              Create account
            </button>
          </>
        )}
      </nav>

      <button
        ref={hamburgerRef}
        className="nav-hamburger"
        type="button"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        aria-controls="mobile-navigation"
        onClick={() => setMenuOpen((v) => !v)}
      >
        {menuOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
      </button>

      {menuOpen && (
        <nav id="mobile-navigation" className="nav-mobile-panel" aria-label="Mobile navigation">
          {isLoggedIn && (
            <div className="nav-user-row">
              <span className="nav-avatar" aria-hidden="true">{initial}</span>
              <span>
                <strong>{name}</strong>
                <small>{isAdmin ? "Administrator" : "Citizen"}</small>
              </span>
            </div>
          )}

          {primaryLinks.map((link) => (
            <button
              key={link.page}
              className={`nav-link${page === link.page ? " active" : ""}`}
              type="button"
              aria-current={page === link.page ? "page" : undefined}
              onClick={() => nav(link.page)}
            >
              {link.label}
            </button>
          ))}

          {isAdmin && (
            <button
              className={`nav-link${page === "admin" ? " active" : ""}`}
              type="button"
              aria-current={page === "admin" ? "page" : undefined}
              onClick={() => nav("admin")}
            >
              <ShieldIcon size={18} />
              Admin dashboard
            </button>
          )}

          <div className="nav-divider" />

          {isLoggedIn ? (
            <button className="button secondary wide" type="button" onClick={handleLogout}>
              <LogOutIcon size={18} />
              Sign out
            </button>
          ) : (
            <>
              <button className="button secondary wide" type="button" onClick={() => nav("login")}>
                Sign in
              </button>
              <button className="button primary wide" type="button" onClick={() => nav("signup")}>
                Create account
              </button>
            </>
          )}

        </nav>
      )}
    </header>
  );
}

export function AnimatedBackground() {
  return <div className="scene-bg" aria-hidden="true" />;
}
