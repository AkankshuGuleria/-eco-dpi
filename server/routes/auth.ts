import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User.js";
import OtpSession from "../models/OtpSession.js";
import { requireAuth } from "../middleware/auth.js";
import { getJwtSecret, isAdminEmail, isDev } from "../lib/env.js";

const router = Router();

// Auth responses must never be cached by a browser or proxy.
router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Pragma", "no-cache");
  next();
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Fields safe to send to the client (never the password hash). */
function publicUser(user: IUser) {
  return {
    _id: String(user._id),
    name: user.name || undefined,
    email: user.email || undefined,
    phone: user.phone || undefined,
    role: user.role,
  };
}

function generateToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: "7d" });
}

/** Normalise phone: strip spaces/dashes, ensure leading + */
function normalisePhone(raw: string): string {
  let p = raw.replace(/[\s\-().]/g, "");
  if (!p.startsWith("+")) p = "+91" + p.replace(/^0/, ""); // default India (+91)
  return p;
}

// ── Twilio (optional) — only active when credentials are in .env ──────────────
async function createTwilioClient() {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const phone = process.env.TWILIO_PHONE;
  if (
    !sid   || sid   === "your_twilio_account_sid_here"   ||
    !token || token === "your_twilio_auth_token_here"     ||
    !phone || phone === "+1234567890"
  ) return null;

  try {
    const twilioModule = await import("twilio");
    const twilioFn = (twilioModule as any).default || twilioModule;
    return twilioFn(sid, token);
  } catch {
    return null;
  }
}

// ── SMS dispatch: Twilio → console fallback ───────────────────────────────────
async function sendSmsOtp(
  phone: string,
  otp: string
): Promise<"sms" | "console"> {
  const client = await createTwilioClient();

  if (client) {
    await client.messages.create({
      body: `Your Eco-DPI login code is: ${otp}. Valid for 10 minutes. Do not share.`,
      from: process.env.TWILIO_PHONE,
      to: phone,
    });
    return "sms";
  }

  if (!isDev()) {
    throw new Error("Twilio SMS is not configured");
  }

  // Dev fallback — print to server console
  console.log(`\n${"=".repeat(60)}`);
  console.log(`[SMS OTP — DEV]  Phone: ${phone}   →   OTP: ${otp}`);
  console.log(`${"=".repeat(60)}\n`);
  return "console";
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const rawName = String(req.body?.name || "").trim();
    const name = rawName.slice(0, 60);

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });
    if (!EMAIL_RE.test(email))
      return res.status(400).json({ error: "Enter a valid email address" });
    if (password.length < 8)
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    if (password.length > 200)
      return res.status(400).json({ error: "Password is too long" });
    if (name && name.length < 2)
      return res.status(400).json({ error: "Name must be at least 2 characters" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "An account with this email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name || undefined,
      email,
      identity: email,
      passwordHash,
      role: "citizen",
    });

    const token = generateToken(user._id.toString());
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("[auth] register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

/** Shared password check used by both the citizen and admin sign-in routes. */
async function verifyPasswordLogin(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash) return null;

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return null;

  return user;
}

// ── POST /api/auth/login/password ─────────────────────────────────────────────
router.post("/login/password", async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await verifyPasswordLogin(email, password);
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = generateToken(user._id.toString());
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("[auth] login/password error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ── POST /api/auth/login/admin ────────────────────────────────────────────────
// Same credential check, but only issues a session for accounts whose database
// role is "admin". There is no public administrator sign-up.
router.post("/login/admin", async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || "").trim();
    const password = String(req.body?.password || "");
    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required" });

    const user = await verifyPasswordLogin(email, password);
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    if (user.role !== "admin")
      return res.status(403).json({ error: "This account does not have administrator access" });

    const token = generateToken(user._id.toString());
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("[auth] login/admin error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ── POST /api/auth/otp/send ───────────────────────────────────────────────────
// Body: { phone: "+919876543210" }
router.post("/otp/send", async (req: Request, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone || String(phone).trim() === "")
      return res.status(400).json({ error: "Phone number is required" });

    const normalised = normalisePhone(String(phone));
    const digits = normalised.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 15)
      return res.status(400).json({ error: "Please enter a valid phone number (10–15 digits)" });

    const otp       = crypto.randomInt(100000, 1000000).toString();
    const otpHash   = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpSession.findOneAndUpdate(
      { phone: normalised },
      { otp: otpHash, expiresAt },
      { upsert: true, new: true }
    );

    const delivery = await sendSmsOtp(normalised, otp);

    const payload: Record<string, unknown> = {
      message:
        delivery === "sms"
          ? `OTP sent to ${normalised} via SMS.`
          : "OTP generated (Twilio not configured). Check server console.",
      delivery,
      phone: normalised,
    };

    if (isDev() && delivery === "console") {
      payload.devOtp  = otp;
      payload.devNote = "DEV MODE — Twilio not configured. OTP shown in response for testing.";
    }

    res.json(payload);
  } catch (err) {
    console.error("[auth] otp/send error:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ── POST /api/auth/otp/verify ─────────────────────────────────────────────────
router.post("/otp/verify", async (req: Request, res: Response) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ error: "Phone number and OTP are required" });

    const normalised = normalisePhone(String(phone));
    const session    = await OtpSession.findOne({ phone: normalised });

    if (!session || session.expiresAt < new Date())
      return res.status(400).json({ error: "Invalid or expired OTP" });

    const otpMatches = await bcrypt.compare(String(otp), session.otp);
    if (!otpMatches)
      return res.status(400).json({ error: "Invalid or expired OTP" });

    await OtpSession.deleteOne({ _id: session._id });

    let user = await User.findOne({ phone: normalised });
    if (!user) {
      user = await User.create({
        phone: normalised,
        identity: normalised,
        role: "citizen", // phone users are always citizens
      });
    }

    const token = generateToken(user._id.toString());
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("[auth] otp/verify error:", err);
    res.status(500).json({ error: "OTP verification failed" });
  }
});

// ── POST /api/auth/google/verify (Google ID token verification) ───────────────
router.post("/google/verify", async (req: Request, res: Response) => {
  try {
    const idToken = typeof req.body?.idToken === "string" ? req.body.idToken : "";
    if (!idToken) {
      return res.status(400).json({ error: "Google ID Token is required" });
    }
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      return res.status(503).json({ error: "Google sign-in is not configured on the server" });
    }

    const googleRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );
    if (!googleRes.ok) {
      return res.status(401).json({ error: "Invalid or expired Google token" });
    }

    const payload = (await googleRes.json()) as {
      sub?: string;
      aud?: string;
      iss?: string;
      email?: string;
      email_verified?: string | boolean;
    };
    const { sub: googleId, aud, iss, email, email_verified } = payload;

    if (aud !== clientId || (iss !== "accounts.google.com" && iss !== "https://accounts.google.com")) {
      return res.status(401).json({ error: "Google token was issued for a different application" });
    }
    if (!googleId) {
      return res.status(401).json({ error: "Google token is missing an account id" });
    }
    if (!email || (email_verified !== "true" && email_verified !== true)) {
      return res.status(401).json({ error: "Google account email is not verified" });
    }
    const normalisedEmail = String(email).trim().toLowerCase();

    let user = await User.findOne({ $or: [{ googleId }, { email: normalisedEmail }] });

    if (user) {
      let modified = false;
      if (!user.googleId) { user.googleId = googleId; modified = true; }
      if (isAdminEmail(normalisedEmail) && user.role !== "admin") { user.role = "admin"; modified = true; }
      if (modified) await user.save();
    } else {
      user = await User.create({
        email: normalisedEmail,
        identity: normalisedEmail,
        googleId,
        role: isAdminEmail(normalisedEmail) ? "admin" : "citizen",
      });
    }

    const token = generateToken(user._id.toString());
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error("[auth] google/verify error:", err);
    res.status(500).json({ error: "Google token verification failed" });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get("/me", requireAuth, async (req: Request, res: Response) => {
  res.json({ user: publicUser(req.user as IUser) });
});

export default router;
