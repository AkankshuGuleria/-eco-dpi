import React from "react";
import { Page } from "../types";
import "../styles/globals.css";

interface HeaderProps {
  page: Page;
  navigate: (page: Page) => void;
  isAdmin?: boolean;
}

export function Header({ page, navigate, isAdmin = false }: HeaderProps) {
  return (
    <header className="nav shell" aria-label="Primary navigation">
      <button
        className="brand reset-button"
        type="button"
        onClick={() => navigate("home")}
        aria-label="Go to Eco-DPI home"
      >
        <span className="brand-mark" aria-hidden="true" />
        <span>Eco-DPI</span>
      </button>

      <nav className="nav-actions" aria-label="Site pages">
        {(["home", "citizen"] as Page[]).map((p) => (
          <button
            key={p}
            className={`nav-link${page === p ? " active" : ""}`}
            type="button"
            onClick={() => navigate(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
        {isAdmin && (
          <button
            className={`nav-link${page === "admin" ? " active" : ""}`}
            type="button"
            onClick={() => navigate("admin")}
          >
            Admin
          </button>
        )}

        <button
          className="button primary small"
          type="button"
          onClick={() => navigate("login")}
        >
          Login
        </button>
      </nav>
    </header>
  );
}

export function AnimatedBackground() {
  return <div className="scene-bg" aria-hidden="true" />;
}
