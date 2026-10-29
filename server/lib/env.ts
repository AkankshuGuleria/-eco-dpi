/**
 * Server-side environment helpers.
 *
 * No secrets are stored in source. JWT_SECRET must be supplied through the
 * environment; admin access is bootstrapped from ADMIN_EMAILS only.
 */

export function isDev(): boolean {
  return process.env.NODE_ENV !== "production";
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to a random value of at least 32 characters");
  }
  return secret;
}

/**
 * ADMIN_EMAILS is a comma-separated allow-list used only to grant the admin
 * role to an existing/new account. The database role is the source of truth
 * after that and is never downgraded automatically.
 */
export function getAdminEmails(): string[] {
  const raw = [process.env.ADMIN_EMAILS, process.env.ADMIN_EMAIL]
    .filter(Boolean)
    .join(",");
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const admins = getAdminEmails();
  return admins.length > 0 && admins.includes(email.trim().toLowerCase());
}
