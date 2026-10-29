import { Page } from "./types";

/** Canonical URL path for every page. Used for the address bar and history. */
const PATH_BY_PAGE: Record<Page, string> = {
  home: "/",
  login: "/login",
  signup: "/signup",
  "admin-login": "/admin/login",
  citizen: "/dashboard",
  admin: "/admin",
  demo: "/demo",
  "eco-learn": "/eco-learn",
  "take-action": "/take-action",
  privacy: "/privacy",
};

const PAGE_BY_PATH = new Map<string, Page>(
  Object.entries(PATH_BY_PAGE).map(([page, path]) => [path, page as Page])
);

/** Pages that never require a signed-in user. */
export const PUBLIC_PAGES: Page[] = [
  "home",
  "login",
  "signup",
  "admin-login",
  "demo",
  "eco-learn",
  "take-action",
  "privacy",
];

export function pathForPage(page: Page): string {
  return PATH_BY_PAGE[page] ?? "/";
}

export function pageFromPath(pathname: string): Page {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return PAGE_BY_PATH.get(clean) ?? "home";
}

/**
 * Only allow internal, known paths as a post-login redirect target.
 * Prevents open-redirects such as ?next=https://evil.example.
 */
export function safeNextPath(value: string | null): Page | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  const page = pageFromPath(value.split("?")[0]);
  return page === "home" && value !== "/" ? null : page;
}

export function currentNextPath(): Page | null {
  if (typeof window === "undefined") return null;
  return safeNextPath(new URLSearchParams(window.location.search).get("next"));
}
